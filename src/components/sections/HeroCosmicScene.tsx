/**
 * HeroCosmicScene.tsx (client) — the full-bleed decorative cosmos for the
 * hero (P32 extension). Everything a candidate can see but never clicks:
 *   1. Cosmic-cliffs wash — a paper base + the readability gradient (the
 *      global body::before nebula rides underneath for a unified look).
 *   2. Starfield — ~60 twinkling stars (existing .twinkle/.d1-3 rhythm)
 *      with a few "sparkle" stars that catch the light.
 *   3. Shooting stars — four diagonal dashes (CSS loop, staggered long
 *      delays) that flare and die across the upper sky.
 *   4. Floating planets — three topic PNGs (cloud, web-dev, system-design)
 *      wobbling on their own CSS rhythm at the scene edges; they POP in
 *      with an elastic stagger on load.
 *   5. The spaceship — banks in ONCE with a playful swoop (GSAP entrance),
 *      then rocks side-to-side with a flickering thruster while it hovers
 *      and recedes on the fastest parallax layer.
 *   6. Saturn — migrated here from Hero so ALL decorative parallax lives
 *      in one place. Rises with a springy back-out, drifting opposite the
 *      ship (foreground lensing).
 *
 * MOTION DESIGN (guards, repo rules):
 *   - All layers aria-hidden + pointer-events-none + no-print.
 *   - CSS loops (wobble/rock/shooting/thruster) are transform/opacity-only
 *     and freeze via the global reduced-motion override in globals.css.
 *   - JS motion gates on useReducedMotion() FIRST (never fetches GSAP for
 *     those users) and pointer:fine for pointerdepth + scroll scrub (repo
 *     pattern); the entrances still play for touch users (they are not
 *     pointer-driven, and motion-safe by default).
 *   - GSAP is loaded lazily via gsapReady() and effects clean up with
 *     gsap.context().revert() / killTweensOf — no leaked tweens.
 *
 * DEPTH LAYERS (data-depth): back 10 / mid 22 / front 38 — pointer
 * parallax multiplies cursor offset; nearer bodies slide furthest.
 * SCROLL LAYERS (data-scroll-y): separate scripted y-drift per body,
 * positive drifts WITH the page (recedes), negative rises against it.
 */

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";

/** [x, y, radius] in a 1200×700 canvas. Sparse upper sky densifies
 *  toward the horizon; a handful of r≥1.7 stars sparkle. */
const STARS: Array<[number, number, number]> = [
  [120, 60, 1.2], [260, 180, 1], [150, 340, 1.4], [320, 440, 1], [200, 600, 1.2],
  [420, 90, 1.7], [480, 270, 1], [520, 430, 1.5], [560, 600, 1], [640, 140, 1],
  [700, 340, 1.8], [760, 540, 1], [860, 80, 1.3], [940, 200, 1], [1020, 320, 1.5],
  [1100, 440, 1], [1160, 620, 1.2], [900, 600, 1], [380, 610, 1.4], [1180, 140, 1],
  [90, 560, 1], [40, 140, 1.6], [220, 40, 1], [360, 60, 1.3], [430, 190, 1],
  [540, 80, 1.5], [630, 340, 1], [810, 260, 1.7], [900, 420, 1], [1010, 180, 1.2],
  [1140, 320, 1], [1180, 540, 1.4], [620, 420, 1], [300, 260, 1.5], [480, 560, 1],
  [690, 120, 1.7], [980, 640, 1], [170, 500, 1.3], [760, 420, 1], [830, 600, 1.5],
  [1060, 520, 1], [150, 230, 1.2], [380, 340, 1], [504, 200, 1.6], [720, 470, 1],
  [1040, 120, 1.3], [1180, 40, 1], [260, 550, 1.5], [560, 200, 1], [640, 640, 1.4],
  [740, 90, 1], [870, 340, 1.6], [1110, 240, 1], [70, 300, 1.2], [460, 120, 1.5],
  [390, 470, 1], [880, 40, 1.7], [1120, 680, 1], [60, 640, 1.3], [680, 220, 1],
];

interface PlanetSpec {
  src: string;
  w: number;
  h: number;
  /** CSS bob class (rhythm per body, transform-only). */
  float: string;
  /** Pointer-parallax depth multiplier. */
  depth: number;
  /** Scroll-scrub drift in px (positive recedes with the page). */
  scrollY: number;
  /** Positioning + size. Mobile sizes ~40-64px, desktop ~64-96px. */
  cls: string;
  drop?: string;
}

const PLANETS: PlanetSpec[] = [
  {
    src: "/images/planets/cloud.png",
    w: 960,
    h: 378,
    float: "animate-float-c",
    depth: 10,
    scrollY: 10,
    cls: "left-[4%] top-20 w-14 opacity-80 md:w-24",
  },
  {
    src: "/images/planets/web-dev.png",
    w: 779,
    h: 773,
    float: "animate-float-d",
    depth: 22,
    scrollY: 24,
    cls: "bottom-[30%] left-[1%] w-10 opacity-70 md:w-16",
  },
  {
    src: "/images/planets/system-design.png",
    w: 768,
    h: 768,
    float: "animate-float-e",
    depth: 34,
    scrollY: 34,
    cls: "top-[34%] right-[3%] w-12 opacity-75 md:w-20",
  },
];

function HeroCosmicScene() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  /* Entrance (playful staged arrival) + scroll-scrub depth. */
  useEffect(() => {
    if (reduceMotion) return;
    const hero = rootRef.current?.closest("section#hero") as HTMLElement | null;
    if (!hero) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled) return;
        const ctx = gsap.context(() => {
          // Planets pop in with an elastic bounce, staggered back-to-front.
          const planets = hero.querySelectorAll<HTMLElement>(
            '[data-entrance="planet"]'
          );
          if (planets.length) {
            gsap.fromTo(
              planets,
              { y: 80, scale: 0.5, opacity: 0 },
              {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 1.1,
                ease: "back.out(1.7)",
                stagger: 0.14,
                delay: 0.35,
                immediateRender: true,
                clearProps: "transform,opacity",
              }
            );
          }
          // The ship swoops in from the right with a banking tilt.
          const ship = hero.querySelector<HTMLElement>("[data-hero-ship]");
          if (ship) {
            gsap.fromTo(
              ship,
              { xPercent: 95, yPercent: -55, rotation: 26, opacity: 0 },
              {
                xPercent: 0,
                yPercent: 0,
                rotation: 0,
                opacity: 1,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.9,
                immediateRender: true,
                clearProps: "transform,opacity",
              }
            );
            // Patrol sway: after it parks, the ship drifts side-to-side
            // with a light bank (x + rotation on this layer — the scroll
            // scrub owns `y`, GSAP's component cache merges them safely;
            // pointer:fine only, spins its own axis, RM-skipped).
            if (window.matchMedia("(pointer: fine)").matches) {
              gsap.to(ship, {
                x: 46,
                rotation: 8,
                duration: 2.6,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                repeatDelay: 2.6,
                delay: 3.6,
              });
            }
          }
          // Saturn springs up from below, opposite the ship.
          const saturn = hero.querySelector<HTMLElement>("[data-hero-planet]");
          if (saturn) {
            gsap.fromTo(
              saturn,
              { yPercent: 70, opacity: 0 },
              {
                yPercent: 0,
                opacity: 1,
                duration: 1.2,
                ease: "back.out(1.4)",
                delay: 1.4,
                immediateRender: true,
                clearProps: "transform,opacity",
              }
            );
          }
          // Scroll depth: each body recedes/rises at its own rate so the
          // scene lenses as the hero scrolls out (repo pattern: scrub).
          if (window.matchMedia("(pointer: fine)").matches) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: hero,
                start: "top 50%",
                end: "bottom top",
                scrub: true,
              },
            });
            hero
              .querySelectorAll<HTMLElement>("[data-scroll-y]")
              .forEach((el) => {
                const y = Number(el.dataset.scrollY || 0);
                if (y !== 0) tl.to(el, { y, ease: "none" }, 0);
              });
          }
        });
        dispose = () => ctx.revert();
      })
      .catch(() => {
        /* GSAP failed to load — the scene stays put (safe default). */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduceMotion]);

  /* Pointer-depth parallax (pointer:fine + motion-safe only). */
  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const hero = rootRef.current?.closest("section#hero") as HTMLElement | null;
    if (!hero) return;
    let cancelled = false;
    let pop: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled) return;
        const layers = Array.from(
          hero.querySelectorAll<HTMLElement>("[data-depth]")
        );
        const movers = layers.map((layer) => ({
          d: Number(layer.dataset.depth || 6),
          x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3.out" }),
        }));
        const onMove = (e: PointerEvent) => {
          const cx = e.clientX / hero.clientWidth - 0.5;
          const cy = e.clientY / hero.clientHeight - 0.5;
          for (const m of movers) {
            m.x(cx * m.d);
            m.y(cy * m.d);
          }
        };
        const onLeave = () => {
          for (const m of movers) {
            m.x(0);
            m.y(0);
          }
        };
        hero.addEventListener("pointermove", onMove, { passive: true });
        hero.addEventListener("pointerleave", onLeave, { passive: true });
        pop = () => {
          hero.removeEventListener("pointermove", onMove);
          hero.removeEventListener("pointerleave", onLeave);
          // quickTo spawns plain tweens on later moves — kill them all.
          gsap.killTweensOf(layers);
        };
      })
      .catch(() => {
        /* Pointer depth simply won't apply. */
      });

    return () => {
      cancelled = true;
      pop?.();
    };
  }, [reduceMotion]);

  return (
    <>
      {/* L1 — the wash below everything: paper base, readability gradient,
          starfield, shooting stars. Sits behind the whole hero. */}
      <div
        ref={rootRef}
        aria-hidden="true"
        className="no-print pointer-events-none absolute inset-0 -z-30"
      >
        <div className="absolute inset-0 bg-paper" />
        <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/70 to-paper/10" />
        <svg
          className="h-full w-full opacity-60"
          viewBox="0 0 1200 700"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {STARS.map(([cx, cy, r], i) => {
            const group = i % 4 === 0 ? "twinkle d1" : i % 4 === 2 ? "twinkle d2" : i % 4 === 3 ? "twinkle d3" : "";
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="currentColor"
                className={`${group}${r >= 1.7 ? " sparkle" : ""}`}
              />
            );
          })}
        </svg>
        <span className="shoot-a" aria-hidden="true" />
        <span className="shoot-b" aria-hidden="true" />
        <span className="shoot-c" aria-hidden="true" />
        <span className="shoot-d" aria-hidden="true" />
      </div>

      {/* L2 — foreground floating bodies: above the wash (-z-10) but
          below all content. Distinct depth/scroll layers per body. */}
      <div
        aria-hidden="true"
        className="no-print pointer-events-none absolute inset-0 -z-10"
      >
        {PLANETS.map((p) => (
          <div
            key={p.src}
            data-entrance="planet"
            data-scroll-y={p.scrollY}
            className={`absolute ${p.cls}`}
            style={{ willChange: "transform" }}
          >
            <div data-depth={p.depth} className="relative">
              <div className={`relative ${p.float}`}>
                <Image
                  src={p.src}
                  alt=""
                  width={p.w}
                  height={p.h}
                  fetchPriority="low"
                  sizes="(max-width: 640px) 56px, 96px"
                  className={`h-auto w-full ${p.drop ?? ""}`}
                />
              </div>
            </div>
          </div>
        ))}

        {/* The spaceship — parks top-right, swoops in with a banking tilt,
            then rocks side-to-side with a flickering thruster while it
            hovers. Scales down on mobile (still shown — user pref). */}
        <div
          data-hero-ship
          data-scroll-y={-18}
          className="absolute right-[6%] top-8 w-12 md:right-[12%] md:top-12 md:w-20"
          style={{ willChange: "transform" }}
        >
          <div data-depth={38} className="relative">
            <div className="animate-ship-rock relative">
              <Image
                src="/images/spacecraft/spaceship.png"
                alt=""
                width={2000}
                height={2000}
                fetchPriority="low"
                sizes="(max-width: 640px) 48px, 80px"
                className="h-auto w-full drop-shadow-[0_10px_20px_rgba(31,27,79,0.25)]"
              />
              <span
                aria-hidden="true"
                className="animate-thruster absolute -bottom-1.5 left-1/2 -ml-[2px] h-2.5 w-1 rounded-full bg-accent-cyan/80 blur-[2px]"
              />
            </div>
          </div>
        </div>

        {/* Saturn — now visible on mobile too (smaller), same lensing. */}
        <div
          data-hero-planet
          data-scroll-y={-20}
          className="absolute -bottom-[6%] -right-6 w-[min(48vw,220px)] md:-right-[4%] md:w-[min(70vw,540px)]"
          style={{ willChange: "transform" }}
        >
          <div data-depth={40} className="relative">
            <div className="hero-planet-glow absolute inset-x-6 bottom-8 top-10 -z-20 scale-110" />
            <Image
              src="/images/hero/saturn.png"
              alt=""
              width={960}
              height={361}
              fetchPriority="low"
              sizes="(max-width: 640px) 220px, 540px"
              className="h-auto w-full drop-shadow-[0_18px_35px_rgba(31,27,79,0.35)]"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default HeroCosmicScene;