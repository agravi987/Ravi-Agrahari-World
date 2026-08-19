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
import MomentumStats from "@/components/ui/MomentumStats";
import LazyMount from "@/components/ui/LazyMount";
import SectionPlaceholder from "@/components/ui/SectionPlaceholder";
import SectionDivider from "@/components/ui/SectionDivider";
import Blog from "@/components/sections/Blog";
import Certifications from "@/components/sections/Certifications";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import GalaxyPreview from "@/components/sections/GalaxyPreview";
import GithubStrip from "@/components/sections/GithubStrip";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import TechMarquee from "@/components/sections/TechMarquee";
import { getContent, getGalaxy } from "@/lib/content";

export const revalidate = 3600;

export default async function Home() {
  const { config, skills, projects, experience, certifications, posts } =
    await getContent();
  const galaxy = await getGalaxy();

  return (
    <div className="page-home">
      {config.sectionsEnabled.hero && (
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
        />
      )}

      {/* Tech ticker (P9) — colorful infinite scroll, CSS-only, data-driven */}
      <TechMarquee skills={skills} galaxy={galaxy} />

      {/* Momentum strip: repos + streak (plan S6, §5 — hides on failure/zeros) */}
      <GithubStrip config={config} />

      {/* Real-data stat band (P7) — counts up on scroll, zero-hiding */}
      {/* P22: each stat is also a jump — counters become navigation */}
      <MomentumStats
        stats={[
          { label: "projects", value: projects.length, color: "cloud", href: "#projects" },
          { label: "notes", value: posts.length, color: "linux", href: "/blog" },
          { label: "certifications", value: certifications.length, color: "ai", href: "#certifications" },
          { label: "skill areas", value: skills.length, color: "devops", href: "#skills" },
          { label: "galaxy planets", value: galaxy.planets.length, color: "mars", href: "/detailed-galaxy" },
        ]}
      />

      {/* P30: colorful section divider — visual rhythm between major sections */}
      <SectionDivider />

      {/* PERF + progressive disclosure: the below-fold sections are
          deferred (LazyMount) — they mount just before scrolling into
          view, so the first paint + hydration stay lean and the page
          reveals itself "one section at a time". A witty placeholder
          (SectionPlaceholder) holds the anchor id + reserves height. */}
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
          <Projects projects={projects} github={config.github} />
        </LazyMount>
      )}

      {/* P30: colorful section divider — visual rhythm between major sections */}
      <SectionDivider />

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
          <Experience experience={experience} />
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
          />
        </LazyMount>
      )}

      {/* P30: colorful section divider — visual rhythm between major sections */}
      <SectionDivider />

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
          <Blog posts={posts} />
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
          />
        </LazyMount>
      )}
    </div>
  );
}
