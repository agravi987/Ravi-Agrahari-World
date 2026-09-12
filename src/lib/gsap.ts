/**
 * gsap.ts — lazy GSAP loader (client-only, bundle-hygiene).
 *
 * WHY A LOADER: gsap core + ScrollTrigger is ~70KB minified. None of
 * it is needed at first paint (every use here is below-the-fold or
 * hover-driven), so it is imported dynamically — never statically —
 * and stays out of the initial route bundle. Next.js code-splits the
 * dynamic import into its own chunk, fetched on first animation use.
 *
 * REDUCED MOTION: NOT handled here. Every consumer follows the repo's
 * established pattern — `const reduceMotion = useReducedMotion()` and
 * an early return in the effect — so reduced-motion users never even
 * fetch the GSAP chunk.
 *
 * CLEANUP: consumers wrap tweens/triggers in gsap.context(..., scope)
 * and return `() => ctx.revert()` from the effect. Revert auto-undoes
 * every tween/trigger created in the context (inline styles restored),
 * which is the same semantic the previous hand-rolled rAF listeners
 * had with their removeEventListener cleanup.
 */

type GsapModules = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

/** Cache the module load so N components share one dynamic import. */
let modulesPromise: Promise<GsapModules> | null = null;

/**
 * Load GSAP + ScrollTrigger and register the plugin (registerPlugin is
 * idempotent, but the cached promise makes it run once per session).
 * Rejects on the server — call it only inside client effects.
 */
export function gsapReady(): Promise<GsapModules> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("gsapReady is client-only"));
  }
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([gsapMod, stMod]) => {
      const gsap = gsapMod.gsap ?? (gsapMod as unknown as { default: GsapModules["gsap"] }).default;
      const ScrollTrigger =
        stMod.ScrollTrigger ?? (stMod as unknown as { default: GsapModules["ScrollTrigger"] }).default;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }
  return modulesPromise;
}
