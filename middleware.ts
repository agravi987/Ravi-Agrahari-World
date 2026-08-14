/**
 * middleware.ts — plan D7
 * Gates the admin surface: /admin pages and /api/admin/* routes
 * redirect (pages) or 401 (APIs) without a valid NextAuth session.
 *
 * IMPORTANT: uses auth.config.ts (edge-safe), NOT auth.ts — the
 * full config imports bcrypt/Mongoose which crash the Edge runtime.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

  // Public routes pass through.
  if (!isAdminPage && !isAdminApi) return;

  // The login page itself must be reachable unauthenticated.
  if (req.nextUrl.pathname === "/admin/login") return;

  // Unauthenticated → login page for pages, 401 for APIs.
  if (!req.auth) {
    if (isAdminApi) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
