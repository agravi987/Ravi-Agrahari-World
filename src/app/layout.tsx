/**
 * layout.tsx
 * Root layout: fonts (Space Grotesk display + Inter body + Geist Mono
 * for terminal eyebrows), metadata + OG image, no-flash theme script,
 * skip-to-content link (a11y), and the site shell (Header + Footer
 * with deploy badge, plan S9/S10). Mounts the Ctrl+K terminal easter
 * egg (plan §4) and the mobile-nav-busting P0 fixes.
 */
import type { Metadata } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import BackToTop from "@/components/ui/BackToTop";
import CommandPalette from "@/components/ui/CommandPalette";
import CursorGlow from "@/components/ui/CursorGlow";
import RouteProgress from "@/components/ui/RouteProgress";
import SectionRail from "@/components/ui/SectionRail";
import Shortcuts from "@/components/ui/Shortcuts";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Toaster from "@/components/ui/Toast";
import Header from "@/components/Header";
import TerminalEasterEgg from "@/components/TerminalEasterEgg";
import ThemeInit from "@/components/ThemeInit";
import IdleMount from "@/components/ui/IdleMount";
import { getContent, getGalaxy } from "@/lib/content";
import "./globals.css";

/* --- Fonts (plan §1: Space Grotesk headings + Inter/Geist body) --- */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* --- SEO basics (plan §7 S9; OG image auto-generated in opengraph-image.tsx) --- */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* Metadata is DYNAMIC (P24): the title/description/OG read the real
   name + headline from the content layer — no hardcoded identity. */
export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getContent();
  const title = `${config.name} — Cloud, DevOps & AI Explorer`;
  const description = config.headline;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: ["portfolio", "cloud", "devops", "ai", "aws", "docker", "kubernetes"],
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

/** Theme no-flash script moved to ThemeInit.tsx (useServerInsertedHTML)
 *  — React 19 warns on any <script> inside its tree, so the script is
 *  injected into the SSR stream outside React (see ThemeInit.tsx). */

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Header/footer read identity from the content layer (D6) — never hardcoded.
  const { config, projects, posts } = await getContent();
  // Phase 15 (#13): galaxy planets feed the ⌘K palette search (cached
  // per-request — same request as the page's getGalaxy, no extra IO).
  const galaxy = await getGalaxy();

  return (
    // suppressHydrationWarning: the theme script mutates html[data-theme]
    // before React hydrates, so the attribute can differ from SSR output.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/* Phase 10: browser-chrome tint — matches the light paper; the
            ThemeInit script (and lib/theme.applyTheme) swap it on toggle. */}
        <meta name="theme-color" content="#faf9f6" />
        {/* PERF: warm the connection to the CMS image CDN (Cloudinary
            uploads, plan D8) so first image paints don't stall on DNS/TLS. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        {/* Skip link (a11y): first tab stop jumps straight to content
            (skill UX #45 — no nav-heavy page ships without one). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>

        <Header
          name={config.name}
          currentlyLearning={config.currentlyLearning}
          github={config.github}
          availability={config.availability}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          name={config.name}
          github={config.github}
          socialLinks={config.socialLinks}
        />
        {/* Theme no-flash script — injected outside React's tree (see above) */}
        <ThemeInit />
        {/* JSON-LD structured data (P8 SEO) */}
        <JsonLd
          name={config.name}
          url={siteUrl}
          email={config.email}
          github={config.github}
          headline={config.headline}
        />
        {/* Ctrl+K hidden terminal (plan §4) */}
        <TerminalEasterEgg name={config.name} />
        {/* Ctrl/Cmd+K command palette (P7) */}
        <CommandPalette
          email={config.email}
          github={config.github}
          projects={projects.map((p) => ({ title: p.title, description: p.description }))}
          posts={posts.map((p) => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            tags: p.tags,
          }))}
          planets={galaxy.planets.map((p) => ({ name: p.name, slug: p.slug }))}
        />
        {/* Idle-deferred decorative/aux widgets — mount after idle/timeout
            so initial hydration + paint stay lean (no CLS: fixed-position). */}
        <IdleMount timeoutMs={2500}>
          <SectionRail />
          <BackToTop />
          <Toaster />
          <Shortcuts />
          <RouteProgress />
          <CursorGlow />
        </IdleMount>
      </body>
    </html>
  );
}
