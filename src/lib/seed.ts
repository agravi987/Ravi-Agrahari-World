/**
 * seed.ts — seed data layer (plan D6)
 * Stand-in for MongoDB until S11 wires Mongoose. Shapes match
 * types/index.ts EXACTLY so lib/content.ts can swap backends
 * without touching any component. This is honest fresher content
 * for GitHub user `agravi987` — replace freely in the CMS later.
 */
import type { SiteContent } from "@/types";

export const seedContent: SiteContent = {
  config: {
    name: "Agravi",
    headline: "Turning curiosity about systems into hands-on cloud & AI skills.",
    roles: ["Cloud Enthusiast", "DevOps Learner", "AI Explorer"],
    currentlyLearning: "Kubernetes",
    streak: 4, // CMS field, shown only when ≥ 2 (plan §5.3)
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
    weeklyNotes: [
      "Wrapped up Docker basics — built my first multi-container compose app.",
      "Started Kubernetes: pods → deployments → services, taking it slow.",
      "Pushed daily Linux shell practice; awk is finally starting to click.",
    ],
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

  learningTracks: [
    {
      name: "Linux",
      icon: "🐧",
      color: "topic-linux",
      level: "learning",
      description: "Shell, filesystem, permissions, processes.",
      order: 0,
      items: [
        {
          type: "notes",
          title: "Linux essentials notes",
          description: "My running notes on commands, pipes and permissions.",
          githubUrl: "https://github.com/agravi987/linux-notes",
          tags: ["linux", "shell"],
          updatedAt: "2026-08-01",
        },
        {
          type: "hands-on",
          title: "Shell scripting practice",
          description: "Daily scripts: backup, log rotation, file watchers.",
          githubUrl: "https://github.com/agravi987/linux-scripts",
          tags: ["bash"],
          updatedAt: "2026-07-20",
        },
      ],
    },
    {
      name: "Docker",
      icon: "🐳",
      color: "topic-devops",
      level: "learning",
      description: "Images, containers, compose.",
      order: 1,
      items: [
        {
          type: "hands-on",
          title: "Docker playground",
          description: "Dockerfiles for small apps + compose setups.",
          githubUrl: "https://github.com/agravi987/docker-playground",
          tags: ["docker", "compose"],
          updatedAt: "2026-08-05",
        },
      ],
    },
    {
      name: "Kubernetes",
      icon: "☸️",
      color: "topic-devops",
      level: "beginner",
      description: "Pods, deployments, services — just starting.",
      order: 2,
      items: [
        {
          type: "notes",
          title: "K8s the hard way notes",
          description: "Reading notes on how the pieces fit together.",
          githubUrl: "https://github.com/agravi987/k8s-notes",
          tags: ["kubernetes"],
          updatedAt: "2026-08-10",
        },
      ],
    },
    {
      name: "Networking",
      icon: "🌐",
      color: "topic-mars",
      level: "beginner",
      description: "OSI, TCP/IP, DNS, HTTP.",
      order: 3,
      items: [
        {
          type: "notes",
          title: "Networking fundamentals",
          description: "Notes on how the internet actually works.",
          githubUrl: "https://github.com/agravi987/networking-notes",
          tags: ["networking", "tcp-ip"],
          updatedAt: "2026-06-30",
        },
      ],
    },
    {
      name: "AWS",
      icon: "☁️",
      color: "topic-cloud",
      level: "learning",
      description: "EC2, S3, IAM — cloud practitioner path.",
      order: 4,
      items: [
        {
          type: "hands-on",
          title: "AWS free tier labs",
          description: "Deploying a static site to S3, EC2 experiments.",
          githubUrl: "https://github.com/agravi987/aws-labs",
          tags: ["aws", "s3", "ec2"],
          updatedAt: "2026-07-28",
        },
      ],
    },
    {
      name: "GitHub Actions",
      icon: "⚙️",
      color: "topic-ice",
      level: "learning",
      description: "CI/CD pipelines that run on push.",
      order: 5,
      items: [
        {
          type: "project",
          title: "Portfolio CI badge",
          description: "This site's CI: lint → typecheck → deploy metadata.",
          githubUrl: "https://github.com/agravi987/portfolio",
          tags: ["ci-cd", "github-actions"],
          updatedAt: "2026-08-12",
        },
      ],
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
    },
  ],

  experience: [], // empty on purpose — section auto-hides (plan §5.2)

  certifications: [
    {
      name: "AWS Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2026-06",
      verifyUrl: "https://www.credly.com/badges/agravi987",
      category: "Cloud",
    },
  ],

  posts: [
    {
      title: "What I learned setting up this site's CI",
      slug: "what-i-learned-setting-up-ci",
      excerpt:
        "Lint → typecheck → deploy badge. The small pipeline mistakes that teach you the most.",
      contentMarkdown:
        "# What I learned\n\nSetting up CI for this portfolio taught me…",
      tags: ["ci-cd", "learning"],
      publishedAt: "2026-08-10",
    },
  ],
};
