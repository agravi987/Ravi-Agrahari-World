/**
 * Hero.tsx (client) — plan S3
 * Name + one-liner + rotating roles (500ms fade), CTA buttons,
 * orbital ring (CSS animation, pauses on reduced-motion) and a
 * scroll cue. Content comes from lib/content.ts, never hardcoded.
 */
"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface HeroProps {
  name: string;
  headline: string;
  roles: string[];
  github: string;
  email: string;
  /** Momentum badge text — from the CMS, never hardcoded (P0 fix). */
  currentlyLearning: string;
}

/** Rotating role: swaps every 2.2s with a 500ms fade (plan S3). */
function RotatingRole({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || roles.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % roles.length), 2200);
    return () => clearInterval(timer);
  }, [roles.length, reduceMotion]);

  return (
    <span className="relative inline-block text-accent">
      <AnimatePresence mode="wait">
        <motion.span
          key={roles[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
          className="inline-block"
        >
          {roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Orbital ring: pure CSS spin, paused for reduced-motion (plan §4). */
function OrbitalRing() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 h-[420px] w-[420px] rounded-full border border-accent/10 ${
        reduceMotion ? "" : "animate-spin-slow"
      }`}
    >
      <span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-accent-cyan shadow-[0_0_12px] shadow-accent-cyan" />
    </div>
  );
}

export default function Hero({
  name,
  headline,
  roles,
  github,
  email,
  currentlyLearning,
}: HeroProps) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-[85dvh] flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* ONE indigo→cyan gradient: hero ring only (plan §4.1) */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-20 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent-cyan)_15%,transparent),transparent_65%)] blur-2xl"
      />
      <OrbitalRing />

      {/* Currently-learning momentum badge (plan §4.2 core) */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-1.5 text-xs font-medium text-ink-soft"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan" />
        </span>
        currently learning: {currentlyLearning}
      </motion.p>

      <motion.h1
        id="hero-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl"
      >
        {name} — <RotatingRole roles={roles} />
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 max-w-xl text-lg text-ink-soft"
      >
        {headline}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button href={`mailto:${email}`}>Get in touch</Button>
        <Button href={`https://github.com/${github}`} variant="secondary">
          View GitHub
        </Button>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#skills"
        aria-label="Scroll to skills"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-ink-faint transition-colors hover:text-accent"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.a>
    </section>
  );
}
