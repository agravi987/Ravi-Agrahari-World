"use client";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * GradientMesh.tsx — colorful ambient background mesh.
 * Multiple soft topic-hued blobs drift slowly behind content,
 * creating depth and color without distracting from text.
 * Frozen by prefers-reduced-motion.
 */
export default function GradientMesh() {
  const reduceMotion = useReducedMotion();
  const anim = reduceMotion ? "" : "animate-mesh-drift";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Cloud blue — top left */}
      <div
        className={`absolute left-[-5%] top-[-10%] h-[480px] w-[480px] rounded-full blur-3xl opacity-30 ${anim}`}
        style={{
          background: "radial-gradient(circle, var(--color-topic-cloud) 0%, transparent 70%)",
          animationDelay: "0s",
        }}
      />
      {/* DevOps teal — top right */}
      <div
        className={`absolute right-[-5%] top-[5%] h-[520px] w-[520px] rounded-full blur-3xl opacity-25 ${anim}`}
        style={{
          background: "radial-gradient(circle, var(--color-topic-devops) 0%, transparent 70%)",
          animationDelay: "-3s",
        }}
      />
      {/* AI violet — center bottom */}
      <div
        className={`absolute left-1/2 bottom-[-15%] h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl opacity-20 ${anim}`}
        style={{
          background: "radial-gradient(circle, var(--color-topic-ai) 0%, transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      {/* Linux amber — bottom left */}
      <div
        className={`absolute left-[15%] bottom-[10%] h-[400px] w-[400px] rounded-full blur-3xl opacity-20 ${anim}`}
        style={{
          background: "radial-gradient(circle, var(--color-topic-linux) 0%, transparent 70%)",
          animationDelay: "-9s",
        }}
      />
      {/* Mars red — bottom right */}
      <div
        className={`absolute right-[10%] bottom-[5%] h-[360px] w-[360px] rounded-full blur-3xl opacity-15 ${anim}`}
        style={{
          background: "radial-gradient(circle, var(--color-topic-mars) 0%, transparent 70%)",
          animationDelay: "-12s",
        }}
      />
   </div>
  );
}