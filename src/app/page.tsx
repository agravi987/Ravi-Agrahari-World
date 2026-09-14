/**
 * page.tsx — Home (server component)
 * Loads ALL content through lib/content.ts (D6) and renders
 * sections in order. Every section auto-hides when its content
 * is empty (plan §5.2) and respects config.sectionsEnabled.
 *
 * revalidate=3600 (ISR, plan S13 + Phase 9 perf): static with a 1h
 * freshness safety net. Edits go live INSTANTLY via revalidatePath
 * after CMS mutations (admin routes); the TTL is only a crash/fallback
 * so nearly every visit serves the cached page (~0.3s) instead of
 * paying a full DB re-render every minute.
 */
import LazyMount from "@/components/ui/LazyMount";
import SectionPlaceholder from "@/components/ui/SectionPlaceholder";
import type { Stat } from "@/components/ui/MomentumStats";
import Blog from "@/components/sections/Blog";
import Certifications from "@/components/sections/Certifications";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import GalaxyPreview from "@/components/sections/GalaxyPreview";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import { getContent, getGalaxy } from "@/lib/content";
import GuideAstronaut from "@/components/ui/GuideAstronaut";

export const revalidate = 3600;

export default async function Home() {
  const { config, skills, projects, experience, certifications, posts } =
    await getContent();
  const galaxy = await getGalaxy();

  // First CMS-enabled section, in page order — the hero scroll cue jumps
  // here so it can never point at a hidden section (audit #28).
  const firstEnabledSection = (
    [
      "skills",
      "projects",
      "experience",
      "certifications",
      "blog",
      "contact",
    ] as const
  ).find((id) => config.sectionsEnabled[id]);

  // Content-count proof stats — shown inside the Skills section
  // (count-up + jump-links). Only enabled sections contribute a stat;
  // the band's own zero-data policy hides any empty cell.
  const stats: Stat[] = [
    ...(config.sectionsEnabled.projects
      ? [{ label: "projects", value: projects.length, color: "cloud" as const, href: "#projects" }]
      : []),
    ...(config.sectionsEnabled.blog
      ? [{ label: "notes", value: posts.length, color: "linux" as const, href: "/blog" }]
      : []),
    ...(config.sectionsEnabled.certifications
      ? [{ label: "certifications", value: certifications.length, color: "ai" as const, href: "#certifications" }]
      : []),
    ...(config.sectionsEnabled.skills
      ? [{ label: "skill areas", value: skills.length, color: "devops" as const, href: "#skills" }]
      : []),
    ...(config.sectionsEnabled.galaxy
      ? [{ label: "learning tracks", value: galaxy.planets.length, color: "mars" as const, href: "/detailed-galaxy" }]
      : []),
  ];

  return (
    <>
      <div className="page-home">
      {config.sectionsEnabled.hero && (
        /* P31 proof-strip counts pass only while a section is CMS-enabled,
           so disabled sections never leak "0 shipped" chips; Hero's own
           zero-data policy additionally hides any empty chip. */
        <Hero
          name={config.name}
          headline={config.headline}
          roles={config.roles}
          email={config.email}
          socialLinks={config.socialLinks}
          currentlyLearning={config.currentlyLearning}
          streak={config.streak}
          availability={config.availability}
          profileImage={config.profileImage}
          firstEnabledSection={firstEnabledSection}
          projectsCount={config.sectionsEnabled.projects ? projects.length : 0}
          experienceCount={
            config.sectionsEnabled.experience ? experience.length : 0
          }
        />
      )}

      {/* PERF + progressive disclosure: Skills is deferred like the other
          below-fold sections (LazyMount) — it mounts just before scrolling
          into view, so the first paint + hydration stays lean. The proof
          stats (stats) ride inside it: count-up + jump-links, only for
          sections enabled in the CMS. */}
      {config.sectionsEnabled.skills && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="skills"
              className="band-bg relative"
              messages={["aligning the skill orbits…", "weighing the levels…"]}
            />
          }
        >
          {/* Phase 14: name-matched planet slugs let each skill deep-link
              straight to its planet in the galaxy (when names align). */}
          <Skills
            skills={skills}
            galaxyPlanetSlugs={Object.fromEntries(
              galaxy.planets.map((p) => [p.name.toLowerCase(), p.slug])
            )}
            fit
            cue
            stats={stats}
          />
        </LazyMount>
      )}

      {/* Learning Galaxy home preview (v4) — minimal: sun + planets + description.
          Server-rendered (zero client JS): mounts with the page. */}
      {config.sectionsEnabled.galaxy && <GalaxyPreview galaxy={galaxy} />}

      {config.sectionsEnabled.projects && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="projects"
              messages={["lining up the demos…", "polishing the case studies…"]}
            />
          }
        >
          <Projects projects={projects} github={config.github} fit cue exploreHref="/projects" />
        </LazyMount>
      )}

      {config.sectionsEnabled.experience && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="experience"
              className="band-bg relative"
              messages={["unrolling the career map…", "rewinding the timeline…"]}
            />
          }
        >
          <Experience
            experience={experience}
            fit
            cue
            surfaceCount={3}
            exploreHref="/experience"
          />
        </LazyMount>
      )}

      {config.sectionsEnabled.certifications && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="certifications"
              messages={["dusting off the certificates…", "framing the achievements…"]}
            />
          }
        >
          {/* Phase 16: category → planet cross-link (name/slug matched) */}
          <Certifications
            certifications={certifications}
            galaxyCategorySlugs={Object.fromEntries(
              galaxy.planets.flatMap((p) => [
                [p.name.toLowerCase(), p.slug],
                [p.slug.toLowerCase(), p.slug],
              ])
            )}
            fit
            cue
            limit={4}
            exploreHref="/certifications"
          />
        </LazyMount>
      )}

      {config.sectionsEnabled.blog && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="blog"
              className="band-bg relative"
              messages={["opening the notebook…", "sharpening the pencils…"]}
            />
          }
        >
          <Blog posts={posts} fit cue />
        </LazyMount>
      )}

      {config.sectionsEnabled.contact && (
        <LazyMount
          fallback={
            <SectionPlaceholder
              id="contact"
              messages={["warming up the inbox…", "clearing the desk…"]}
            />
          }
        >
          <Contact
            email={config.email}
            socialLinks={config.socialLinks}
            availability={config.availability}
            location={config.location}
            fit
          />
        </LazyMount>
      )}
    </div>
    <GuideAstronaut />
    </>
  );
}
