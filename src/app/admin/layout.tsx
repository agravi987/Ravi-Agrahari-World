/**
 * admin/layout.tsx -- admin shell.
 * SEO defense-in-depth: proxy.ts already blocks unauthenticated requests,
 * but a crawler that somehow reaches an /admin URL (an expired-session
 * link shared publicly, etc.) must be told not to index it. The robots
 * meta here covers every page in the subtree.
 *
 * Session guard: proxy.ts gates access and individual pages do their
 * own auth() check. This layout does NOT redirect -- it would create
 * an infinite loop on /admin/login which lives under this layout.
 * The AuthProvider wraps children so client components can use
 * signIn()/signOut()/useSession().
 */
import type { Metadata } from "next";
import AuthProvider from "@/components/admin/AuthProvider";
import AdminShortcuts from "@/components/admin/AdminShortcuts";

export const metadata: Metadata = {
  title: "Mission Control",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShortcuts />
      {children}
    </AuthProvider>
  );
}
