/**
 * layout.tsx
 * Root layout: fonts (Space Grotesk display + Inter body + Geist Mono
 * for terminal eyebrows), metadata + OG image, no-flash theme script,
 * skip-to-content link (a11y), and the site shell (Header + Footer
 * with deploy badge, plan S9/S10). Mounts the Ctrl+K terminal easter
 * egg (plan §4) and the mobile-nav-busting P0 fixes.
 */
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import BackToTop from "@/components/ui/BackToTop";
import AmbientOrbs from "@/components/ui/AmbientOrbs";
import CommandPalette from "@/components/ui/CommandPalette";
import CursorGlow from "@/components/ui/CursorGlow";
import RouteProgress from "@/components/ui/RouteProgress";
import ScrollProgressBar from "@/components/ui/ScrollProgressBar";
import SectionRail from "@/components/ui/SectionRail";
import PageReveal from "@/components/ui/PageReveal";
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
    alternates: {
      canonical: siteUrl, // child pages override with their own canonical
      // RSS autodiscovery — readers (and browsers) pick this up from
      // <head>; the feed itself lives at /feed.xml.
      types: { "application/rss+xml": `${siteUrl}/feed.xml` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl,
    },
    // X/Twitter shares previously rendered bare text — the card block
    // gives them a real preview (post/project pages override per-slug).
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Browser-chrome tint (P10) — rendered in <head> via the viewport
 *  export; lib/theme.applyTheme swaps it live when themes change. */
export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

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
        {/* PERF: warm the connection to the CMS image CDN (Cloudinary
            uploads, plan D8) so first image paints don't stall on DNS/TLS. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        {/* Skip links (a11y): first tab stops jump past the nav —
            content for readers, contact for recruiters. On sub-pages
            #contact resolves via the home hash fallback. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <a
          href="/\u0023contact"
          className="sr-only focus:not-sr-only focus:absolute focus:left-44 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to contact
        </a>

        {/* Page-load reveal curtain — fires once per session */}
        <PageReveal />

        <Header
          name={config.name}
          currentlyLearning={config.currentlyLearning}
          github={config.github}
          sectionsEnabled={config.sectionsEnabled}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          name={config.name}
          github={config.github}
          socialLinks={config.socialLinks}
          sectionsEnabled={config.sectionsEnabled}
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
          <ScrollProgressBar />
          <CursorGlow />
          <AmbientOrbs />
        </IdleMount>
      </body>
    </html>
  );
}
