/**
 * projects/[slug]/page.tsx — Phase 13 project case-study pages.
 * One URL per project WITH a slug: the full story (cover, description,
 * tech, links + an optional markdown case study) away from the home
 * wall — hierarchy: card → quick-view dialog → dedicated page.
 *
 * SSG (generateStaticParams) + ISR 1h (same safety-net pattern as the
 * blog — admin mutations revalidatePath the site instantly). A project
 * without a slug has no page (the home dialog only links when a case
 * study exists, so nothing 404s in normal navigation).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CodeBlock from "@/components/blog/CodeBlock";
import Eyebrow from "@/components/ui/Eyebrow";
import { getContent } from "@/lib/content";
import { tagHueClasses } from "@/lib/tagHue";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { projects } = await getContent();
  return projects
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getContent();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return { title: "Case study not found" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Honest excerpt: the description; the case study leads with itself.
  const excerpt = project.caseStudy
    ? project.caseStudy.replace(/[#>*`_\[\]()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
    : project.description;
  return {
    title: `${project.title} — Case study`,
    description: excerpt,
    alternates: {
      canonical: `${siteUrl}/projects/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} — Case study`,
      description: excerpt,
      type: "article",
      url: `${siteUrl}/projects/${project.slug}`,
      // The cover makes the share preview recognizable (only when set).
      images: project.coverImage ? [{ url: project.coverImage }] : undefined,
    },
    twitter: { card: "summary", title: project.title, description: excerpt },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { projects } = await getContent();
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.slug) return notFound();

  const hasCaseStudy = Boolean(project.caseStudy?.trim());
  const hasCover = Boolean(project.coverImage);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // SEO: typed CreativeWork entity for this case study.
  const creativeWork = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description || undefined,
    url: `${siteUrl}/projects/${project.slug}`,
    image: project.coverImage || undefined,
    keywords: project.tech?.join(", ") || undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      {/* SEO: typed entity for this case study */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWork).replace(/</g, "\\u003c") }}
      />
      {/* Breadcrumbs — hierarchy navigation for deep pages */}
      <Breadcrumbs
        items={[
          { label: "Portfolio", href: "/" },
          { label: "Projects", href: "/#projects" },
          { label: project.title },
        ]}
      />
      <Eyebrow label="case-study" cursor />
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {project.title}
      </h1>

      {/* Meta row: featured + tech, then the links */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.featured && (
          <Badge variant="colored" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            ★ featured
          </Badge>
        )}
        {project.tech.map((t) => (
          <Badge key={t} variant="colored" className={tagHueClasses(t)}>
            {t}
          </Badge>
        ))}
      </div>

      {hasCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverImage}
          alt={`${project.title} cover`}
          decoding="async"
          className="mt-8 aspect-[16/9] w-full rounded-card border border-card-border object-cover shadow-card"
        />
      )}

      <p className="mt-8 text-base leading-relaxed text-ink-soft">{project.description}</p>

      {/* Repo / demo — one row, only the links that exist */}
      {(project.repoUrl || project.demoUrl) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-5 py-2.5 text-sm font-medium text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent hover:shadow-card-hover"
            >
              Source code
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target={project.demoUrl.startsWith("/") ? undefined : "_blank"}
              rel={project.demoUrl.startsWith("/") ? undefined : "noopener noreferrer"}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover"
            >
              Live demo
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* The write-up — styled by the shared .markdown system; a project
          without a case study still has a valid page (description above). */}
      {hasCaseStudy && (
        <div className="markdown mt-10 border-t border-card-border pt-8">
          <ReactMarkdown
            components={{
              code(props) {
                const { className, children } = props;
                const isBlock = String(className ?? "").includes("language-");
                if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
                return <code className={className}>{children}</code>;
              },
            }}
          >
            {project.caseStudy ?? ""}
          </ReactMarkdown>
        </div>
      )}

      {/* Back — the case study always returns to the wall */}
      <Link
        href="/#projects"
        className="mt-12 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to all projects
      </Link>
    </article>
  );
}
