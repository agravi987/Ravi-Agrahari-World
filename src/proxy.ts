/**
 * proxy.ts — Next.js 16 renamed middleware.ts → proxy.ts (plan D7)
 *
 * 1. Applies lightweight security headers to all responses (CSP-ish,
 *    frame protection, content-type sniffing, etc.)
 * 2. Then gates the admin surface: /admin pages and /api/admin/* routes
 *    redirect (pages) or 401 (APIs) without a valid NextAuth session.
 *
 * LOCATION: must sit at the same level as `app` — src/proxy.ts,
 * because this project uses the src/ layout. A root-level proxy.ts
 * is silently ignored (verified on Next 16.3).
 *
 * IMPORTANT: uses auth.config.ts (edge-safe), NOT auth.ts — the
 * full config imports bcrypt/Mongoose which crash the Edge runtime.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function applySecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "sameorigin");
  // Keep Googlebot's hands off what you want indexed.
  headers.set("X-Robots-Tag", "noindex");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const proxy = auth((req, res) => {
  // 1. Security headers on every response that goes out through this
  //    middleware (admin surface + /api/upload). Public pages bypass it
  //    entirely, so headers here are a supplement, not a blanket.
  if (res && typeof res === "object" && "headers" in res) {
    applySecurityHeaders(res as unknown as Response);
  }

  // 2. Admin gates.
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

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/upload"],
};
