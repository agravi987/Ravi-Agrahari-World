/**
 * GithubStrip.tsx — plan S6/D2
 * Small momentum strip: repo count + last pushed (from GitHub,
 * fetched at build time by lib/github.ts) + learning streak (CMS).
 * ZERO-DATA POLICY (§5): renders nothing if stats fail or if any
 * value would show as 0. Streak only when ≥ 2.
 */
import { BookOpen, Flame } from "lucide-react";
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

  const { repoCount, lastPushed } = stats;
  const showStreak = streakVisible(config.streak);

  // Nothing safe to show → render nothing at all (§5.1)
  if (repoCount < 1 && !showStreak) return null;

  return (
    <div
      aria-label="GitHub activity"
      className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-6"
    >
      {repoCount >= 1 && (
        <a
          href={`https://github.com/${config.github}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
          <strong className="font-semibold text-ink">{repoCount}</strong>
          {repoCount === 1 ? "repo" : "repos"}
          {lastPushed && (
            <>
              <span className="text-ink-faint">·</span>
              <span>last pushed {formatLastPushed(lastPushed)}</span>
            </>
          )}
        </a>
      )}

      {showStreak && (
        <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
          <Flame className="h-4 w-4 text-accent" aria-hidden="true" />
          <strong className="font-semibold text-ink">{config.streak}</strong>-day
          learning streak
        </span>
      )}
    </div>
  );
}
