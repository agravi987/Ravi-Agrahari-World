"use client";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * SectionDivider.tsx — colorful gradient divider between sections.
 * Adds visual rhythm and a premium touch. Uses all topic hues
 * in a flowing gradient. Respects reduced-motion.
 */
export default function SectionDivider() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none mx-auto max-w-5xl px-6"
    >
      <div
        className={`relative h-1 w-full overflow-hidden ${
          reduceMotion ? "" : "animate-divider-flow"
        }`}
      >
        <div
          className="absolute inset-0 h-full bg-gradient-to-r from-topic-cloud via-topic-devops via-topic-ai via-topic-linux via-topic-mars to-topic-ice"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>
    </div>
  );
}