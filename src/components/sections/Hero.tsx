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
import { useEffect, useRef, useState } from "react";
import { Mail, Rocket, FileText, Terminal } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";
import { initials } from "@/lib/galaxyGeometry";
import { isAllowedImageUrl, withCloudinaryOptimizations } from "@/lib/imageHosts";
import { scrollToSection } from "@/lib/scrollTo";
import Button from "@/components/ui/Button";
import SocialLink from "@/components/ui/SocialLink";
import Magnetic from "@/components/ui/Magnetic";
import HeroCosmicScene from "./HeroCosmicScene";
import ResumeModal, { openResumeModal } from "@/components/ui/ResumeModal";
import { openTerminal } from "@/components/TerminalEasterEgg";

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
        <span className="inline-block bg-gradient-to-r from-accent-cyan via-accent to-topic-ai bg-clip-text text-transparent">
          {text}
          {/* P25: terminal caret — blinks while the role "types" in place.
              Reduced-motion freezes it via the global rule. */}
          <span
            aria-hidden="true"
            className="role-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] rounded-full bg-accent-cyan align-baseline"
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
}: {
  name: string;
  image?: string;
}) {
  const parallaxRef = usePhotoParallax(5);
  // Phase 14 (#13): the card itself tilts toward the cursor.
  const tiltRef = useTilt(4);
  // BUGFIX: the CMS accepts any image URL, but next/image only serves
  // allowlisted hosts — a pasted non-Cloudinary URL threw a runtime
  // "hostname not configured" error and killed the hero. Unallowed
  // URLs degrade to the initials fallback (same as "no photo").
  const imageOk = isAllowedImageUrl(image);
  return (
    <div
      data-hero-photo
      className="photo-composition relative mx-auto w-[min(74vw,280px)] sm:w-[300px] lg:mx-0 lg:w-[320px] lg:justify-self-end"
      style={{ willChange: "transform" }}
    >
      <div
        ref={parallaxRef}
        className="relative"
        style={{ willChange: "transform" }}
      >
        {/* Ambient atmospheric glow behind the portrait */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-accent/30 via-accent-cyan/20 to-topic-ai/30 blur-xl opacity-75"
        />

        {/* Elevated glass card with gradient perimeter */}
        <div
          ref={tiltRef}
          className="group relative rounded-[2rem] bg-gradient-to-br from-accent/70 via-accent-cyan/50 to-topic-ai/60 p-1.5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-orbital focus-within:ring-2 focus-within:ring-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-paper"
          style={{ willChange: "transform" }}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.65rem] bg-card transition-transform duration-500 md:group-hover:scale-[1.02]">
            {imageOk && image ? (
              <Image
                src={withCloudinaryOptimizations(image)}
                alt={`${name} portrait`}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 640px) 78vw, 320px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-card">
                <span className="font-display text-6xl font-bold text-accent/80">
                  {initials(name) || "✦"}
                </span>
              </div>
            )}
          </div>

          {/* Floating live status pill */}
          <div
            aria-hidden="true"
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 whitespace-nowrap rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-900/80 via-purple-900/70 to-blue-900/80 px-4 py-1.5 font-mono text-xs font-semibold text-ink shadow-md backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-ink-soft">Open for Opportunities</span>
          </div>
        </div>
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
  streak,
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
  const jumpSection = (e: React.MouseEvent<HTMLElement>, href: string) => {
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
      className="relative flex items-center overflow-hidden px-4 sm:px-6 py-10 sm:py-14 lg:py-16"
      style={{ willChange: "transform", transformOrigin: "top center" }}
    >
      {/* P32 cosmic scene — the full decorative cosmos (nebula wash,
          starfield, shooting stars, floating planets, spaceship, Saturn)
          now lives in HeroCosmicScene.tsx so ALL its GSAP depth (scroll
          scrub + pointer parallax) shares one home. This layer is
          aria-hidden, pointer-events-none, behind all content. */}
      <HeroCosmicScene />

      <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        {/* Left Column — Text Pitch, vertically centered */}
        <div
          ref={driftRef}
          className="relative z-10 space-y-3.5 text-center lg:text-left"
        >
          {/* Two-line h1 with larger text */}
          <h1
            id="hero-title"
            className="font-display font-semibold tracking-tight text-ink leading-tight sm:leading-snug"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-gradient">{name}</span>
            </span>
            <span className="mt-2 block text-2xl sm:text-3xl lg:text-4xl font-medium text-accent">
              <TypewriterRole roles={roles} />
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-base sm:text-lg lg:text-xl leading-relaxed text-ink-soft/90 lg:mx-0">
            {headline}
          </p>

          {/* High-conversion 3-button cluster: Projects, Resume, Contact - 1 Line */}
          <div
            className="hero-in delay-hero-2 pt-2 flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 flex-nowrap"
          >
            <Magnetic strength={0.2}>
              <Button
                href="#projects"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap"
                onClick={(e) => jumpSection(e, "#projects")}
              >
                <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>Explore Projects</span>
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button
                variant="secondary"
                onClick={() => openResumeModal()}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" aria-hidden="true" />
                <span>Resume / CV</span>
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button
                href="#contact"
                variant="secondary"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap"
                onClick={(e) => jumpSection(e, "#contact")}
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>Get in Touch</span>
              </Button>
            </Magnetic>
          </div>

          {/* Social links row */}
          {socialLinks.length > 0 && (
            <nav
              aria-label="Social links"
              className="hero-fade delay-hero-3 pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-2"
            >
              {socialLinks.map((link) => (
                <Magnetic key={link.label} strength={0.15}>
                  <SocialLink
                    label={link.label}
                    url={link.url}
                    variant="icon"
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

        {/* Right Column — Photo composition, vertically centered and aligned nicely */}
        <div className="flex items-center justify-center lg:justify-end">
          <PhotoComposition name={name} image={profileImage} />
        </div>
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
    <ResumeModal
      name={name}
      email={email}
      github={socialLinks.find((s) => s.label.toLowerCase().includes("github"))?.url.split("/").pop() || "agravi987"}
      roles={roles}
    />
    </>
  );
}
