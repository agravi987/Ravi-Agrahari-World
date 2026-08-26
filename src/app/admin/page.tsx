/**
 * admin/page.tsx — plan D7/S12 shell + P10 upgrade
 * Admin dashboard landing: live per-collection counts (server-side,
 * so they're real numbers, not client-shuffled), color-coded cards
 * with the topic-hue accents used across the site. Sign-out is the
 * only client island. Full CRUD lives in /admin/[collection].
 * proxy.ts gates this whole /admin subtree behind the session.
 */
import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import SectionsPanel from "@/components/admin/SectionsPanel";
import ThemeToggle from "@/components/ThemeToggle";
import LiveTimeAgo from "@/components/ui/LiveTimeAgo";
import { connectDb, dbConfigured } from "@/lib/db";
import { getRecentEdits, MODEL_GETTERS, timeAgo } from "@/lib/collections.server";
// Single source of truth: the registry in collections.ts drives the cards
// below — adding a collection there automatically shows up here (no drift).
import { COLLECTIONS } from "@/lib/collections";

/** Topic hues rotate across the cards — colorful but muted (plan §4.1). */
const CARD_HUES = [
  "border-topic-cloud/30",
  "border-topic-devops/30",
  "border-topic-ai/30",
  "border-topic-linux/30",
  "border-topic-mars/30",
  "border-topic-ice/30",
];

export const dynamic = "force-dynamic";

/** Live counts per collection; empty map when Mongo isn't running.
 *  Also returns the unread contact-message count for the inbox badge. */
async function getCounts(): Promise<{
  counts: Record<string, number>;
  unreadMessages: number;
}> {
  if (!dbConfigured()) return { counts: {}, unreadMessages: 0 };
  const mongoose = await connectDb();
  if (!mongoose) return { counts: {}, unreadMessages: 0 };
  try {
    const counts: Record<string, number> = {};
    for (const spec of COLLECTIONS) {
      try {
        counts[spec.key] = await MODEL_GETTERS[spec.key]().countDocuments();
      } catch {
        counts[spec.key] = 0; // a single broken collection shouldn't kill the page
      }
    }
    let unreadMessages = 0;
    try {
      unreadMessages = await MODEL_GETTERS.message().countDocuments({
        read: { $ne: true },
      });
    } catch {
      // inbox badge is best-effort
    }
    return { counts, unreadMessages };
  } catch {
    return { counts: {}, unreadMessages: 0 };
  }
}

export default async function AdminDashboard() {
  // Session guard is in admin/layout.tsx -- this page inherits it.
  const { counts, unreadMessages } = await getCounts();
  // Phase 12: cross-collection "recently edited" feed (updatedAt).
  // Empty when Mongo is off — no fake zeros, consistent with the counts.
  const recent = Object.keys(counts).length > 0 ? await getRecentEdits(6) : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-accent">~/admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Mission Control</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage site content — edits go live instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>

      {/* Why the counts below are missing — never leave the admin guessing
          between seed mode and a down database (zero-data ≠ silent). */}
      {!dbConfigured() ? (
        <div
          role="status"
          className="mt-6 rounded-card border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          <span className="font-semibold">Seed mode — edits can&apos;t be saved.</span>{" "}
          <code className="font-mono text-xs">MONGODB_URI</code> isn&apos;t set, so the site
          runs on bundled seed data. Add it to <code className="font-mono text-xs">.env.local</code>,
          restart, and run <code className="font-mono text-xs">npm run seed</code> to start editing.
        </div>
      ) : Object.keys(counts).length === 0 ? (
        <div
          role="status"
          className="mt-6 rounded-card border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          <span className="font-semibold">MongoDB unreachable.</span> Counts and edits are
          unavailable right now — check that your database is running and reachable.
        </div>
      ) : null}

      {/* P10: collection stats strip — real counts, shown only when Mongo is up */}
      {Object.keys(counts).length > 0 && (
        <p className="mt-6 font-mono text-xs text-ink-faint" aria-live="polite">
          {COLLECTIONS.filter((c) => counts[c.key] > 0).length} collections live ·{" "}
          {Object.values(counts).reduce((n, c) => n + c, 0)} total documents
        </p>
      )}

      {/* P21: quick actions — the two most frequent CMS moves, one click */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/galaxyPlanet/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-topic-ai/30 bg-topic-ai/10 px-4 py-2 text-sm font-medium text-topic-ai transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          + New planet
        </Link>
        <Link
          href="/admin/post/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-topic-linux/30 bg-topic-linux/10 px-4 py-2 text-sm font-medium text-topic-linux transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          + New note
        </Link>
        <Link
          href="/admin/project/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-topic-cloud/30 bg-topic-cloud/10 px-4 py-2 text-sm font-medium text-topic-cloud transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          + New project
        </Link>
        <a
          href="/detailed-galaxy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:text-accent hover:shadow-card-hover"
        >
          View the galaxy ↗
        </a>
        {/* Phase 11: one click from the CMS to the public home — edits
            are live the moment you save, so verify them instantly. */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:text-accent hover:shadow-card-hover"
        >
          View the site ↗
        </a>
      </div>

      {/* Section visibility quick-toggles — the most-used control for a
          growing portfolio (hide what isn't ready yet). Needs Mongo; the
          panel's own empty-state covers the seed-mode case otherwise. */}
      {Object.keys(counts).length > 0 && (
        <div className="mt-8">
          <SectionsPanel />
        </div>
      )}

      {/* Phase 12: recently edited feed — the freshest docs, newest first */}
      {recent.length > 0 && (
        <section className="mt-10" aria-labelledby="recent-edits-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="recent-edits-heading" className="font-display text-lg font-semibold text-ink">
              Recently edited
            </h2>
            <span className="font-mono text-xs text-ink-faint">newest first</span>
          </div>
          <ol className="mt-4 divide-y divide-card-border overflow-hidden rounded-card border border-card-border bg-card shadow-card">
            {recent.map((r) => (
              <li key={`${r.collection}-${r.id}`}>
                <a
                  href={r.href}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper/60"
                >
                  <span className="hidden w-24 shrink-0 font-mono text-[10px] uppercase tracking-wide text-accent sm:inline">
                    {r.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink group-hover:text-accent">
                    {r.title}
                  </span>
                  <time
                    dateTime={r.updatedAt.toISOString()}
                    className="shrink-0 font-mono text-xs text-ink-faint"
                    title={r.updatedAt.toLocaleString()}
                  >
                    {/* Live island: server value first, then re-renders
                        every 30s so "just now" doesn't freeze. */}
                    <LiveTimeAgo iso={r.updatedAt.toISOString()} fallback={timeAgo(r.updatedAt)} />
                  </time>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  >
                    →
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((c, i) => (
          <a
            key={c.key}
            href={`/admin/${c.key}`}
            className={`group relative rounded-card border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${CARD_HUES[i % CARD_HUES.length]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-mono text-sm font-medium text-accent">~/{c.key}</h2>
              <div className="flex shrink-0 items-center gap-1.5">
                {/* Unread-inbox badge — a full inbox is invisible in a raw
                    count; the amber chip says "someone wrote to you". */}
                {c.key === "message" && unreadMessages > 0 && (
                  <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-medium text-amber-700 dark:text-amber-300">
                    {unreadMessages} unread
                  </span>
                )}
                {/* Live count badge — hidden while Mongo is off (no fake zeros) */}
                {counts[c.key] !== undefined && (
                  <span className="rounded-full border border-card-border bg-paper-deep px-2 py-0.5 font-mono text-xs text-ink-soft">
                    {counts[c.key]}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors group-hover:text-accent">
              open
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
