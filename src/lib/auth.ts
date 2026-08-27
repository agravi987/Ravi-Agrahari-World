/**
 * auth.ts -- full NextAuth v5 config (plan D7)
 * Merges the edge-safe auth.config (pages, session) with the real
 * Credentials provider. This module uses bcrypt + Mongoose (Node
 * only) -- it must NEVER be imported by proxy.ts (Edge runtime).
 * Proxy uses auth.config.ts instead.
 */
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserModel } from "@/models";
import { connectDb } from "./db";
import { authConfig } from "./auth.config";

/* --- Brute-force brake --------------------------------------------
 * In-memory per-email attempt counter: 6 failures lock the email
 * for 30s. Module-scope (resets on server restart -- fine for a
 * single-admin CMS), and pruned so the Map can't grow unbounded
 * with attacker-supplied emails. authorize() returns null while
 * locked, so the login page shows the normal credentials error.
 */
const MAX_FAILS = 6;
const LOCK_MS = 30 * 1000;
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

function recordAttempt(email: string, ok: boolean) {
  if (ok) {
    attempts.delete(email); // success clears the history
    return;
  }
  const now = Date.now();
  const rec = attempts.get(email) ?? { fails: 0, lockedUntil: 0 };
  rec.fails += 1;
  if (rec.fails >= MAX_FAILS) {
    rec.lockedUntil = now + LOCK_MS;
    // #30: Don't reset fails to 0 — keep the total count so we can
    // implement exponential backoff later. The lockout expires but
    // the fail count persists.
  }
  attempts.set(email, rec);
  if (attempts.size > 10_000) {
    for (const [key, r] of attempts) {
      if (r.lockedUntil + LOCK_MS < now) attempts.delete(key);
    }
  }
}

function lockedOut(email: string): boolean {
  const rec = attempts.get(email);
  if (!rec) return false;
  if (rec.lockedUntil > Date.now()) return true;
  attempts.delete(email); // cooldown expired -- free to try again
  return false;
}

/** Thrown while an email is brute-force locked -- its `code` reaches
 *  the login page so the admin sees "temporarily locked out" instead
 *  of a misleading "invalid credentials" (the old behavior returned
 *  plain null, indistinguishable from a wrong password). */
class LockoutError extends CredentialsSignin {
  code = "account_locked";
}

/**
 * Lazily-computed bcrypt hash of ADMIN_PASSWORD.
 * Read from process.env at call time (not module load) so that
 * Turbopack hot-reloads and late-loaded .env.local files are handled.
 * Hash is cached after first computation for the process lifetime.
 */
let _envPasswordHash: string | null = null;
let _envPasswordHashReady = false;

function getEnvPasswordHash(): string | null {
  if (_envPasswordHashReady) return _envPasswordHash;
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) {
    _envPasswordHash = bcrypt.hashSync(pw, 10);
  }
  _envPasswordHashReady = true;
  return _envPasswordHash;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          return null;
        }

        // Locked out? Deny without even touching the DB (rate-limit
        // the password-guessing itself, not just the bcrypt cost).
        if (lockedOut(email)) throw new LockoutError();

        // Check .env credentials directly (no DB needed).
        // Values are read from process.env at call time, not module
        // load, so Turbopack HMR and late .env loading work.
        const envEmail = process.env.ADMIN_EMAIL;
        const envPasswordHash = getEnvPasswordHash();
        if (envEmail && envPasswordHash) {
          const emailMatch = email.toLowerCase() === envEmail.toLowerCase();
          if (emailMatch) {
            const passMatch = await bcrypt.compare(password, envPasswordHash);
            if (passMatch) {
              recordAttempt(email, true);
              return { id: "admin-env", email };
            }
            // Wrong password for the admin email -- counts as a failed
            // brute-force attempt.
            recordAttempt(email, false);
            return null;
          }
        }

        // Fallback: check database (for users created by seed script)
        try {
          await connectDb();
          const User = getUserModel();
          const user = await User.findOne({ email }).lean();
          if (!user) {
            recordAttempt(email, false);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            recordAttempt(email, false);
            return null;
          }

          // Only what the JWT needs -- never the hash.
          recordAttempt(email, true);
          return { id: String(user._id), email: user.email };
        } catch {
          // DB down -> deny login rather than crash (and don't count it
          // against the user -- the outage wasn't a wrong password).
          return null;
        }
      },
    }),
  ],
  // No extra signIn gate needed: the `users` collection is the single
  // source of truth, and ONLY the seed script (which requires
  // ADMIN_EMAIL/ADMIN_PASSWORD) can create users (plan D7).
});
