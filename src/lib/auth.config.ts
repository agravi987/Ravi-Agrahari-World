/**
 * auth.config.ts — edge-safe base config (plan D7)
 * Contains ONLY what the middleware needs (pages, session settings,
 * jwt callback). NO providers, NO bcrypt, NO Mongoose — those are
 * Node-only and would crash the Edge runtime. auth.ts merges this
 * with the real Credentials provider for the /api/auth route.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Middleware only checks for the session cookie — it never runs a
  // provider, so an empty array satisfies the type without pulling
  // in any Node-only imports (plan D7).
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
} satisfies NextAuthConfig;
