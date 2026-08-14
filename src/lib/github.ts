/**
 * github.ts — plan S6/D2
 * Fetches the user's repo count + last-pushed date from the
 * GitHub REST API at BUILD/ISR time (not per pageview) to stay
 * well under the 60 req/hr unauthenticated limit.
 *
 * Zero-data policy (§5): if the fetch fails or returns nothing,
 * callers hide the strip entirely — never render a "0".
 */
interface GitHubRepo {
  pushed_at?: string;
  archived?: boolean;
  fork?: boolean;
}

/** Small delay+retry wrapper so a transient API blip doesn't break the build. */
async function fetchWithRetry(url: string, attempts = 2): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        // Build-time only; give the API a moment to respond.
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600 }, // ISR: refresh hourly (plan S13)
      });
      if (res.ok) return res;
      lastError = new Error(`GitHub API ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (i === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  throw lastError;
}

export interface GithubStats {
  repoCount: number;
  /** ISO date of the most recent push, or null if unknown. */
  lastPushed: string | null;
}

/**
 * Returns repo count + last push for a GitHub user.
 * Throws on failure — callers catch and hide the strip (§5.1).
 */
export async function getGithubStats(user: string): Promise<GithubStats> {
  // per_page=100 is the max; most portfolios have fewer repos.
  const res = await fetchWithRetry(
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`
  );
  const repos = (await res.json()) as GitHubRepo[];

  const real = repos.filter((r) => !r.archived && !r.fork);
  const lastPushed =
    real
      .map((r) => r.pushed_at)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null;

  return { repoCount: real.length, lastPushed };
}

/**
 * Learning streak comes from the CMS/DB (plan D2) and is only
 * shown when ≥ 2 (plan §5.3) — enforced by the caller.
 */
export function streakVisible(streak: number): boolean {
  return streak >= 2;
}

/** Format "last pushed" as a short relative label. */
export function formatLastPushed(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
