/**
 * route.ts — NextAuth catch-all handler (plan D7)
 * Mounts the Auth.js handlers for /api/auth/*.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
