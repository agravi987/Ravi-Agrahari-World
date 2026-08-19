/**
 * CameraRig.tsx — T2 orbit camera (v4 §6.2 + P6 zoom/fly).
 * Spherical controls around a center point (origin, or a focused
 * planet). Polar angle clamped to [1.15, 1.48] rad (~66°–85° from
 * vertical) so the view always looks down on the galaxy plane and
 * NEVER goes edge-on — that's what keeps screen-space ≈ world-space
 * (the zero-overlap visual guarantee holds at every reachable angle).
 *
 * P6 additions:
 *  - zoomBy / zoomTo: a distance multiplier (0.35×–2.5× of fit).
 *  - flyToPlanet(slug): smooth fly-in that chases the planet's live
 *    position (it keeps orbiting) and then holds the camera focused
 *    on it at ~42% distance while auto-rotate continues around it —
 *    "zoom into a planet and explore" (moons stay in view).
 *  - resetView: ease back to the overview framing.
 */
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export interface CameraRigApi {
  panToAzimuth: (azimuthDeg: number) => void;
  zoomBy: (factor: number) => void;
  zoomTo: (multiplier: number) => void;
  resetView: () => void;
  flyToPlanet: (slug: string) => void;
}

/** Live camera state — reported only on discrete changes (no per-frame
 *  React churn). The UI uses it to hide the DOM sun while "in" a planet,
 *  show the zoom %, and surface a Return-to-overview affordance. */
export interface RigState {
  focused: boolean;
  distMul: number;
}

const PHI_MIN = 1.15;
const PHI_MAX = 1.48;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
/** Distance multiplier when fully focused on a planet (≈ 42% of fit). */
const FOCUS_DIST = 0.42;

export default function CameraRig({
  worldSize,
  allowDrag,
  autoRotate,
  getPlanetPos,
  onReady,
  onState,
}: {
  worldSize: number;
  allowDrag: boolean;
  autoRotate: boolean;
  getPlanetPos: (slug: string) => { x: number; z: number } | null;
  onReady: (api: CameraRigApi) => void;
  /** Fires on discrete focus/zoom changes (throttled, no per-frame spam). */
  onState?: (s: RigState) => void;
}) {
  const { camera, gl } = useThree();
  const st = useRef({
    theta: 0.35,
    phi: 1.32, // ~75.6° from vertical → gentle 14° tilt
    targetTheta: null as number | null,
    dragging: false,
    lastX: 0,
    lastY: 0,
    distMul: 1,
    focusSlug: null as string | null,
    focusFrac: 0, // 0 = overview, 1 = fully focused on a planet
    center: { x: 0, z: 0 },
  });

  // Distance so the whole system fits the fov-45 frustum.
  const fitDist = ((worldSize / 2) / Math.tan((45 * Math.PI) / 360)) * 1.06;

  const onStateRef = useRef(onState);
  const lastReport = useRef({ focused: false, distMul: 1 });
  useEffect(() => {
    onStateRef.current = onState;
  }, [onState]);

  useEffect(() => {
    onReady({
      panToAzimuth: (deg) => {
        st.current.targetTheta = (deg * Math.PI) / 180;
      },
      zoomBy: (f) => {
        st.current.distMul = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, st.current.distMul * f));
      },
      zoomTo: (m) => {
        st.current.distMul = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, m));
      },
      resetView: () => {
        st.current.focusSlug = null;
        st.current.focusFrac = 0;
        st.current.distMul = 1;
        st.current.targetTheta = 0.35;
      },
      flyToPlanet: (slug) => {
        if (!getPlanetPos(slug)) return;
        st.current.focusSlug = slug;
        st.current.targetTheta = null;
      },
    });
  }, [onReady, getPlanetPos]);

  // Clamped drag-rotate on the canvas element.
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (!allowDrag) return;
      st.current.dragging = true;
      st.current.lastX = e.clientX;
      st.current.lastY = e.clientY;
      st.current.targetTheta = null;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const move = (e: PointerEvent) => {
      if (!st.current.dragging) return;
      const dx = e.clientX - st.current.lastX;
      const dy = e.clientY - st.current.lastY;
      st.current.lastX = e.clientX;
      st.current.lastY = e.clientY;
      st.current.theta -= dx * 0.005;
      st.current.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, st.current.phi + dy * 0.004));
    };
    const up = (e: PointerEvent) => {
      st.current.dragging = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [allowDrag, gl]);

  // Wheel zoom — the hint advertises "scroll to zoom"; this is what
  // actually makes it work (clamped, works while focused too so you can
  // zoom into the focused planet's moons).
  useEffect(() => {
    const el = gl.domElement;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.9;
      st.current.distMul = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, st.current.distMul * factor));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [gl]);

  useFrame((_, delta) => {
    const s = st.current;

    // Auto-rotate — around the planet while focused, else the origin.
    if (autoRotate && !s.dragging && s.targetTheta === null) {
      s.theta += delta * 0.045; // ~2.6°/s — slow, serene
    }
    if (s.targetTheta !== null) {
      let diff = s.targetTheta - s.theta;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.theta += diff * Math.min(1, delta * 2.5);
      if (Math.abs(diff) < 0.015) {
        s.theta = s.targetTheta;
        s.targetTheta = null;
      }
    }

    // Focus: ease focusFrac toward its target, chase the planet's live
    // position so the camera follows it as it keeps orbiting.
    const focusTarget = s.focusSlug ? getPlanetPos(s.focusSlug) : null;
    if (focusTarget) {
      s.focusFrac = Math.min(1, s.focusFrac + delta * 1.4);
      const k = Math.min(1, delta * 4);
      s.center.x += (focusTarget.x - s.center.x) * k;
      s.center.z += (focusTarget.z - s.center.z) * k;
    } else {
      s.focusFrac = Math.max(0, s.focusFrac - delta * 1.4);
      const k = Math.min(1, delta * 4);
      s.center.x += -s.center.x * k;
      s.center.z += -s.center.z * k;
    }

    const dist = fitDist * s.distMul * (1 - s.focusFrac * (1 - FOCUS_DIST));
    const sinP = Math.sin(s.phi);
    const cosP = Math.cos(s.phi);
    camera.position.set(
      s.center.x + dist * sinP * Math.sin(s.theta),
      dist * cosP,
      s.center.z + dist * sinP * Math.cos(s.theta)
    );
    camera.lookAt(s.center.x, 0, s.center.z);

    // Report focus/zoom changes to the DOM overlay (throttled to
    // discrete steps so the parent doesn't re-render every frame).
    const focused = s.focusFrac > 0.5;
    if (
      focused !== lastReport.current.focused ||
      Math.abs(s.distMul - lastReport.current.distMul) > 0.02
    ) {
      lastReport.current = { focused, distMul: s.distMul };
      onStateRef.current?.({ focused, distMul: s.distMul });
    }
  });

  return null;
}
