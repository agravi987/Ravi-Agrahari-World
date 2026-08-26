/**
 * Footer.tsx — plan S9/S10 + P14 cleanup
 * Three quiet columns: identity (name + ⌘K hint), quick links, and
 * connect (socials + the deploy badge reading public/deploy-meta.json
 * written at build time from Vercel env — VERCEL_GIT_COMMIT_SHA,
 * plan S10). `github`/`name`/`socialLinks` come from the content
 * layer (D6) so nothing is hardcoded.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import BrandIcon, { type BrandIconName } from "@/components/ui/BrandIcon";
import FooterNav, { type FooterLink } from "@/components/ui/FooterNav";
import Kbd from "@/components/ui/Kbd";
import PrintResumeButton from "@/components/PrintResumeButton";
import type { SectionsEnabled } from "@/types";

interface FooterProps {
  name: string;
  github: string;
  socialLinks: { label: string; url: string }[];
  /** CMS section toggles — nav links to hidden sections are omitted
   *  so the footer never offers a dead anchor. */
  sectionsEnabled: SectionsEnabled;
}

interface DeployMeta {
  commit?: string;
  builtAt?: string;
  /** "owner/repo" — written at build time; the old hardcoded
   *  "portfolio" guess pointed every commit link at a 404. */
  repo?: string;
}

/** Which sectionsEnabled key gates each footer link (undefined = always). */
const NAV_LINKS: (FooterLink & { section?: keyof SectionsEnabled })[] = [
  { href: "#hero", label: "Back to top ↑" }, // P27: quick way home from the footer
  { href: "#skills", label: "Skills", section: "skills" },
  { href: "/detailed-galaxy", label: "Galaxy", section: "galaxy" },
  { href: "#projects", label: "Projects", section: "projects" },
  { href: "#experience", label: "Experience", section: "experience" },
  { href: "/blog", label: "Blog", section: "blog" },
  { href: "#contact", label: "Contact", section: "contact" },
];

/** Brand icons for social links (simple-icons, same map as Contact). */
const SOCIAL_BRANDS: Record<string, BrandIconName> = {
  github: "github",
  x: "x",
  twitter: "x",
  linkedin: "linkedin",
};

/** Brand-colored hover for the social links (color pass) — parity with
 *  the hero + contact: GitHub/X go near-ink, LinkedIn goes sky. */
const BRAND_HOVER: Record<string, string> = {
  github: "hover:text-ink",
  x: "hover:text-ink",
  twitter: "hover:text-ink",
  linkedin: "hover:text-topic-cloud-deep",
};

/** Reads the deploy badge file (written at build time by S10 tooling).
 *  Module-cached: the file never changes during a build, so a per-render
 *  readFile was pure disk churn on every ISR regeneration. */
let deployMetaCache: DeployMeta | null | undefined;
async function getDeployMeta(): Promise<DeployMeta | null> {
  if (deployMetaCache !== undefined) return deployMetaCache;
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "deploy-meta.json"), "utf-8");
    deployMetaCache = JSON.parse(raw) as DeployMeta;
  } catch {
    deployMetaCache = null; // file absent pre-deploy — badge just doesn't render
  }
  return deployMetaCache;
}

export default async function Footer({
  name,
  github,
  socialLinks,
  sectionsEnabled,
}: FooterProps) {
  const meta = await getDeployMeta();
  // Hidden sections lose their footer link (no dead anchors).
  const visibleLinks = NAV_LINKS.filter((l) => !l.section || sectionsEnabled[l.section] !== false);

  return (
    <footer className="relative mt-12 border-t border-card-border bg-paper-deep/50">
      {/* Gradient hairline — the footer opens with the brand pair (UX pass) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {/* Identity */}
        <div className="flex flex-col items-start gap-2">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            {/* Brand monogram — the hero's ONE indigo→cyan pair, as a dot */}
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-accent via-accent-cyan to-topic-ai"
            />
            {name}
          </p>
          <p className="text-sm text-ink-soft">
            Built while learning in public ·{" "}
            <span className="rounded-full border border-card-border bg-card px-2 py-0.5 font-mono text-[10px] text-ink-faint">
              orbital v1
            </span>
          </p>
          {/* P25: dynamic copyright + tech credit — honest, no hardcoding */}
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} {name}
          </p>
          <p className="text-xs text-ink-faint">
            Built with Next.js · Tailwind · TypeScript
          </p>
          {/* P26: a quiet, honest privacy note — this site is zero-tracker */}
          <p className="text-xs text-ink-faint">
            No trackers, no cookies — just a portfolio.
          </p>
          {/* ⌘K / ? hints (P7/P15) — hidden on touch devices (no keyboard). */}
          <p className="hidden font-mono text-[10px] text-ink-faint md:block">
            <Kbd>⌘K</Kbd> jump · <Kbd>?</Kbd> shortcuts
          </p>
        </div>

        {/* Quick links (P23: client island — smart anchors work from
            every page, not just home) */}
        <FooterNav links={visibleLinks} />

        {/* Connect + deploy badge */}
        <div className="flex flex-col items-start gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Connect
          </p>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => {
              const brand = SOCIAL_BRANDS[link.label.toLowerCase().replace(/\W/g, "")];
              const brandHover =
                BRAND_HOVER[link.label.toLowerCase().replace(/\W/g, "")];
              return (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`link-underline inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors ${
                    brandHover ?? "hover:text-accent"
                  }`}
                >
                  {brand && <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />}
                  {link.label}
                </a>
              );
            })}
          </div>

          <PrintResumeButton />

          <p className="mt-1 text-xs text-ink-faint">
            Planet icons by{" "}
            <a
              href="https://openmoji.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft underline decoration-dotted underline-offset-2 hover:text-accent"
            >
              OpenMoji
            </a>{" "}
            (CC BY-SA 4.0)
          </p>

          {/* Deploy badge (plan S10) — only when build metadata exists */}
          {meta?.commit && (
            <p className="font-mono text-xs text-ink-faint" title="Latest deploy">
              <span className="text-accent-cyan">●</span>{" "}
              <span className="text-ink-soft">deployed</span>{" "}
              <a
                href={
                  meta.repo
                    ? `https://github.com/${meta.repo}/commit/${meta.commit}`
                    : `https://github.com/${github}` // no repo slug → profile, never a 404
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                {meta.commit.slice(0, 7)}
              </a>
              {meta.builtAt && (
                <>
                  {" · "}
                  {new Date(meta.builtAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
