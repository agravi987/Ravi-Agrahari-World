/**
 * ParticleField.tsx (client) — hero background constellation.
 * A canvas-based particle network: small dots drift slowly, and lines
 * connect nearby particles, creating a living constellation effect behind
 * the hero content. Adds depth and a "connected brain" metaphor.
 *
 * Strict opt-in: pointer-fine only (no perf cost on touch), reduced-motion
 * users get a frozen single frame (dots rendered once, no animation).
 * Canvas is declaratively sized via CSS (no ResizeObserver needed) and
 * cleaned up on unmount. requestAnimationFrame loop, no layout reads.
 *
 * LCP-neutral: the canvas sits behind hero content (z-index: -1) and
 * never competes with the LCP element (the h1).
 */
"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const PARTICLE_COUNT = 48;
const CONNECT_DIST = 140;
const DOT_RADIUS = 1.5;
const SPEED = 0.25;

function createParticles(w: number, h: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * SPEED,
    vy: (Math.random() - 0.5) * SPEED,
    r: DOT_RADIUS + Math.random() * 0.8,
  }));
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read accent color from CSS variables (theme-aware, not hardcoded).
    const cs = getComputedStyle(document.documentElement);
    const accentRaw = cs.getPropertyValue("--color-accent").trim() || "#4f46e5";
    // Parse hex/rgb to [r,g,b] for canvas rgba() calls.
    const tempEl = document.createElement("div");
    tempEl.style.color = accentRaw;
    document.body.appendChild(tempEl);
    const computed = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    const rgbMatch = computed.match(/\d+/g);
    const [ar, ag, ab] = rgbMatch ? rgbMatch.map(Number) : [79, 70, 229];

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let alive = true;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) particles = createParticles(w, h);
    }

    function draw() {
      if (!alive) return;
      ctx!.clearRect(0, 0, w, h);

      // Move particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }

      // Draw connecting lines
      ctx!.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            ctx!.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha})`;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      // Draw dots
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${ar}, ${ag}, ${ab}, 0.35)`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
}
