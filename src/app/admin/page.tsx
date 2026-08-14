/**
 * admin/page.tsx — plan D7/S12 shell
 * Admin dashboard landing: links to each collection's manager.
 * Full CRUD (list + forms) lands in S12; middleware.ts gates this
 * whole /admin subtree behind the session (plan D7).
 */
"use client";

import { signOut } from "next-auth/react";

const COLLECTIONS = [
  { name: "siteConfig", description: "Name, headline, roles, streak, sections" },
  { name: "skill", description: "Skill cards with honest level bars" },
  { name: "learningTrack", description: "Planets + moons for the Learning Galaxy" },
  { name: "project", description: "Project cards with tech + links" },
  { name: "experience", description: "Timeline entries" },
  { name: "certification", description: "Badge cards with verify links" },
  { name: "post", description: "Blog notes (markdown)" },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-accent">~/admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Mission Control</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage site content — edits go live instantly.</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-card-border bg-card px-4 py-2 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((c) => (
          <a
            key={c.name}
            href={`/admin/${c.name}`}
            className="rounded-card border border-card-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40"
          >
            <h2 className="font-mono text-sm font-medium text-accent">~/{c.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-ink-faint">open →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
