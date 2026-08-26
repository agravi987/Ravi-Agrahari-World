/**
 * ProjectCover.tsx — P8 colorful pass.
 * Every project card gets a cover header: the CMS coverImage when
 * present, otherwise a rich two-tone gradient derived from the
 * project's tech stack (deterministic hash → hue), with the first
 * tech initial as a soft watermark. Keeps cards colorful and
 * distinct even with zero images uploaded (the seed has none).
 */
"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { withCloudinaryOptimizations } from "@/lib/imageHosts";

/** Deterministic hash so the same tech list always gets the same hue. */
function hashTech(tech: string[]): number {
  let h = 0;
  for (const t of tech) h = (h * 31 + (t.charCodeAt(0) || 0)) % 360;
  return h;
}

/** Pre-defined vibrant gradient pairs (light-safe, not neon). */
const GRADIENTS: [string, string][] = [
  ["#6366f1", "#22d3ee"], // indigo → cyan (the brand pair)
  ["#0ea5e9", "#14b8a6"], // sky → teal
  ["#8b5cf6", "#f472b6"], // violet → pink
  ["#f59e0b", "#f43f5e"], // amber → rose
  ["#10b981", "#0ea5e9"], // emerald → sky
  ["#f97316", "#eab308"], // orange → yellow
];

export default function ProjectCover({
  image,
  title,
  tech,
  className,
}: {
  image?: string;
  title: string;
  tech: string[];
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const pair = GRADIENTS[hashTech(tech) % GRADIENTS.length];
  const initial = (tech[0] ?? title).charAt(0).toUpperCase();

  if (image) {
    return (
      <div className={clsx("overflow-hidden bg-card", !loaded && "img-shimmer", className)}>
        {/* CMS-provided URL (Cloudinary) — next/image isn't applicable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withCloudinaryOptimizations(image)}
          alt=""
          loading="lazy"
          // Phase 10 perf: async decode keeps the main thread free; sizes
          // tells the browser which image size to fetch for this layout.
          decoding="async"
          sizes="(max-width: 640px) 92vw, 480px"
          onLoad={() => setLoaded(true)}
          // Phase 15 (#7): muted at rest, full color + slow zoom on hover;
          // project-cover-img carries the dark-mode brightness rule.
          className={clsx(
            "project-cover-img h-full w-full object-cover transition-[transform,filter] duration-500 group-hover:scale-105 group-hover:grayscale-0 grayscale-[45%]",
            loaded ? "opacity-100 loaded" : "opacity-0",
          )}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={clsx("relative overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})` }}
    >
      {/* P9: diagonal shine sweeps across on hover (transform-only). */}
      <span className="cover-shine absolute inset-0" />
      <span
        className="absolute -bottom-6 -right-2 select-none font-display text-[7rem] font-bold leading-none text-white/15"
      >
        {initial}
      </span>
      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-white/30" />
      <span className="absolute right-7 top-5 h-1.5 w-1.5 rounded-full bg-white/20" />
    </div>
  );
}
