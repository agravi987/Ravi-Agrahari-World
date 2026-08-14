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
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TerminalEasterEgg from "@/components/TerminalEasterEgg";
import { getContent } from "@/lib/content";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Agravi — Cloud, DevOps & AI Explorer",
  description:
    "Portfolio of a fresher exploring Cloud, DevOps and AI — learning in public with hands-on repos.",
  keywords: ["portfolio", "cloud", "devops", "ai", "aws", "docker", "kubernetes"],
  openGraph: {
    title: "Agravi — Cloud, DevOps & AI Explorer",
    description:
      "Portfolio of a fresher exploring Cloud, DevOps and AI — learning in public with hands-on repos.",
    type: "website",
  },
};

/**
 * Sets html[data-theme] from localStorage BEFORE first paint,
 * so the dark toggle never flashes light content (plan §4).
 * Light is the default when nothing is stored.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : "light"; // light-first portfolio (plan §1)
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) { /* private mode etc. — default to light */ }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Header/footer read identity from the content layer (D6) — never hardcoded.
  const { config } = await getContent();

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}>
      <head>
        {/* Inline (not next/script) so it runs before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
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
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer github={config.github} />
        {/* Ctrl+K hidden terminal (plan §4) */}
        <TerminalEasterEgg />
      </body>
    </html>
  );
}
