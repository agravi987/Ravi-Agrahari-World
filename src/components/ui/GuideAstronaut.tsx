"use client";

/**
 * GuideAstronaut.tsx (client) — the astronaut tour guide, living.
 * Game-character treatment on top of three base modes (all home-only):
 *   docked  — small bubble + avatar, bottom-right once you leave the
 *             hero. Stays up in EVERY section (incl. Contact) and only
 *             becomes a tiny call-back chip after the ✕ dismiss.
 *   invite  — first-time visitors get a welcome card offering the
 *             full walkthrough (no autoplay; the visitor chooses).
 *   panel   — tapping/booping the avatar flips it into a BIG info card
 *             (dialogue box) that describes the section you're in right
 *             now, live-follows as you scroll, and offers an action:
 *             start the walkthrough or jump straight to that section.
 *   tour    — the walkthrough itself: smooth-scrolls to each section,
 *             rings it with .tour-focus, explains it in one line
 *             (steps skip CMS-hidden sections). Can start from the
 *             current section or from the top.
 * "Alive" layer (GSAP, gated on useReducedMotion + gsapReady, cleaned
 * up via gsap.context().revert() — repo pattern):
 *   - endless float bob; avatar tilts toward the cursor (pointer:fine)
 *   - idle wave after ~7s of no scroll/pointer activity
 *   - tap/boop: squash-and-stretch + a wobble when the panel opens
 *   - the tour avatar "rocket-drops" (squash landing) on every step
 * Dialogue styling: name tag, blinking caret, visor glint sweep, halo +
 * grounding shadow, and a CSS drone satellite during tours.
 * The bubble & panel are REAL text with role="status"/dialog content;
 * the PNG stays decorative (aria-hidden img inside real buttons).
 * A Vecteezy attribution lives in the Footer (license requirement).
 * No emoji used anywhere.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { gsapReady } from "@/lib/gsap";
import { scrollToSection } from "@/lib/scrollTo";
import Button from "@/components/ui/Button";
import {
  GUIDE_ABOUT_DESCRIBE,
  GUIDE_IDLE_TIP,
  GUIDE_INVITE_BODY,
  GUIDE_INVITE_TITLE,
  GUIDE_NAME,
  GUIDE_RETURN_TIP,
  GUIDE_SECTIONS,
  GUIDE_TOUR_EVENT,
  type GuideStep,
} from "@/lib/sectionTour";

const ASTRO_SRC = "/images/vecteezy_3d-astronaut-on-transparent-background_47307971.png";
const VISITS_KEY = "orbital-guide-visits";

export default function GuideAstronaut() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const [docked, setDocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [touring, setTouring] = useState(false);
  const [step, setStep] = useState(-1);
  const [stepList, setStepList] = useState<readonly GuideStep[]>(GUIDE_SECTIONS);
  const [tip, setTip] = useState(GUIDE_IDLE_TIP);
  const [activeSection, setActiveSection] = useState<GuideStep | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const rafRef = useRef(0);
  const dismissedRef = useRef(false);
  const touringRef = useRef(false);
  const inviteDismissedRef = useRef(false);
  const panelOpenRef = useRef(false);
  const inviteVisibleRef = useRef(false);
  const greetingRef = useRef(GUIDE_IDLE_TIP);
  const inviteTimerRef = useRef<number>(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const tourAstroRef = useRef<HTMLDivElement>(null);
  const tapAnimRef = useRef<(() => void) | null>(null);
  const idleTimerRef = useRef<number>(0);
  const lastActivityRef = useRef(0);
  const panelCardRef = useRef<HTMLDivElement>(null);
  const panelAstroRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    panelOpenRef.current = panelOpen;
  }, [panelOpen]);

  useEffect(() => {
    inviteVisibleRef.current = inviteVisible;
  }, [inviteVisible]);

  /* Focus the dialog's first control the moment it opens. */
  useEffect(() => {
    if (panelOpen && closeRef.current) closeRef.current.focus();
  }, [panelOpen]);

  /** Which section sits under the 50%-line probe (same as SectionRail). */
  const computeSection = useCallback(() => {
    if (touringRef.current) return null;
    const probeY = window.innerHeight * 0.5;
    let found: GuideStep | null = null;
    for (const s of GUIDE_SECTIONS) {
      const el = document.getElementById(s.id);
      if (el && el.getBoundingClientRect().top <= probeY) found = s;
    }
    return found;
  }, []);

  const recentre = useCallback((id?: string) => {
    document
      .querySelectorAll(".tour-focus")
      .forEach((el) => el.classList.remove("tour-focus"));
    if (!id) return;
    // LazyMount swaps its placeholder for the real section after the
    // scroll lands, so re-apply the ring on an 800ms/1.8s cadence.
    const mount = () => document.getElementById(id)?.classList.add("tour-focus");
    mount();
    window.setTimeout(mount, 800);
    window.setTimeout(mount, 1800);
  }, []);

  const endTour = useCallback(() => {
    touringRef.current = false;
    setTouring(false);
    setStep(-1);
    recentre();
  }, [recentre]);

  const applyStep = useCallback(
    (list: readonly GuideStep[], i: number) => {
      if (i < 0 || i >= list.length) {
        endTour();
        return;
      }
      recentre(list[i].id);
      scrollToSection(list[i].id);
      setTip(list[i].tip);
    },
    [endTour, recentre]
  );

  const startTour = useCallback(
    (index = 0) => {
      if (touringRef.current) return;
      const present = GUIDE_SECTIONS.filter((s) => document.getElementById(s.id));
      if (!present.length) return;
      const start = Math.min(Math.max(index, 0), present.length - 1);
      touringRef.current = true;
      dismissedRef.current = false;
      setDismissed(false);
      setInviteVisible(false);
      setPanelOpen(false);
      setStepList(present);
      setTouring(true);
      applyStep(present, start);
      setStep(start);
      requestAnimationFrame(() => nextRef.current?.focus());
    },
    [applyStep]
  );

  const startTourFromSection = useCallback(() => {
    const present = GUIDE_SECTIONS.filter((s) => document.getElementById(s.id));
    const idx = present.findIndex((s) => s.id === activeSection?.id);
    startTour(idx >= 0 ? idx : 0);
  }, [activeSection, startTour]);

  const stepChange = useCallback(
    (dir: -1 | 1) => {
      const n = step + dir;
      if (n < 0 || n >= stepList.length) return;
      applyStep(stepList, n);
      setStep(n);
    },
    [applyStep, step, stepList]
  );

  const handleAvatarTap = useCallback(() => {
    tapAnimRef.current?.();
    setPanelOpen((open) => !open);
    lastActivityRef.current = Date.now();
  }, []);

  const goToActive = useCallback(() => {
    const id = activeSection?.id ?? GUIDE_SECTIONS[0].id;
    if (scrollToSection(id)) setPanelOpen(false);
  }, [activeSection]);

  const dismissInvite = useCallback(() => {
    inviteDismissedRef.current = true;
    setInviteVisible(false);
  }, []);

  const restoreGuide = useCallback(() => {
    dismissedRef.current = false;
    setDismissed(false);
    setDocked(true);
  }, []);

  /* Visibility probe + first-visit invite. All state writes live inside
     rAF/timeouts — never synchronously in the effect body. */
  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;

    const probe = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const found = computeSection();
        setActiveSection(found);
        if (!touringRef.current) setTip(found ? found.tip : greetingRef.current);
        setDocked(
          window.scrollY > window.innerHeight * 0.55 &&
            !dismissedRef.current &&
            !touringRef.current &&
            !panelOpenRef.current &&
            !inviteVisibleRef.current
        );
      });
    };

    const onStart = () => startTour(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (touringRef.current) endTour();
      else if (panelOpenRef.current) setPanelOpen(false);
      else if (inviteVisibleRef.current) dismissInvite();
    };

    window.addEventListener("scroll", probe, { passive: true });
    window.addEventListener("resize", probe, { passive: true });
    window.addEventListener(GUIDE_TOUR_EVENT, onStart);
    window.addEventListener("keydown", onKey);
    const mountProbe = requestAnimationFrame(() => {
      try {
        const visits = Number(localStorage.getItem(VISITS_KEY) || "0");
        localStorage.setItem(VISITS_KEY, String(visits + 1));
        if (visits >= 2) {
          greetingRef.current = GUIDE_RETURN_TIP;
          setTip(GUIDE_RETURN_TIP);
        } else if (visits === 0 && !reduced && !cancelled) {
          inviteTimerRef.current = window.setTimeout(() => {
            if (
              !cancelled &&
              !dismissedRef.current &&
              !touringRef.current &&
              !inviteDismissedRef.current
            ) {
              setInviteVisible(true);
            }
          }, 1600);
        }
      } catch {
        /* storage disabled — greeting stays default, invite skipped */
      }
      probe();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(inviteTimerRef.current);
      cancelAnimationFrame(mountProbe);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", probe);
      window.removeEventListener("resize", probe);
      window.removeEventListener(GUIDE_TOUR_EVENT, onStart);
      window.removeEventListener("keydown", onKey);
    };
  }, [pathname, reduced, startTour, endTour, dismissInvite, computeSection]);

  /* ALIVE — GSAP float bob, cursor-look tilt, idle wave, tap boop.
     Runs only while the dock is mounted and motion is allowed. */
  useEffect(() => {
    if (pathname !== "/" || reduced || !docked) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled || !avatarRef.current) return;
        lastActivityRef.current = Date.now();
        const ctx = gsap.context(() => {
          // Endless float bob.
          gsap.to(avatarRef.current, {
            y: -7,
            duration: 2.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });

          // Cursor-look: the avatar tilts a few degrees toward the pointer.
          if (window.matchMedia("(pointer: fine)").matches && avatarRef.current) {
            const tiltTo = gsap.quickTo(avatarRef.current, "rotation", {
              duration: 0.45,
              ease: "power2.out",
            });
            const onMove = (e: PointerEvent) => {
              tiltTo((e.clientX / window.innerWidth - 0.5) * 14);
              lastActivityRef.current = Date.now();
            };
            window.addEventListener("pointermove", onMove, { passive: true });
            ctx.add(() => () => {
              window.removeEventListener("pointermove", onMove);
              gsap.killTweensOf(avatarRef.current);
            });
          }

          // Tap / boop: squash-and-stretch + a wobble when opening the panel.
          tapAnimRef.current = () => {
            if (!avatarRef.current) return;
            gsap
              .timeline()
              .to(avatarRef.current, { scale: 0.86, duration: 0.12, ease: "power2.in" })
              .to(avatarRef.current, { scale: 1.06, duration: 0.18, ease: "back.out(3)" })
              .to(avatarRef.current, { scale: 1, duration: 0.22, ease: "power2.out" });
            if (imageRef.current) {
              gsap.fromTo(
                imageRef.current,
                { rotation: -8 },
                {
                  rotation: 8,
                  duration: 0.16,
                  yoyo: true,
                  repeat: 1,
                  ease: "sine.inOut",
                  clearProps: "transform",
                }
              );
            }
            lastActivityRef.current = Date.now();
          };

          // Gentle wave when the visitor goes quiet (~7s idle).
          idleTimerRef.current = window.setInterval(() => {
            if (touringRef.current) return;
            if (Date.now() - lastActivityRef.current > 7000 && imageRef.current) {
              gsap.fromTo(
                imageRef.current,
                { rotation: 0, scale: 1 },
                {
                  rotation: 24,
                  scale: 1.06,
                  duration: 0.32,
                  yoyo: true,
                  repeat: 3,
                  ease: "sine.inOut",
                  clearProps: "transform",
                }
              );
              lastActivityRef.current = Date.now();
            }
          }, 3500);

          // Any scrolling counts as activity (kills the idle-wave timer).
          const onScroll = () => {
            lastActivityRef.current = Date.now();
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          ctx.add(() => () => window.removeEventListener("scroll", onScroll));
        });
        dispose = () => ctx.revert();
      })
      .catch(() => {
        /* GSAP failed to load — the dock stays static (safe default). */
      });

    return () => {
      cancelled = true;
      window.clearInterval(idleTimerRef.current);
      dispose?.();
      tapAnimRef.current = null;
    };
  }, [pathname, reduced, docked]);

  /* TOUR LANDING — the tour avatar rocket-drops with a squash every step. */
  useEffect(() => {
    if (pathname !== "/" || reduced || !touring || step < 0) return;
    let cancelled = false;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled || !tourAstroRef.current) return;
        gsap.fromTo(
          tourAstroRef.current,
          { y: -36, scaleY: 0.55, opacity: 0 },
          {
            y: 0,
            scaleY: 1,
            opacity: 1,
            duration: 0.7,
            ease: "back.out(1.8)",
            clearProps: "transform,opacity",
          }
        );
      })
      .catch(() => {
        /* skip */
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, reduced, touring, step]);

  /* PANEL ENTRANCE — cinematic spring-in, then Orbit floats gently. */
  useEffect(() => {
    if (pathname !== "/" || reduced || !panelOpen) return;
    let cancelled = false;
    let dispose: (() => void) | null = null;

    gsapReady()
      .then(({ gsap }) => {
        if (cancelled || !panelCardRef.current) return;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            panelCardRef.current,
            { opacity: 0, y: 36, scale: 0.9, rotate: 0.6 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: 0,
              duration: 0.55,
              ease: "back.out(1.5)",
            }
          );
          if (panelAstroRef.current) {
            gsap.fromTo(
              panelAstroRef.current,
              { y: 12, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, ease: "back.out(2.2)", delay: 0.18 }
            );
            gsap.to(panelAstroRef.current, {
              y: -6,
              duration: 2.2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: 0.85,
            });
          }
        });
        dispose = () => ctx.revert();
      })
      .catch(() => {
        /* static panel is fine */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [pathname, reduced, panelOpen]);

  if (pathname !== "/") return null;

  const controlCls =
    "grid h-8 w-8 place-items-center rounded-full border border-card-border bg-paper text-ink-soft transition-colors hover:text-accent disabled:cursor-default disabled:opacity-40";
  const nameTag = (
    <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-accent">
      {GUIDE_NAME}
    </p>
  );

  return (
    <>
      {docked && !touring && !panelOpen && (
        <aside
          aria-label="Portfolio guide"
          className="fixed bottom-24 right-4 z-40 flex items-end gap-2 no-print sm:right-6"
        >
          <div className="guide-pop guide-glass max-w-[260px] rounded-2xl rounded-br-sm p-3 shadow-card">
            {nameTag}
            <p role="status" className="text-[13px] leading-relaxed text-ink-soft">
              {tip}
              <span
                aria-hidden="true"
                className="guide-caret ml-0.5 inline-block h-3 w-[2px] translate-y-[2px] bg-accent"
              />
            </p>
          </div>

          <div className="relative">
            <span aria-hidden="true" className="guide-halo" />
            <span aria-hidden="true" className="guide-shadow" />
            <button
              type="button"
              onClick={handleAvatarTap}
              aria-label={`Talk to ${GUIDE_NAME} — he opens a guide card`}
              className="relative block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span
                ref={avatarRef}
                className="guide-portal block h-16 w-16 overflow-hidden rounded-full shadow-card"
                style={{ willChange: "transform" }}
              >
                <Image
                  ref={imageRef}
                  src={ASTRO_SRC}
                  alt=""
                  width={64}
                  height={64}
                  className="pointer-events-none h-full w-full object-contain"
                />
                <span aria-hidden="true" className="guide-glint" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                dismissedRef.current = true;
                setDismissed(true);
                setDocked(false);
              }}
              aria-label="Dismiss guide"
              className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full border border-card-border bg-card text-ink-faint shadow-sm transition-colors hover:text-ink"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      {dismissed && !touring && !panelOpen && (
        <button
          type="button"
          onClick={restoreGuide}
          aria-label={`Show ${GUIDE_NAME} again`}
          title={`Summon ${GUIDE_NAME}`}
          className="fixed bottom-24 right-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-card-border bg-card/90 opacity-80 shadow-card transition-opacity hover:opacity-100 no-print sm:right-6"
        >
          <Image
            src={ASTRO_SRC}
            alt=""
            width={40}
            height={40}
            className="pointer-events-none object-contain"
          />
        </button>
      )}

      {inviteVisible && !touring && !panelOpen && (
        <aside
          aria-label="First-visit welcome"
          className="guide-pop fixed bottom-24 right-4 z-40 no-print sm:right-6"
        >
          <div className="guide-glass relative flex w-[min(84vw,360px)] items-start gap-3 rounded-2xl rounded-br-sm p-4 shadow-pop">
            <div className="relative h-14 w-14 shrink-0">
              <span aria-hidden="true" className="guide-halo" />
              <span className="guide-portal block h-14 w-14 overflow-hidden rounded-full">
                <Image
                  src={ASTRO_SRC}
                  alt=""
                  width={56}
                  height={56}
                  className="pointer-events-none h-full w-full object-contain"
                />
                <span aria-hidden="true" className="guide-glint" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-ink">
                {GUIDE_INVITE_TITLE} <span className="text-accent">{GUIDE_NAME}</span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                {GUIDE_INVITE_BODY}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={startTourFromSection}
                  className="px-4 py-2 text-[13px]"
                >
                  Take the full tour
                </Button>
                <Button
                  variant="secondary"
                  onClick={dismissInvite}
                  className="px-4 py-2 text-[13px]"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {panelOpen && !touring && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-panel-title"
          className="fixed inset-0 z-[60] grid place-items-center p-4 no-print sm:p-6"
          onClick={() => setPanelOpen(false)}
        >
          <div
            ref={panelCardRef}
            className="guide-glass relative w-full max-w-[620px] overflow-hidden rounded-3xl shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close guide card"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-card-border bg-card/80 text-ink-soft shadow-card transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-5 sm:gap-6">
                <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
                  <span ref={panelAstroRef} className="relative block h-full w-full">
                    <span aria-hidden="true" className="guide-orbit-ring" />
                    <span aria-hidden="true" className="guide-halo" />
                    <span className="guide-portal absolute inset-0 overflow-hidden rounded-full">
                      <Image
                        src={ASTRO_SRC}
                        alt=""
                        width={144}
                        height={144}
                        className="pointer-events-none relative h-full w-full object-contain"
                      />
                      <span aria-hidden="true" className="guide-glint" />
                    </span>
                  </span>
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
                    <span aria-hidden="true" className="guide-live-dot" />
                    Section signal
                  </p>
                  <h2
                    id="guide-panel-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl"
                  >
                    {activeSection ? activeSection.label : "Mission Brief"}
                  </h2>
                  <p className="mt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
                    {GUIDE_NAME} is live
                  </p>
                </div>
              </div>

              <div aria-hidden="true" className="guide-divider mt-4 sm:mt-5" />

              <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                {activeSection ? activeSection.describe : GUIDE_ABOUT_DESCRIBE}
                <span
                  aria-hidden="true"
                  className="guide-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] bg-accent"
                />
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6">
                <Button onClick={startTourFromSection} className="px-6 py-3 text-sm sm:text-base">
                  Take the full tour
                </Button>
                <Button
                  variant="secondary"
                  onClick={goToActive}
                  className="px-6 py-3 text-sm sm:text-base"
                >
                  {activeSection
                    ? `Go to ${activeSection.label.toLowerCase()}`
                    : "Go to skills"}
                </Button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="ml-auto text-sm font-medium text-ink-soft transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {touring && (
        <div className="fixed inset-x-3 bottom-24 z-50 no-print sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(92vw,430px)] sm:-translate-x-1/2">
          <div className="guide-glass flex items-center gap-3 rounded-2xl p-3 shadow-orbital">
            <div ref={tourAstroRef} className="relative h-11 w-11 shrink-0">
              <span aria-hidden="true" className="guide-drone" />
              <span aria-hidden="true" className="guide-halo" />
              <span className="guide-portal block h-11 w-11 overflow-hidden rounded-full">
                <Image
                  src={ASTRO_SRC}
                  alt=""
                  width={44}
                  height={44}
                  className="pointer-events-none h-full w-full object-contain"
                />
                <span aria-hidden="true" className="guide-glint" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {nameTag}
              <p role="status" className="text-[13px] leading-relaxed text-ink-soft">
                {tip}
              </p>
              <div className="mt-1.5 flex items-center gap-1" aria-hidden="true">
                {stepList.map((s, i) => (
                  <span
                    key={s.id}
                    className={`h-1 rounded-full transition-all ${
                      i === step ? "w-4 bg-accent" : "w-1 bg-card-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                ref={nextRef}
                type="button"
                onClick={() => stepChange(-1)}
                disabled={step <= 0}
                aria-label="Previous section"
                className={controlCls}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => stepChange(1)}
                disabled={step >= stepList.length - 1}
                aria-label="Next section"
                className={controlCls}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={endTour}
                aria-label="End tour"
                className={controlCls}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}