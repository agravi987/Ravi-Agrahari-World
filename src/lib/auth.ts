/**
 * auth.ts — full NextAuth v5 config (plan D7)
 * Merges the edge-safe auth.config (pages, session) with the real
 * Credentials provider. This module uses bcrypt + Mongoose (Node
 * only) — it must NEVER be imported by middleware.ts (Edge runtime).
 * Middleware uses auth.config.ts instead (see middleware.ts).
 */
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserModel } from "@/models";
import { connectDb } from "./db";
import { authConfig } from "./auth.config";

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
        if (!email || !password) return null;

        try {
          await connectDb();
          const User = getUserModel();
          const user = await User.findOne({ email }).lean();
          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          // Only what the JWT needs — never the hash.
          return { id: String(user._id), email: user.email };
        } catch {
          return null; // DB down → deny login rather than crash
        }
      },
    }),
  ],
  // No extra signIn gate needed: the `users` collection is the single
  // source of truth, and ONLY the seed script (which requires
  // ADMIN_EMAIL/ADMIN_PASSWORD) can create users (plan D7).
});
