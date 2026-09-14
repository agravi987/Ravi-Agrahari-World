/**
 * projects/page.tsx — the FULL projects wall (one screen per section).
 * The home surface teases a few cards and pills here via ExploreLink;
 * this page renders every project with the same interactive grid/filters
 * by reusing the live component in full mode (no exploreHref).
 * Loads through lib/content.ts (D6) — never hardcoded.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Projects from "@/components/sections/Projects";
import { getContent } from "@/lib/content";

// 1h ISR safety net — CMS mutations revalidatePath('/projects') instantly.
export const revalidate = 3600;

export const metadata = {
  title: "Projects",
  description: "Every project and case study — small, real, shipped, click one to open it.",
};

export default async function ProjectsArchive() {
  const { projects, config } = await getContent();

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
        <p className="text-center font-mono text-xs text-accent">~/projects</p>
        <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight text-ink">
          Projects
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          The full wall — {projects.length} project
          {projects.length === 1 ? "" : "s"}, filters and all. Every one taught
          me something I can point to.
        </p>
      </div>
      <Projects projects={projects} github={config.github} />
    </main>
  );
}