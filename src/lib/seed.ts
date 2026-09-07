/**
 * seed.ts — seed data layer (plan D6)
 * Stand-in for MongoDB until the DB is wired. Shapes match
 * types/index.ts + types/galaxy.ts EXACTLY so lib/content.ts can
 * swap backends without touching any component. This is honest
 * fresher content for GitHub user `agravi987` — replace freely in
 * the CMS later.
 *
 * Galaxy seed (v4): positions are AUTO-COMPUTED with the same
 * autoLayoutPlanets/autoLayoutMoons the admin uses, so the seeded
 * system is always compact and zero-overlap (plan §4.2). All planets
 * share one locked orbit speed — relative positions are fixed, so
 * overlap is mathematically impossible.
 */
import type { SiteContent } from "@/types";
import type { GalaxyData, GalaxyPlanetWithMoons } from "@/types/galaxy";
import { DEFAULT_GALAXY_SETTINGS } from "@/types/galaxy";
import { autoLayoutMoons, autoLayoutPlanets } from "@/lib/galaxyLayout";

export const seedContent: SiteContent = {
  config: {
    name: "Ravi Agrahari",
    headline: "Turning curiosity about systems into hands-on cloud & AI skills.",
    roles: ["Cloud Enthusiast", "DevOps Learner", "AI Explorer"],
    currentlyLearning: "Kubernetes",
    streak: 4, // CMS field, shown only when ≥ 2 (plan §5.3)
    availability: "Open to internships & full-time roles", // hero pill; empty → hidden
    location: "India · remote-friendly", // "based in" line; empty → hidden (Phase 17)
    email: "agravi987@example.com", // ← replace with real address in CMS
    github: "agravi987",
    socialLinks: [
      { label: "GitHub", url: "https://github.com/agravi987" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/agravi987" },
      { label: "X / Twitter", url: "https://x.com/agravi987" },
    ],
    sectionsEnabled: {
      hero: true,
      skills: true,
      galaxy: true,
      projects: true,
      experience: true, // empty collection → section auto-hides (plan §5.2)
      certifications: true,
      blog: true,
      contact: true,
    },
  },

  skills: [
    {
      name: "Cloud",
      icon: "cloud",
      level: 2, // honest: fundamentals of AWS (EC2, S3, IAM)
      blurb: "AWS fundamentals — EC2, S3, IAM. Working through the Cloud Practitioner path.",
    },
    {
      name: "DevOps",
      icon: "workflow",
      level: 2, // honest: Git + GitHub + basic CI
      blurb: "Git, GitHub Actions basics, containers next. Building this site with CI in mind.",
    },
    {
      name: "AI",
      icon: "bot",
      level: 1, // honest: just started
      blurb: "Prompt engineering + LLM concepts. Learning by building small experiments.",
    },
  ],

  projects: [
    {
      title: "This portfolio",
      description:
        "Next.js + MongoDB + custom CMS. Built to show I can ship full-stack: design, data, auth, deploy.",
      tech: ["Next.js", "TypeScript", "MongoDB", "Tailwind"],
      repoUrl: "https://github.com/agravi987/portfolio",
      demoUrl: "/",
      featured: true,
      order: 0,
      // Phase 13: the slug unlocks /projects/this-portfolio
      slug: "this-portfolio",
      caseStudy: `## Why I built my own CMS

Most portfolios are a template plus a resume. I wanted this one to **prove**
I can ship full-stack — so the site itself is the demo:

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — SSG pages with
  ISR, so content is cached until the CMS invalidates it.
- **MongoDB + Mongoose** — every section reads through one content boundary
  (\`lib/content.ts\`), with seed fallback so fresh clones build without a DB.
- **NextAuth credentials + JWT** — the \`/admin\` CMS is session-gated;
  every mutation revalidates the live site instantly.
- **The Learning Galaxy** — a solar-system viz of skills and the artifacts
  that prove them (three.js on the detail page, DOM fallback everywhere).

### What I learned

1. **Caching is a contract.** Raising the ISR TTL from 60s to 1h cut cold
   renders; every admin write calls \`revalidatePath\`, so "fast" and
   "live edits" are the same thing.
2. **Bundle budgets need CI.** A script fails the build if three.js ever
   sneaks onto the home page — regressions can't ship silently.
3. **Zero-data is a feature.** Nothing renders as 0; empty sections hide.
   The design never lies about what exists yet.`,
    },
    {
      title: "Lambda Image Processor",
      description:
        "Serverless image processing pipeline on AWS Lambda + S3 with an API Gateway front (SAMPLE data).",
      tech: ["AWS", "Lambda", "S3", "Python"],
      repoUrl: "https://github.com/agravi987/lambda-image-processor-SAMPLE",
      featured: false,
      order: 1,
      slug: "lambda-image-processor",
      caseStudy: `## The shape of a serverless pipeline

This sample walks a thumbnail pipeline end to end — the kind of thing a
Cloud role is asked to reason about in an interview:

1. **S3 put-event** fires when an image lands in the input bucket.
2. **Lambda** (Python) reads the object, resizes it with Pillow, and
   writes the thumbnail to an output bucket.
3. **API Gateway** exposes a tiny front so a browser can request a
   thumbnail by key.

\`\`\`python
# handler.py (simplified)
def handler(event, context):
    for record in event["Records"]:
        process_thumbnail(record["s3"]["bucket"]["name"],
                          record["s3"]["object"]["key"])
\`\`\`

### What I learned

- **Cold starts are real** — keep the handler thin and the deps light.
- **IAM least-privilege** — the role only reads input, writes output.
- **Idempotency matters** — a retried event shouldn't double-process.

Next step: a queue (SQS) so big batches don't drop events.`,
    },
  ],

  experience: [
    {
      company: "Sample Company (seed data)",
      role: "DevOps Intern",
      period: "2025-06 → 2025-08",
      description:
        "Sample entry so the timeline is demoable — replace it with a real role via the admin panel.",
      metrics: [
        "Shadowed the CI/CD pipeline — rebuilt a GitHub Actions workflow from scratch",
        "Wrote runbooks for the staging environment",
      ],
      // Phase 16: slug enables #experience-<slug> deep-links; tools render
      // as chips when present (both optional in the CMS).
      slug: "devops-intern",
      tools: ["GitHub Actions", "Docker", "Bash"],
      order: 1,
    },
  ],

  certifications: [
    {
      name: "AWS Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2026-06",
      verifyUrl: "https://www.credly.com/badges/agravi987",
      category: "Cloud",
    },
    {
      name: "GitHub Actions (seed sample)",
      issuer: "Sample Issuer",
      date: "2026-03",
      verifyUrl: "https://example.com/verify/gh-actions",
      category: "DevOps",
    },
    {
      name: "AI Fundamentals (seed sample)",
      issuer: "Sample Issuer",
      date: "2025-11",
      verifyUrl: "https://example.com/verify/ai-fundamentals",
      category: "AI",
    },
  ],

  posts: [
    {
      title: "What I learned setting up this site's CI",
      slug: "what-i-learned-setting-up-ci",
      excerpt:
        "Lint → typecheck → deploy badge. The small pipeline mistakes that teach you the most.",
      contentMarkdown:
        "# What I learned\n\nSetting up CI for this portfolio taught me three small things that each cost a debug session.\n\n## Lint before you build\n\nOne `npm run lint` pass catches what Turbopack happily bundles — a stale import, an unused variable, a broken type. It takes seconds and it's the cheapest feedback loop in the whole pipeline.\n\n## Typecheck in CI, not just locally\n\n`tsc --noEmit` is cheap and finds the drift that only shows up on a clean machine. Your laptop accumulates state; the runner doesn't.\n\n## The deploy badge is just build metadata\n\nRead the env at build time, don't fake it. VERCEL_GIT_COMMIT_SHA + build time is all the badge needs.\n\nA tiny pipeline to start from:\n\n```yaml\nname: ci\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run build\n```\n\nThat's it — every push now has a green or red dot instead of a surprise.",
      tags: ["ci-cd", "github-actions", "learning"],
      publishedAt: "2026-08-10",
    },
    {
      title: "Why I write notes in public",
      slug: "why-i-write-notes-in-public",
      excerpt:
        "Learning in public is uncomfortable — and that's exactly why it works. A short case for the habit.",
      contentMarkdown:
        "# Why I write notes in public\n\nSharing half-formed ideas feels risky. The payoff: feedback, a searchable trail, and a record of how I actually learn.\n\n1. **It forces clarity** — you can't hand-wave in writing.\n2. **It builds a trail** — six months later the notes show the path.\n3. **It attracts the right people** — recruiters and engineers who value curiosity.\n\nConsistency beats polish: short notes, often, beats perfect essays never.\n",
      tags: ["learning", "writing"],
      publishedAt: "2026-08-05",
    },
  ],
};

/* ------------------------------------------------------------------
   Galaxy v4 seed — 12 planets, 29 moons, default settings.
   Orbit radii are monotonic (140 → 1250, computed against the real
   zero-overlap validator) and moon orbits sit OUTSIDE their planet
   disc (planet radius + 16) so every moon is actually visible.
   Speeds: two tiers — inner 6 fast (28 s), outer 6 slow (64 s);
   within a tier speeds match, so those pairs stay locked (P6 §4.4).
   ------------------------------------------------------------------ */

const SAMPLE = (slug: string) => `https://github.com/agravi987/${slug}-SAMPLE`;

interface SeedPlanet {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  size: number;
  /** Not used for positioning — kept for history/display size reference. */
  orbitRadius: number;
  moons: Array<{
    name: string;
    slug: string;
    type: string;
    description: string;
    icon: string;
    technologies: string[];
    githubUrl?: string;
    liveUrl?: string;
    documentationUrl?: string;
  }>;
}

const seedPlanets: SeedPlanet[] = [
  {
    name: "AWS", slug: "aws", icon: "☁️", color: "#ff9900", size: 64, orbitRadius: 140,
    description: "Cloud fundamentals — EC2, S3, Lambda, IAM. Cloud Practitioner path.",
    moons: [
      { name: "Lambda Image Processor", slug: "lambda-image-processor", type: "project", icon: "🚀", description: "Serverless image processing with Lambda + S3 (SAMPLE data).", technologies: ["AWS", "Lambda", "S3", "Python"], githubUrl: SAMPLE("lambda-image-processor") },
      { name: "API Gateway Lab", slug: "api-gateway-lab", type: "lab", icon: "🛠️", description: "Routing, throttling and auth on API Gateway (SAMPLE).", technologies: ["API Gateway", "Lambda"], githubUrl: SAMPLE("api-gateway-lab") },
      { name: "S3 Static Hosting", slug: "s3-static-hosting", type: "lab", icon: "🛠️", description: "S3 bucket + CloudFront for a static site (SAMPLE).", technologies: ["S3", "CloudFront"], githubUrl: SAMPLE("s3-static-hosting") },
      { name: "CloudWatch Notes", slug: "cloudwatch-notes", type: "notes", icon: "🗒️", description: "Metrics, logs and alarms — my running notes (SAMPLE).", technologies: ["CloudWatch"], githubUrl: SAMPLE("cloudwatch-notes") },
    ],
  },
  {
    name: "Docker", slug: "docker", icon: "🐳", color: "#2496ed", size: 60, orbitRadius: 285,
    description: "Images, containers, compose — building multi-container apps.",
    moons: [
      { name: "Docker Compose Project", slug: "docker-compose-project", type: "project", icon: "🚀", description: "A compose stack with app + db + cache (SAMPLE).", technologies: ["Docker", "Compose"], githubUrl: SAMPLE("docker-compose-project") },
      { name: "Docker Networking Lab", slug: "docker-networking-lab", type: "lab", icon: "🛠️", description: "Bridge, host and overlay networks (SAMPLE).", technologies: ["Docker"], githubUrl: SAMPLE("docker-networking-lab") },
      { name: "Dockerfile Notes", slug: "dockerfile-notes", type: "notes", icon: "🗒️", description: "Layers, caching, multi-stage builds (SAMPLE).", technologies: ["Docker"], githubUrl: SAMPLE("dockerfile-notes") },
    ],
  },
  {
    name: "Kubernetes", slug: "kubernetes", icon: "☸️", color: "#326ce5", size: 60, orbitRadius: 365,
    description: "Pods → deployments → services. Currently on the basics.",
    moons: [
      { name: "Microservices Deployment", slug: "microservices-deployment", type: "project", icon: "🚀", description: "A small microservices app on k8s (SAMPLE).", technologies: ["Kubernetes", "Helm"], githubUrl: SAMPLE("microservices-deployment") },
      { name: "Kubernetes Networking Lab", slug: "k8s-networking-lab", type: "lab", icon: "🛠️", description: "Services, ingress, DNS (SAMPLE).", technologies: ["Kubernetes"], githubUrl: SAMPLE("k8s-networking-lab") },
      { name: "HPA Lab", slug: "hpa-lab", type: "lab", icon: "🛠️", description: "Horizontal autoscaling on load (SAMPLE).", technologies: ["Kubernetes", "Metrics Server"], githubUrl: SAMPLE("hpa-lab") },
    ],
  },
  {
    name: "Terraform", slug: "terraform", icon: "🧱", color: "#7b42bc", size: 56, orbitRadius: 445,
    description: "Infrastructure as code — plan, apply, destroy.",
    moons: [
      { name: "AWS Infrastructure Project", slug: "aws-infra-project", type: "project", icon: "🚀", description: "VPC + EC2 + RDS provisioned with Terraform (SAMPLE).", technologies: ["Terraform", "AWS"], githubUrl: SAMPLE("aws-infra-project") },
      { name: "Terraform Modules Notes", slug: "terraform-modules-notes", type: "notes", icon: "🗒️", description: "Modules, state, remote backends (SAMPLE).", technologies: ["Terraform"], githubUrl: SAMPLE("terraform-modules-notes") },
    ],
  },
  {
    name: "Linux", slug: "linux", icon: "🐧", color: "#f59e0b", size: 56, orbitRadius: 525,
    description: "Shell, filesystem, permissions, processes — daily practice.",
    moons: [
      { name: "Shell Scripting Playground", slug: "shell-scripting-playground", type: "project", icon: "🚀", description: "Backup + log-rotation scripts (SAMPLE).", technologies: ["Bash", "cron"], githubUrl: SAMPLE("shell-scripting-playground") },
      { name: "Permissions & Users Lab", slug: "permissions-lab", type: "lab", icon: "🛠️", description: "chmod, ACLs, sudo rules (SAMPLE).", technologies: ["Linux"], githubUrl: SAMPLE("permissions-lab") },
      { name: "Linux Essentials Notes", slug: "linux-essentials-notes", type: "notes", icon: "🗒️", description: "Commands, pipes and process management (SAMPLE).", technologies: ["Linux"], githubUrl: SAMPLE("linux-essentials-notes") },
    ],
  },
  {
    name: "Git", slug: "git", icon: "🌿", color: "#f05032", size: 52, orbitRadius: 605,
    description: "Version control habits — commits, branches, rebases.",
    moons: [
      { name: "Git Workflow Notes", slug: "git-workflow-notes", type: "notes", icon: "🗒️", description: "My everyday git cheatsheet (SAMPLE).", technologies: ["Git"], githubUrl: SAMPLE("git-workflow-notes") },
      { name: "Branching Strategy Lab", slug: "branching-lab", type: "lab", icon: "🛠️", description: "Feature branches + conflict practice (SAMPLE).", technologies: ["Git"], githubUrl: SAMPLE("branching-lab") },
    ],
  },
  {
    name: "GitHub Actions", slug: "github-actions", icon: "⚙️", color: "#2088ff", size: 56, orbitRadius: 850,
    description: "CI/CD pipelines that run on push.",
    moons: [
      { name: "Portfolio CI Pipeline", slug: "portfolio-ci-pipeline", type: "project", icon: "🚀", description: "This site's CI: lint → typecheck → deploy meta (SAMPLE).", technologies: ["GitHub Actions", "CI/CD"], githubUrl: SAMPLE("portfolio-ci-pipeline") },
      { name: "Docker Build Cache Lab", slug: "docker-cache-lab", type: "lab", icon: "🛠️", description: "Speeding up image builds in CI (SAMPLE).", technologies: ["GitHub Actions", "Docker"], githubUrl: SAMPLE("docker-cache-lab") },
    ],
  },
  {
    name: "Python", slug: "python", icon: "🐍", color: "#3776ab", size: 52, orbitRadius: 930,
    description: "Automation, scripting and small tools.",
    moons: [
      { name: "Automation Scripts", slug: "automation-scripts", type: "project", icon: "🚀", description: "File + API automation with Python (SAMPLE).", technologies: ["Python"], githubUrl: SAMPLE("automation-scripts") },
      { name: "Python Basics Notes", slug: "python-basics-notes", type: "notes", icon: "🗒️", description: "Syntax, typing, standard library (SAMPLE).", technologies: ["Python"], githubUrl: SAMPLE("python-basics-notes") },
    ],
  },
  {
    name: "Node.js", slug: "nodejs", icon: "🟢", color: "#339933", size: 52, orbitRadius: 1010,
    description: "REST APIs and backend tooling.",
    moons: [
      { name: "REST API Project", slug: "rest-api-project", type: "project", icon: "🚀", description: "Express API with auth + tests (SAMPLE).", technologies: ["Node.js", "Express"], githubUrl: SAMPLE("rest-api-project") },
      { name: "Express Notes", slug: "express-notes", type: "notes", icon: "🗒️", description: "Middleware, routing, error handling (SAMPLE).", technologies: ["Node.js"], githubUrl: SAMPLE("express-notes") },
    ],
  },
  {
    name: "React", slug: "react", icon: "⚛️", color: "#61dafb", size: 52, orbitRadius: 1090,
    description: "Components, state and the modern ecosystem.",
    moons: [
      { name: "Dashboard Project", slug: "dashboard-project", type: "project", icon: "🚀", description: "A small data dashboard (SAMPLE).", technologies: ["React", "TypeScript"], githubUrl: SAMPLE("dashboard-project") },
      { name: "Hooks Notes", slug: "hooks-notes", type: "notes", icon: "🗒️", description: "useState → useReducer, custom hooks (SAMPLE).", technologies: ["React"], githubUrl: SAMPLE("hooks-notes") },
    ],
  },
  {
    name: "AI & ML", slug: "ai-ml", icon: "🤖", color: "#8b5cf6", size: 56, orbitRadius: 1170,
    description: "LLMs, prompt engineering, small experiments.",
    moons: [
      { name: "Prompt Playground", slug: "prompt-playground", type: "project", icon: "🚀", description: "A tiny LLM playground app (SAMPLE).", technologies: ["AI", "LLM"], githubUrl: SAMPLE("prompt-playground") },
      { name: "LLM Notes", slug: "llm-notes", type: "notes", icon: "🗒️", description: "Tokens, context, RAG concepts (SAMPLE).", technologies: ["AI"], githubUrl: SAMPLE("llm-notes") },
    ],
  },
  {
    name: "PostgreSQL", slug: "postgresql", icon: "🐘", color: "#4169e1", size: 52, orbitRadius: 1250,
    description: "Schema design, indexing and queries.",
    moons: [
      { name: "Schema Design Notes", slug: "schema-design-notes", type: "notes", icon: "🗒️", description: "Normalization, keys, constraints (SAMPLE).", technologies: ["PostgreSQL"], githubUrl: SAMPLE("schema-design-notes") },
      { name: "Query Optimization Lab", slug: "query-optimization-lab", type: "lab", icon: "🛠️", description: "EXPLAIN, indexes, slow-query fixes (SAMPLE).", technologies: ["PostgreSQL"], githubUrl: SAMPLE("query-optimization-lab") },
    ],
  },
];

/** Builds the public GalaxyData (profile is derived from siteConfig in content.ts). */
function buildSeedGalaxy(): GalaxyData {
  let moonOrder = 0;
  // Spiral placeholder so displayOrder drives the layout order.
  const planets: GalaxyPlanetWithMoons[] = seedPlanets.map((p, i) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    icon: p.icon,
    color: p.color,
    size: p.size,
    orbitRadius: 0, // filled by autoLayoutPlanets below
    orbitSpeed: 60,
    orbitAngle: 0,
    displayOrder: i,
    isVisible: true,
    moons: p.moons.map((m, j) => ({
      planetId: p.slug, // seed placeholder — real ObjectIds come from Mongo
      name: m.name,
      slug: m.slug,
      type: m.type,
      description: m.description,
      icon: m.icon,
      githubUrl: m.githubUrl,
      liveUrl: m.liveUrl,
      documentationUrl: m.documentationUrl,
      technologies: m.technologies,
      size: 12,
      orbitRadius: 0, // filled by autoLayoutMoons below
      orbitSpeed: 60,
      orbitAngle: 0,
      isFeatured: j === 0,
      isVisible: true,
      displayOrder: moonOrder++,
    })),
  }));

  // Compact auto-arrange — the SAME pure math the admin's galaxy edit
  // runs, so the seed baseline matches what rebalance produces on any
  // later create/edit. All planets share one locked speed (60 s), so the
  // constellation can never drift into an overlap.
  // Order matters: moon rings first (they set each planet's real sweep,
  // which the planet layout needs to clear), then planet positions.
  for (const p of planets) {
    const ring = autoLayoutMoons(p.size, p.moons);
    const moonPos = new Map(ring.map((l) => [l.slug, l]));
    for (const m of p.moons) {
      const mp = moonPos.get(m.slug);
      if (mp) {
        m.orbitRadius = mp.orbitRadius;
        m.orbitAngle = mp.orbitAngle;
      }
    }
  }

  const allMoons = planets.flatMap((p) => p.moons);
  const planetLayout = autoLayoutPlanets(planets, allMoons);
  const planetPos = new Map(planetLayout.map((l) => [l.slug, l]));

  for (const p of planets) {
    const pos = planetPos.get(p.slug);
    if (pos) {
      p.orbitRadius = pos.orbitRadius;
      p.orbitAngle = pos.orbitAngle;
      p.orbitSpeed = pos.orbitSpeed;
    }
  }

  return { profile: { name: "", tagline: "" }, settings: DEFAULT_GALAXY_SETTINGS, planets };
}

export const seedGalaxy: GalaxyData = buildSeedGalaxy();
