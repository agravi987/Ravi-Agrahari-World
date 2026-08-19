/**
 * GithubStrip.tsx — plan S6/D2 + P26
 * Small momentum strip: repo count + last pushed + ★ stars + followers
 * (from GitHub, fetched at build time by lib/github.ts) + learning
 * streak (CMS). ZERO-DATA POLICY (§5): renders nothing if stats fail
 * or if any value would show as 0. Streak only when ≥ 2.
 *
 * P26: stars (summed from the repos payload — no extra API call) and
 * followers (one /users fetch) each get a pill, hidden when 0.
 */
import Link from "next/link";
import { BookOpen, Flame, Star, Users } from "lucide-react";
import { formatLastPushed, getGithubStats, streakVisible } from "@/lib/github";
import type { SiteConfig } from "@/types";

interface GithubStripProps {
  config: SiteConfig;
}

export default async function GithubStrip({ config }: GithubStripProps) {
  let stats;
  try {
    stats = await getGithubStats(config.github);
  } catch {
    // GitHub unreachable → hide the strip entirely (§5.1: no zeros, no errors)
    return null;
  }

  const { repoCount, lastPushed, starCount, followers } = stats;
  const showStreak = streakVisible(config.streak);

  // Nothing safe to show → render nothing at all (§5.1)
  if (repoCount < 1 && !showStreak && starCount < 1 && followers < 1) return null;

  return (
    <div
      aria-label="GitHub activity"
      className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-6 py-6"
    >
      {repoCount >= 1 && (
        <a
          href={`https://github.com/${config.github}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
          title="Fetched from GitHub at build time"
          className="group inline-flex items-center gap-2.5 rounded-full border border-topic-cloud/30 bg-topic-cloud/10 px-4 py-2 text-sm text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <BookOpen className="h-4 w-4 text-topic-cloud" aria-hidden="true" />
          <strong className="font-semibold text-ink group-hover:text-topic-cloud">{repoCount}</strong>
          {repoCount === 1 ? "repo" : "repos"}
          {lastPushed && (
            <>
              <span className="text-ink-faint" aria-hidden="true">·</span>
              {/* P27: the relative label sits next to the exact ISO date */}
              <span title={`Last pushed ${new Date(lastPushed).toISOString()}`}>
                last pushed {formatLastPushed(lastPushed)}
              </span>
            </>
          )}
        </a>
      )}

      {/* P27: the one-link profile pill — always there, quiet */}
      <a
        href={`https://github.com/${config.github}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent hover:shadow-card"
      >
        view profile
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">↗</span>
      </a>

      {/* P26: total stars — hidden when 0 (zero-data) */}
      {starCount >= 1 && (
        <span
          title="Stars across all repos"
          className="inline-flex items-center gap-2.5 rounded-full border border-topic-linux/30 bg-topic-linux/10 px-4 py-2 text-sm text-ink-soft"
        >
          <Star className="h-4 w-4 text-topic-linux" aria-hidden="true" />
          <strong className="font-semibold text-ink">{starCount}</strong>
          {starCount === 1 ? "star" : "stars"}
        </span>
      )}

      {/* P26: followers — hidden when 0 (zero-data) */}
      {followers >= 1 && (
        <span
          title="GitHub followers"
          className="inline-flex items-center gap-2.5 rounded-full border border-topic-ai/30 bg-topic-ai/10 px-4 py-2 text-sm text-ink-soft"
        >
          <Users className="h-4 w-4 text-topic-ai" aria-hidden="true" />
          <strong className="font-semibold text-ink">{followers}</strong>
          followers
        </span>
      )}

      {showStreak && (
        <Link
          href="/blog"
          title="See the learning in public — the notes archive"
          className="group inline-flex items-center gap-2.5 rounded-full border border-topic-mars/30 bg-topic-mars/10 px-4 py-2 text-sm text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <Flame className="h-4 w-4 text-topic-mars" aria-hidden="true" />
          <strong className="font-semibold text-ink group-hover:text-topic-mars">{config.streak}</strong>
          -day learning streak
        </Link>
      )}
    </div>
  );
}
