/**
 * GalaxyPreviewStage.tsx (CLIENT) — the home preview's renderer switcher.
 * P21: the landing Learning Galaxy now shows the REAL 3D system (same
 * shared lazy WebGL chunk as /detailed-galaxy) when it makes sense:
 * WebGL available, no prefers-reduced-motion, threeDEffect enabled, and
 * the stage scrolled near the viewport. Otherwise it degrades to the
 * pure-CSS GalaxyStage2D (zero JS, LCP-cheap) — the server always
 * renders that first, so the swap is seamless and never empty.
 *
 * The 3D canvas is pointer-events-none: no drag-zoom, no raycast cards —
 * the whole stage is an <a href="/detailed-galaxy"> so a click just
 * takes you to the explorer. The camera auto-rotates (settings-driven).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GalaxyData } from "@/types/galaxy";
import GalaxyStage2D from "@/components/galaxy/GalaxyStage2D";

// Shared lazy chunk — loaded by BOTH the detail page and this preview,
// so three.js is downloaded once and cached (scripts/check-bundles.mjs
// enforces it never lands in the home page's synchronous bundle).
const Galaxy3D = dynamic(() => import("@/components/galaxy/Galaxy3D"), {
  ssr: false,
});

export default function GalaxyPreviewStage({ galaxy }: { galaxy: GalaxyData }) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (galaxy.settings.threeDEffect === false) return;

    let supported = false;
    try {
      const c = document.createElement("canvas");
      supported = !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl"))
      );
    } catch {
      supported = false;
    }
    if (!supported) return;

    if (typeof IntersectionObserver === "undefined") return; // stay 2D — no viewer gate

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setMode("3d");
      },
      { rootMargin: "400px" } // warm the chunk up just before it scrolls in
    );
    io.observe(el);
    return () => io.disconnect();
  }, [galaxy.settings.threeDEffect]);

  return (
    <div ref={wrapRef} className="group relative mx-auto w-full max-w-[420px]">
      {/* P25: soft radial glow behind the stage */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent)_10%,transparent),transparent_65%)] blur-2xl"
      />

      {mode === "3d" ? (
        <a
          href="/detailed-galaxy"
          aria-label="Open the interactive learning galaxy"
          className="galaxy-stage block w-full transition-shadow duration-300 hover:shadow-orbital"
        >
          <Galaxy3D
            galaxy={galaxy}
            stageClassName="pointer-events-none"
            onError={() => setMode("2d")} // WebGL failure → CSS fallback
          />
        </a>
      ) : (
        <GalaxyStage2D galaxy={galaxy} />
      )}

      {/* P25: hover hint — pure CSS */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-card-border bg-card/90 px-3 py-1 text-[11px] text-ink-soft opacity-0 shadow-card backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
      >
        click to explore →
      </span>
    </div>
  );
}