/**
 * Hero.tsx (client) — plan S3 + P24 redesign
 * SPLIT hero: left column is the pitch (currently-learning badge,
 * name + rotating roles, headline, CTAs, quick-jump chips), right
 * column is a unique "photo on paper" composition — the profile
 * photo in a gradient-hairline card over an offset indigo block,
 * with two floating glass chips (learning streak ≥ 2 + "learning
 * in public") floating above a layered cosmic scene — the JWST
 * nebula wash (public domain, bundled locally), a dense twinkling
 * starfield with shooting stars, three floating topic planets, the
 * spaceship, and Hubble-era Saturn rising behind the photo. The
 * galaxy owns the full orbit motif (P24); the hero keeps just the
 * photos, quiet and deep — all decorative motion lives in
 * HeroCosmicScene.tsx.
 * Content comes from lib/content.ts, never
 * hardcoded; no photo → graceful initials fallback.
 *
 * Entrance animations are CSS keyframes (.hero-in / .hero-fade) —
 * NOT Framer Motion initial states — so the hero text is visible
 * at first paint instead of waiting for JS hydration (LCP fix).
 * The rotating role is ONE persistent span with a CSS opacity
 * transition — swapping text in place instead of recreating DOM
 * nodes, so role swaps never register as new LCP candidates.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mail, Rocket, Flame, Compass } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";
import { initials } from "@/lib/galaxyGeometry";
import { isAllowedImageUrl, withCloudinaryOptimizations } from "@/lib/imageHosts";
import { scrollToSection } from "@/lib/scrollTo";
import { GUIDE_TOUR_EVENT } from "@/lib/sectionTour";
import Button from "@/components/ui/Button";
import AvailabilityPill from "@/components/ui/AvailabilityPill";
import SocialLink from "@/components/ui/SocialLink";
import Magnetic from "@/components/ui/Magnetic";
import HeroCosmicScene from "./HeroCosmicScene";

interface HeroProps {
  name: string;
  headline: string;
  roles: string[];
  email: string;
  socialLinks: { label: string; url: string }[];
  /** Momentum badge text — from the CMS, never hardcoded (P0 fix). */
  currentlyLearning: string;
  /** Learning streak — the floating chip shows it only when ≥ 2 (§5.3). */
  streak: number;
  /** Hero availability pill (recruiter-first, P24) — hidden when empty. */
  availability?: string;
  /** Profile photo (Cloudinary URL via the CMS). Falls back to initials. */
  profileImage?: string;
  /** First CMS-enabled section id — the scroll cue's target so it never
   *  points at a hidden section (audit #28). */
  firstEnabledSection?: string;
  /** Recruiter proof-strip (P31): shipped-project + internship counts,
   *  passed only when their sections are CMS-enabled (page.tsx passes
   *  0 for disabled/hidden sections). Zero-data: each chip hides when
   *  its count is 0. */
  projectsCount?: number;
  experienceCount?: number;
}

/** Brand icons for the social row now live in lib/social.ts +
 *  SocialLink.tsx — the shared primitive (audit #72/#197). Hero's
 *  local SOCIAL_BRANDS/BRAND_HOVER maps are gone (they had drifted:
 *  LinkedIn was missing here but present in Contact/Footer). */

/**
 * Typewriter role: types the current role in, holds it, types it back
 * out, then types the next role — like a terminal. One persistent span
 * mutates only its text content, so no DOM nodes are recreated and LCP
 * stays pinned to the h1's first paint. SSR renders the FIRST role fully
 * typed (LCP-safe); reduced-motion users keep it static forever.
 */
function TypewriterRole({ roles }: { roles: string[] }) {
  const [text, setText] = useState(roles[0] ?? "");
  const [activeIdx, setActiveIdx] = useState(0);
  const reduceMotion = useReducedMotion();
  // Phase 14 (#2): hovering the role freezes the typing loop — you can
  // read the current role without it deleting itself under your cursor.
  const hoveredRef = useRef(false);

  useEffect(() => {
    if (reduceMotion || roles.length <= 1) return;
    let alive = true;
    let timeout: ReturnType<typeof setTimeout>;

    let roleIndex = 0;
    let pos = roles[0].length;
    let typing = false;

    const tick = () => {
      if (!alive) return;
      // While hovered: hold the current text and re-check shortly.
      if (hoveredRef.current) {
        timeout = setTimeout(tick, 300);
        return;
      }
      const role = roles[roleIndex];
      if (typing) {
        pos += 1;
        setText(role.slice(0, pos));
        if (pos === role.length) {
          typing = false;
          timeout = setTimeout(tick, 2000); // hold the fully-typed role
          return;
        }
      } else {
        pos -= 1;
        setText(role.slice(0, pos));
        if (pos === 0) {
          roleIndex = (roleIndex + 1) % roles.length;
          setActiveIdx(roleIndex);
          typing = true;
        }
      }
      timeout = setTimeout(tick, typing ? 70 : 35);
    };

    // Hold the SSR-rendered first role for a beat, then start deleting.
    timeout = setTimeout(tick, 2200);
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [roles, reduceMotion]);

  return (
    <span className="inline-block">
      <span
        className="relative inline-block gradient-text"
        onMouseEnter={() => (hoveredRef.current = true)}
        onMouseLeave={() => (hoveredRef.current = false)}
      >
        <span className="inline-block">
          {text}
          {/* P25: terminal caret — blinks while the role "types" in place.
              Reduced-motion freezes it via the global rule. */}
          <span
            aria-hidden="true"
            className="role-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] rounded-full bg-accent align-baseline"
          />
        </span>
      </span>
      {/* Role indicator dots — show which role is active and how many total */}
      {roles.length > 1 && (
        <span
          aria-hidden="true"
          className="mt-3 flex items-center justify-center gap-1.5 lg:justify-start"
        >
          {roles.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-400 ${
                i === activeIdx
                  ? "h-1.5 w-4 bg-accent"
                  : "h-1.5 w-1.5 bg-ink-faint/40"
              }`}
            />
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * Gentle mouse parallax (pointer-fine only): the composition eases
 * ±amount px opposite... with the cursor as it moves over it. One rAF
 * loop lerping a translate3d — transform-only, no layout reads per
 * frame. Skipped entirely for touch + reduced-motion users.
 */
function usePhotoParallax(amount = 5) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform = `translate3d(${cx * amount}px, ${cy * amount}px, 0)`;
      raf = 0;
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
    };
  }, [reduceMotion, amount]);

  return ref;
}

/* --- Phase 14 (backlog §1) extra hooks --------------------------------
   GSAP pass: drift + fade are now ONE ScrollTrigger scrub (see
   useHeroScrollEffects). Tilt stays hand-rolled on purpose — the
   photo card's Tailwind transition-all would double-ease against
   quickTo's tweening.
   Scroll-cue fade stays CSS. All pointer-fine + reduced-motion guarded.
   ------------------------------------------------------------------- */

/** #5 Scroll-linked parallax + fade (GSAP ScrollTrigger): the left
 *  column drifts DOWN slightly and the hero scales 1→0.97 as it
 *  scrolls out — parallax depth between hero and sections below.
 *  Phase 14 (#5): deep-lens differential — the photo composition
 *  drifts FASTER (y:30 vs y:14) so the two columns recede at
 *  different rates, deepening the stereo gap ("look closer, it all
 *  moves"). One scrubbed timeline replaces the two hand-rolled scroll
 *  listeners: scroll position IS the animation clock, so no rAF/
 *  listener bookkeeping, and refreshes on resize are automatic.
 *  Transform-only; opacity untouched (LCP: no hero-text opacity
 *  animation). The photo tween targets the OUTER composition wrapper
 *  (data-hero-photo) — its own pointer-parallax lives one level down,
 *  so the two transforms can never fight. Reduced-motion + touch:
 *  no-op — the GSAP chunk is never fetched (repo pattern:
 *  useReducedMotion gate). */
function useHeroScrollEffects() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled) return;
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              // Old curves: drift p = (0.5vh − top)/0.5vh (done by the
              // time the hero top is half a viewport above the top edge)
              // and fade p = scrollY/vh (done one viewport scrolled).
              // "top 50%" → "bottom top" reproduces both with the same
              // feel while keeping the two tweens perfectly in sync.
              start: "top 50%",
              end: "bottom top",
              scrub: true,
            },
          });
          tl.to(el, { y: 14, ease: "none" }, 0).to(
            document.getElementById("hero"),
            { scale: 0.97, ease: "none", transformOrigin: "top center" },
            0
          );
          // Deep-lens: the photo recedes ~2.1× faster than the pitch.
          const section = el.closest("section");
          const photo = section?.querySelector<HTMLElement>("[data-hero-photo]");
          if (photo) tl.to(photo, { y: 30, ease: "none" }, 0);
          // Saturn's foreground rise now lives in HeroCosmicScene's own
          // scrub timeline (all decorative parallax shares one home).
        });
        dispose = () => ctx.revert();
      })
      .catch(() => {
        /* GSAP failed to load — hero simply doesn't drift */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduceMotion]);

  return ref;
}

/** #13 Mouse-tilt on the photo card (pointer-fine only) — the card
 *  leans toward the cursor; transform-based, resets on leave. */
function useTilt(maxDeg = 4) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion, maxDeg]);

  return ref;
}

/**
 * The unique right-side composition (P24): the photo in a
 * gradient-hairline card (the hero's ONE indigo→cyan gradient),
 * set on an offset indigo block like a printed photo on paper,
 * with two floating glass chips. Server-safe fallback: initials
 * when no photo is uploaded. Reduced-motion freezes the chips via
 * the global media query (their animation is transform-only).
 */
function PhotoComposition({
  name,
  image,
  streak,
}: {
  name: string;
  image?: string;
  streak: number;
}) {
  const showStreak = Number.isFinite(streak) && streak >= 2;
  const parallaxRef = usePhotoParallax(5);
  // Phase 14 (#13): the card itself tilts toward the cursor.
  const tiltRef = useTilt(4);
  // BUGFIX: the CMS accepts any image URL, but next/image only serves
  // allowlisted hosts — a pasted non-Cloudinary URL threw a runtime
  // "hostname not configured" error and killed the hero. Unallowed
  // URLs degrade to the initials fallback (same as "no photo").
  const imageOk = isAllowedImageUrl(image);
  return (
    /* Explicit MEDIUM width (P24: was 360px and read as too big) —
       w-fit would collapse the inner aspect box to its content width
       (the QA caught a 38px photo on mobile).
       data-hero-photo: the GSAP scroll-drift wrapper (deep-lens
       parallax). The pointer parallax lives one level DOWN (the inner
       wrapper holds parallaxRef) so the two transforms never write the
       same element. */
    <div
      data-hero-photo
      className="photo-composition relative mx-auto w-[min(70vw,260px)] lg:mx-0 lg:w-[260px] lg:justify-self-end"
      style={{ willChange: "transform" }}
    >
      <div
        ref={parallaxRef}
        className="relative"
        style={{ willChange: "transform" }}
      >
      {/* Pulsing halo behind the composition (UX pass) — decorative.
          P31: the dashed orbit ring + SVG ringed-planet were removed —
          the real Jupiter rising behind the card is now the orbit
          accent, and the galaxy below owns the full orbit motif. */}
      <div
        aria-hidden="true"
        className="halo -inset-6 -z-10"
        style={{ "--halo-color": "color-mix(in oklab, var(--color-accent) 20%, transparent)" } as CSSProperties}
      />
      {/* Offset paper block — the "printed photo on paper" anchor */}
      <div
        aria-hidden="true"
        className="absolute -bottom-4 -left-4 h-full w-full rounded-[1.35rem] border border-accent/10 bg-accent-soft/70 lg:-bottom-5 lg:-left-5"
      />
      {/* Photo card — hairline indigo→cyan gradient frame.
          P25: the card lifts slightly on hover (pointer-fine only).
          Phase 14 (#13): tilt ref adds cursor-follow rotation. */}
      <div
        ref={tiltRef}
        className="group relative rounded-[1.35rem] bg-gradient-to-br from-accent/70 via-accent-cyan/60 to-accent/70 p-1 shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:shadow-orbital focus-within:ring-2 focus-within:ring-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-paper"
        style={{ willChange: "transform" }}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.1rem] bg-card transition-transform duration-500 md:group-hover:scale-[1.02]">
          {imageOk && image ? (
            <Image
              src={withCloudinaryOptimizations(image)}
              alt={`${name} portrait`}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 640px) 78vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="font-display text-6xl font-semibold text-accent/70">
                {initials(name) || "✦"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Floating glass chips (transform-only float; zero-data: the
          streak chip hides below 2 days, §5.3) */}
      {showStreak && (
        <p
          title="Learning streak — the days I've shipped something, back to back"
          className="glass-surface animate-float-a absolute -top-4 right-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink"
        >
          <Flame className="h-3.5 w-3.5 text-topic-mars" aria-hidden="true" />
          {streak}-day streak
        </p>
      )}
      <p className="glass-surface animate-float-b absolute -bottom-4 left-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
        </span>
        learning in public
      </p>
      </div>
    </div>
  );
}

export default function Hero({
  name,
  headline,
  roles,
  email,
  socialLinks,
  currentlyLearning,
  streak,
  availability,
  profileImage,
  firstEnabledSection,
  projectsCount = 0,
  experienceCount = 0,
  }: HeroProps) {
  const [cueHidden, setCueHidden] = useState(false);
  // GSAP pass: one ScrollTrigger scrub now drives BOTH the name-column
  // drift (this ref) and the hero-section scale fade (#hero).
  const driftRef = useHeroScrollEffects();
  const router = useRouter();
  /** First enabled section id (passed from page.tsx) — the scroll cue
   *  jumps somewhere that actually exists even when the CMS hides the
   *  default target (audit #28). */
  const cueTarget = firstEnabledSection ?? "skills";

  /** P19 scroll cue: #section anchors only exist when the section
   *  is enabled AND we're on home. A disabled section made the chips dead
   *  links — fall back to navigating home with the hash instead. */
  const jumpSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (!scrollToSection(href.slice(1))) router.push(`/${href}`);
  };

  /** #11: after the first real scroll the cue gives up its job — and
   *  takes it back when you return to the top (audit #112). */
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 24) setCueHidden(true);
      else setCueHidden(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-linked fade moved into useHeroScrollEffects' scrub timeline.

  /** #14: press G (not in a field) → focus the GitHub social link. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "g" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const link = document.querySelector<HTMLElement>("[data-hero-github]");
      if (link) {
        e.preventDefault();
        link.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="snap-section relative flex min-h-[100svh] items-center overflow-hidden px-4 sm:px-6 py-12 sm:py-14 lg:py-16"
      style={{ willChange: "transform", transformOrigin: "top center" }}
    >
      {/* ONE indigo→cyan gradient (plan §4.1): the photo card frame now
          carries it; the soft glow below sits behind the composition */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-20 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent-cyan)_15%,transparent),transparent_65%)] blur-2xl lg:left-[72%]"
      />

      {/* P27: soft bottom fade — the hero melts into the strip below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper/90 to-transparent"
      />

      {/* P32 cosmic scene — the full decorative cosmos (nebula wash,
          starfield, shooting stars, floating planets, spaceship, Saturn)
          now lives in HeroCosmicScene.tsx so ALL its GSAP depth (scroll
          scrub + pointer parallax) shares one home. This layer is
          aria-hidden, pointer-events-none, behind all content. */}
      <HeroCosmicScene />

      <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* Left — the pitch. Phase 14 (#5): the drift ref gives this
            column a slow scroll parallax (transform-only). */}
        <div
          ref={driftRef}
          className="text-center lg:text-left"
        >
          {/* Badge row: momentum badge + availability pill (P24 —
              recruiter-first: they scan availability in seconds) */}
          <div className="hero-in flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {/* P25: the badge is a shortcut INTO the galaxy — the topic
                you're learning lives there as a planet (header parity) */}
            <Link
              href="/detailed-galaxy"
              title="See this topic in the learning galaxy"
              className="glass-surface inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
              </span>
              currently learning: {currentlyLearning}
            </Link>
            {availability && (
              /* Phase 14 (#4): the pill pulses TWICE on mount, then goes
                  still (one-shot box-shadow animation). Shared pill (#74). */
              <AvailabilityPill text={availability} pulse />
            )}
          </div>

          {/* The h1 + headline are LCP-critical text — NO entrance
              animation on them (Chrome defers the LCP candidate until a
              running transform/opacity animation settles, which inflates
              LCP on throttled connections). Badge + CTA still animate. */}
          {/* Two-line h1 (P24): the full name on its own line, the
              rotating role as an accent sub-line below — scannable for
              recruiters and handles longer names without awkward wraps.
              Still zero entrance animation (LCP-critical text). */}
          <h1
            id="hero-title"
            className="mt-6 font-display font-semibold tracking-tight text-ink"
          >
            <span className="block text-4xl sm:text-6xl">
              {/* Phase 14 (#1): slow traveling shimmer on the gradient
                  text — background-position only, LCP-neutral. */}
              <span className="text-gradient">{name}</span>
            </span>
            <span className="mt-2 block text-2xl text-accent sm:text-4xl">
              <TypewriterRole roles={roles} />
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-balance text-ink-soft lg:mx-0">
            {headline}
          </p>

          {/* Gradient divider under the headline (UX pass) */}
          <div
            aria-hidden="true"
            className="mx-auto mt-6 h-px max-w-md bg-gradient-to-r from-accent/50 via-accent-cyan/40 to-transparent lg:mx-0"
          />

          <div
            className="hero-in delay-hero-2 mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            {/* P25: icons on the CTAs — scanable at a glance.
                Magnetic hover pulls the buttons toward the cursor. */}
            <Magnetic strength={0.2}>
              <Button href={`mailto:${email}`}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Get in touch
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button href="#projects" variant="secondary">
                <Rocket className="h-4 w-4" aria-hidden="true" />
                View projects
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button
                variant="secondary"
                onClick={() =>
                  window.dispatchEvent(new Event(GUIDE_TOUR_EVENT))
                }
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                Take the tour
              </Button>
            </Magnetic>
          </div>

          {/* P31 recruiter proof-strip — static mono stat chips under the
              CTAs (projects + internships from the CMS, streak from the
              learning momentum). Each jumps to its section; zero-data:
              the whole strip hides when every chip has nothing to show.
              Static on purpose — a moving ticker here read as noise. */}
          {(projectsCount > 0 || experienceCount > 0 || streak >= 2) && (
            <div
              aria-label="Highlights"
              className="hero-fade delay-hero-3 mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start"
            >
              {projectsCount > 0 && (
                <a
                  href="#projects"
                  onClick={(e) => jumpSection(e, "#projects")}
                  className="link-underline group inline-flex items-center gap-2 font-mono text-xs font-medium text-ink-soft transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-topic-cloud transition-transform duration-300 group-hover:scale-125"
                    aria-hidden="true"
                  />
                  {projectsCount} shipped {projectsCount === 1 ? "project" : "projects"}
                </a>
              )}
              {experienceCount > 0 && (
                <a
                  href="#experience"
                  onClick={(e) => jumpSection(e, "#experience")}
                  className="link-underline group inline-flex items-center gap-2 font-mono text-xs font-medium text-ink-soft transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-topic-mars transition-transform duration-300 group-hover:scale-125"
                    aria-hidden="true"
                  />
                  {experienceCount} {experienceCount === 1 ? "internship" : "internships"}
                </a>
              )}
              {streak >= 2 && (
                <Link
                  href="/detailed-galaxy"
                  className="link-underline group inline-flex items-center gap-2 font-mono text-xs font-medium text-ink-soft transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent-cyan transition-transform duration-300 group-hover:scale-125"
                    aria-hidden="true"
                  />
                  {streak}-day streak
                </Link>
              )}
            </div>
          )}

          {/* Social row (P24) — icon pills for known brands (GitHub,
              X), text pill for the rest (LinkedIn etc.). Zero-data:
              hidden when no links are configured. P31: each pill is
              wrapped in Magnetic so the icons pull toward the cursor
              (interactive socials, same primitives as the CTAs). */}
          {socialLinks.length > 0 && (
            <nav
              aria-label="Social links"
              className="hero-fade delay-hero-3 mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {socialLinks.map((link) => (
                <Magnetic key={link.label} strength={0.15}>
                  <SocialLink
                    label={link.label}
                    url={link.url}
                    variant="icon"
                    /* Phase 14 (#14): the "G" shortcut focuses this */
                    className={
                      link.label.toLowerCase().replace(/\W/g, "") === "github"
                        ? "hero-github-anchor"
                        : undefined
                    }
                  />
                </Magnetic>
              ))}
            </nav>
          )}

        </div>

        {/* Right — the photo composition */}
        <PhotoComposition name={name} image={profileImage} streak={streak} />
      </div>

      {/* Scroll cue — desktop only (on mobile the composition sits low
          and the cue would overlap it). Targets the first ENABLED section
          (CMS-driven) so it can't be a dead jump (audit #28). */}
      <a
        href={`#${cueTarget}`}
        aria-label={`Scroll to ${cueTarget}`}
        onClick={(e) => jumpSection(e, `#${cueTarget}`)}
        /* animate-cue-bob only — hero-fade would override it in the
           cascade (both set the animation shorthand) and kill the bob.
           Phase 14 (#11): the cue hides after the first real scroll. */
        className={`animate-cue-bob absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink-faint transition-opacity duration-500 hover:text-accent lg:block ${
          cueHidden ? "cue-hide" : ""
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
    </>
  );
}
