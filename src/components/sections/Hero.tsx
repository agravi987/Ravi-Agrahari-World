/**
 * Hero.tsx (client) — plan S3 + P24 redesign
 * SPLIT hero: left column is the pitch (currently-learning badge,
 * name + rotating roles, headline, CTAs, quick-jump chips), right
 * column is a unique "photo on paper" composition — the profile
 * photo in a gradient-hairline card over an offset indigo block,
 * with two floating glass chips (learning streak ≥ 2 + "learning
 * in public"). No orbit ring in the hero (P24): the galaxy owns
 * the orbit motif. Content comes from lib/content.ts, never
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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Mail, Rocket, Flame } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { initials } from "@/lib/galaxyGeometry";
import { isAllowedImageUrl, withCloudinaryOptimizations } from "@/lib/imageHosts";
import { scrollToSection } from "@/lib/scrollTo";
import Button from "@/components/ui/Button";
import BrandIcon, { type BrandIconName } from "@/components/ui/BrandIcon";
import GradientMesh from "@/components/ui/GradientMesh";
import Magnetic from "@/components/ui/Magnetic";
import ParticleField from "@/components/ui/ParticleField";

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
}

/** Brand icons for the social row (same map as the footer). */
const SOCIAL_BRANDS: Record<string, BrandIconName> = {
  github: "github",
  x: "x",
  twitter: "x",
};

/** Brand-colored hover for the social pills (color pass): each known
 *  brand greets you in its own color on hover — GitHub/X go near-ink,
 *  LinkedIn goes sky. Unknown labels fall back to the accent. */
const BRAND_HOVER: Record<string, string> = {
  github: "hover:border-ink/40 hover:text-ink",
  x: "hover:border-ink/40 hover:text-ink",
  twitter: "hover:border-ink/40 hover:text-ink",
  linkedin: "hover:border-topic-cloud/50 hover:text-topic-cloud-deep",
};

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
   Scroll drift (name column), tilt (photo card), past-hero (sticky CTA)
   and the scroll-cue fade. All pointer-fine + reduced-motion guarded.
   ------------------------------------------------------------------- */

/** #5 Scroll-linked parallax: the left column drifts DOWN slightly as
 *  the hero scrolls away (opposite of the photo's mouse parallax).
 *  rAF-throttled, transform-only; pointer-fine + reduced-motion gated. */
function useScrollDrift(amount = 14) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 while the hero top is at/below mid-viewport → amount when
        // it has scrolled one viewport-height past.
        const p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / (vh * 0.5)));
        el.style.transform = `translate3d(0, ${(p * amount).toFixed(1)}px, 0)`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduceMotion, amount]);

  return ref;
}

/** Scroll-linked fade: drives scale (1→0.97) on the hero section as
 *  it scrolls out of view. Creates parallax depth between hero and
 *  sections below. Opacity omitted to avoid LCP animation penalty.
 *  Reduced-motion: no-op. */
function useScrollFade() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, window.scrollY / vh));
        const el = document.getElementById("hero");
        if (el) {
          el.style.transform = `scale(${1 - p * 0.03})`;
        }
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
    };
  }, [reduceMotion]);
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
       (the QA caught a 38px photo on mobile). */
    <div
      ref={parallaxRef}
      className="photo-composition relative mx-auto w-[min(70vw,260px)] lg:mx-0 lg:w-[260px] lg:justify-self-end"
      style={{ willChange: "transform" }}
    >
      {/* Slow dashed orbit ring + a single accent dot riding it — the
          hero's quiet orbital nod to the galaxy below. Decorative,
          transform-only, frozen by reduced-motion. */}
      <div
        aria-hidden="true"
        className="rotate-slow pointer-events-none absolute -inset-6 -z-10 text-accent/25"
        style={{ animationDuration: "28s" }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="0.8 2.2"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]" />
      </div>

      {/* Pulsing halo behind the composition (UX pass) — decorative */}
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
              sizes="(max-width: 640px) 78vw, 360px"
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
          className="animate-float-a absolute -top-4 right-2 flex items-center gap-1.5 rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs font-medium text-ink shadow-card backdrop-blur-sm"
        >
          <Flame className="h-3.5 w-3.5 text-topic-mars" aria-hidden="true" />
          {streak}-day streak
        </p>
      )}
      <p className="animate-float-b absolute -bottom-4 left-2 flex items-center gap-1.5 rounded-full border border-card-border bg-card/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-card backdrop-blur-sm">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
        </span>
        learning in public
      </p>
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
  }: HeroProps) {
  const [cueHidden, setCueHidden] = useState(false);
  const driftRef = useScrollDrift(14);
  const router = useRouter();

  /** P19 scroll cue: #section anchors only exist when the section
   *  is enabled AND we're on home. A disabled section made the chips dead
   *  links — fall back to navigating home with the hash instead. */
  const jumpSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (!scrollToSection(href.slice(1))) router.push(`/${href}`);
  };

  /** #11: after the first real scroll the cue gives up its job. */
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 24) setCueHidden(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Scroll-linked fade: hero content fades + scales down as it scrolls
   *  out of view, creating parallax depth between hero and sections below. */
  useScrollFade();

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
      className="relative overflow-hidden px-6 py-14 lg:py-20"
      style={{ willChange: "transform", transformOrigin: "top center" }}
    >
      {/* ONE indigo→cyan gradient (plan §4.1): the photo card frame now
          carries it; the soft glow below sits behind the composition */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-20 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent-cyan)_15%,transparent),transparent_65%)] blur-2xl lg:left-[72%]"
      />

      {/* P27: soft bottom fade — the hero melts into the marquee */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper/90 to-transparent"
      />

      {/* P30: colorful gradient mesh — 5 topic-hued blobs drift independently
          behind the hero, creating depth and color. Replaces the previous
          2-blob aurora with a richer, more vibrant mesh. */}
      <GradientMesh />

      {/* Canvas constellation — connected dots drift behind the hero,
          adding a "connected brain" depth layer. Pointer-fine only,
          reduced-motion frozen. LCP-neutral (z-0, behind content). */}
      <ParticleField />

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
            <a
              href="/detailed-galaxy"
              title="See this topic in the learning galaxy"
              className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
              </span>
              currently learning: {currentlyLearning}
            </a>
            {availability && (
              /* Phase 14 (#4): the pill pulses TWICE on mount, then goes
                  still (one-shot box-shadow animation). */
              <p className="pill-pulse-once inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                {availability}
              </p>
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
            className="hero-in mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "0.3s" }}
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
          </div>

          {/* Social row (P24) — icon pills for known brands (GitHub,
              X), text pill for the rest (LinkedIn etc.). Zero-data:
              hidden when no links are configured. */}
          {socialLinks.length > 0 && (
            <nav
              aria-label="Social links"
              className="hero-fade mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              style={{ animationDelay: "0.4s" }}
            >
              {socialLinks.map((link) => {
                const brand = SOCIAL_BRANDS[link.label.toLowerCase().replace(/\W/g, "")];
                const brandHover = BRAND_HOVER[link.label.toLowerCase().replace(/\W/g, "")];
                return brand ? (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} (opens in a new tab)`}
                    title={link.label}
                    /* Phase 14 (#14): the "G" shortcut focuses this */
                    data-hero-github={brand === "github" ? "" : undefined}
                    className={`hero-github-anchor inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      brandHover ?? "hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-9 items-center rounded-full border border-card-border bg-card px-3.5 text-xs font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      brandHover ?? "hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          )}

        </div>

        {/* Right — the photo composition */}
        <PhotoComposition name={name} image={profileImage} streak={streak} />
      </div>

      {/* Scroll cue — desktop only (on mobile the composition sits low
          and the cue would overlap it) */}
      <a
        href="#skills"
        aria-label="Scroll to skills"
        onClick={(e) => jumpSection(e, "#skills")}
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
