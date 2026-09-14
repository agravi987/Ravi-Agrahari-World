/**
 * certifications/page.tsx — the FULL certification spotlight (one screen
 * per section). The home surface shows a taste and pills here via
 * ExploreLink; this page renders every certification with the same
 * spotlight switcher + category filter by reusing the live component in
 * full mode. Loads through lib/content.ts (D6) — never hardcoded.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Certifications from "@/components/sections/Certifications";
import { getContent, getGalaxy } from "@/lib/content";

// 1h ISR safety net — CMS mutations revalidatePath('/certifications') instantly.
export const revalidate = 3600;

export const metadata = {
  title: "Certifications",
  description: "Every verified certification, checkable from its issuer — pick one below.",
};

export default async function CertificationsArchive() {
  const { certifications } = await getContent();
  const galaxy = await getGalaxy();

  // Phase 16: category → planet cross-link (name/slug matched), same as home.
  const galaxyCategorySlugs = Object.fromEntries(
    galaxy.planets.flatMap((p) => [
      [p.name.toLowerCase(), p.slug],
      [p.slug.toLowerCase(), p.slug],
    ])
  );

  return (
    <main id="main">
      <div className="mx-auto max-w-5xl px-6 pb-2 pt-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <p className="text-center font-mono text-xs text-accent">~/certifications</p>
        <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight text-ink">
          Certifications
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Every one, with a link to prove it — {certifications.length} certification
          {certifications.length === 1 ? "" : "s"} in the list. Check them yourself.
        </p>
      </div>
      <Certifications
        certifications={certifications}
        galaxyCategorySlugs={galaxyCategorySlugs}
      />
    </main>
  );
}