/**
 * github.ts — plan S6/D2 + Phase 9 perf
 * Fetches the user's repo count + last-pushed date from the
 * GitHub REST API at BUILD/ISR time (not per pageview) to stay
 * well under the 60 req/hr unauthenticated limit.
 *
 * Phase 9: a module-level TTL cache (10 min) sits in front of the
 * network calls — ISR regenerations, admin edits re-rendering the
 * page, and dev-server reloads all reuse the last successful fetch
 * instead of hitting the API again. The per-request `next.revalidate`
 * stays as the ISR-level freshness contract.
 *
 * Zero-data policy (§5): if the fetch fails or returns nothing,
 * callers hide the strip entirely — never render a "0".
 */

/** Phase 9: stale-while-fresh window for the module cache (ms). */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** Phase 9: user → { stats, fetchedAt } module-level memo (server-only). */
const statsCache = new Map<string, { stats: GithubStats; fetchedAt: number }>();
interface GitHubRepo {
  pushed_at?: string;
  archived?: boolean;
  fork?: boolean;
  stargazers_count?: number;
}

interface GitHubUser {
  followers?: number;
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
  /** P26: total stars across real repos (summed from the repos list —
   *  zero extra API calls). Hidden by callers when 0 (§5). */
  starCount: number;
  /** P26: GitHub followers (one extra /users call). 0 on failure —
   *  never kills the strip for a transient followers blip. */
  followers: number;
}

/**
 * Returns repo count + last push for a GitHub user.
 * Throws on failure — callers catch and hide the strip (§5.1).
 *
 * Phase 9 perf: a fresh-enough result (≤ 10 min old) is served from
 * the module cache without touching the network; the cache is also
 * populated on success so repeated renders are instant. A failure
 * evicts the entry (so a stale value never masks a renamed user).
 */
export async function getGithubStats(user: string): Promise<GithubStats> {
  const now = Date.now();
  const cached = statsCache.get(user);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.stats;
  }

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

  // P26: stars are already in the repos payload — sum them (no extra call).
  const starCount = real.reduce((n, r) => n + (r.stargazers_count ?? 0), 0);

  // P26: followers from the /users endpoint — best-effort (a blip here
  // shouldn't hide the repos/streak the strip already has).
  let followers = 0;
  try {
    const u = await fetchWithRetry(
      `https://api.github.com/users/${encodeURIComponent(user)}`
    );
    const userDoc = (await u.json()) as GitHubUser;
    followers = userDoc.followers ?? 0;
  } catch {
    followers = 0;
  }

  const stats: GithubStats = { repoCount: real.length, lastPushed, starCount, followers };
  // Phase 9: memoize the successful result (never cache a thrown fetch —
  // callers would then serve stale stats for a deleted/renamed user).
  statsCache.set(user, { stats, fetchedAt: Date.now() });
  return stats;
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
