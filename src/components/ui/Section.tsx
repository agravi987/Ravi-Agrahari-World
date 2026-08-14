/**
 * Section.tsx — UI primitive (plan S2)
 * Consistent section shell: <section id> + terminal eyebrow +
 * display-font title + optional description + children.
 * Scroll reveal: fades up once (60ms stagger, plan §4/§9),
 * skipped for reduced-motion users.
 */
"use client";

import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import Eyebrow from "./Eyebrow";

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: SectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-title`}
      // py-14 gives every section the same generous vertical rhythm
      // (ui-ux-design.md clean-up: consistent whitespace, plan §4).
      className={clsx("scroll-mt-24 py-14", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <Eyebrow label={eyebrow} />
        <h2
          id={`${id}-title`}
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          {title}
        </h2>
        {description && <p className="mt-3 max-w-2xl text-ink-soft">{description}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </motion.section>
  );
}
