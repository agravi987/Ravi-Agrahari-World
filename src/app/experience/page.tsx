/**
 * experience/page.tsx — the FULL career timeline (one screen per section).
 * The home surface shows the three most recent roles and pills here via
 * ExploreLink; this page renders every role with the same accordion /
 * year-rail / print list by reusing the live component in full mode.
 * Loads through lib/content.ts (D6) — never hardcoded.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Experience from "@/components/sections/Experience";
import { getContent } from "@/lib/content";

// 1h ISR safety net — CMS mutations revalidatePath('/experience') instantly.
export const revalidate = 3600;

export const metadata = {
  title: "Experience & internships",
  description: "Every role on the timeline — click to expand the description, metrics and tools.",
};

export default async function ExperienceArchive() {
  const { experience } = await getContent();

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
        <p className="text-center font-mono text-xs text-accent">~/experience</p>
        <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight text-ink">
          Experience &amp; internships
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Every role on the timeline — early-career, but each one taught me
          something real. Click a role to read it.
        </p>
      </div>
      <Experience experience={experience} />
    </main>
  );
}