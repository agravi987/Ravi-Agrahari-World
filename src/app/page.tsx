/**
 * page.tsx — Home (server component)
 * Loads ALL content through lib/content.ts (D6) and renders
 * sections in order. Every section auto-hides when its content
 * is empty (plan §5.2) and respects config.sectionsEnabled.
 *
 * revalidate=60 (ISR, plan S13): static with a 60s freshness
 * window — combined with revalidatePath after CMS mutations,
 * content edits go live almost immediately.
 */
import Blog from "@/components/sections/Blog";
import Certifications from "@/components/sections/Certifications";
import Contact from "@/components/sections/Contact";
import Experience from "@/components/sections/Experience";
import GithubStrip from "@/components/sections/GithubStrip";
import Hero from "@/components/sections/Hero";
import LearningGalaxy from "@/components/sections/LearningGalaxy";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import { getContent } from "@/lib/content";

export const revalidate = 60;

export default async function Home() {
  const {
    config,
    skills,
    learningTracks,
    projects,
    experience,
    certifications,
    posts,
  } = await getContent();

  return (
    <>
      {config.sectionsEnabled.hero && (
        <Hero
          name={config.name}
          headline={config.headline}
          roles={config.roles}
          github={config.github}
          email={config.email}
          currentlyLearning={config.currentlyLearning}
        />
      )}

      {/* Momentum strip: repos + streak (plan S6, §5 — hides on failure/zeros) */}
      <GithubStrip config={config} />

      {config.sectionsEnabled.skills && <Skills skills={skills} />}

      {config.sectionsEnabled.galaxy && (
        <LearningGalaxy tracks={learningTracks} weeklyNotes={config.weeklyNotes} />
      )}

      {config.sectionsEnabled.projects && <Projects projects={projects} />}

      {config.sectionsEnabled.experience && <Experience experience={experience} />}

      {config.sectionsEnabled.certifications && (
        <Certifications certifications={certifications} />
      )}

      {config.sectionsEnabled.blog && <Blog posts={posts} />}

      {config.sectionsEnabled.contact && (
        <Contact email={config.email} socialLinks={config.socialLinks} />
      )}
    </>
  );
}
