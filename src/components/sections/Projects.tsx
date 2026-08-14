/**
 * Projects.tsx — plan S7
 * Card grid with tech badges + GitHub/live links. Featured project
 * gets a larger lead card. Auto-hides when empty (plan §5.2).
 */
import { ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import type { Project } from "@/types";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  if (projects.length === 0) return null; // auto-hide (§5.2)

  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <Section
      id="projects"
      eyebrow="projects"
      title="Projects"
      description="Small, real, shipped — every one taught me something I can point to."
    >
      {featured && (
        <Card hover className="mb-6 p-6 sm:p-8" data-featured>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="accent" className="mb-3">featured</Badge>
              <h3 className="font-display text-2xl font-semibold text-ink">{featured.title}</h3>
              <p className="mt-2 max-w-2xl text-ink-soft">{featured.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {featured.tech.map((t) => (
                  <Badge key={t} variant="neutral">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              {featured.repoUrl && (
                <a
                  href={featured.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              {featured.demoUrl && (
                <a
                  href={featured.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  Live <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((project) => (
            <Card key={project.title} hover className="p-6">
              <h3 className="font-display text-lg font-semibold text-ink">{project.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <Badge key={t} variant="neutral">{t}</Badge>
                ))}
              </div>
              {(project.repoUrl || project.demoUrl) && (
                <div className="mt-4 flex gap-4">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Live demo
                    </a>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
