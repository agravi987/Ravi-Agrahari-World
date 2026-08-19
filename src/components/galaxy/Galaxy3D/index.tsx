/**
 * Galaxy3D/index.tsx — the T2 WebGL surface (v4 §6.2), LAZY chunk.
 * Loaded only on /detailed-galaxy via next/dynamic({ ssr: false }) —
 * the home page bundle never sees three.js.
 *
 * - ErrorBoundary: WebGL failure → onError() → parent falls back to
 *   the T3 static system (identical content, real buttons).
 * - IntersectionObserver: frameloop goes to "never" when scrolled
 *   out of view (zero GPU cost off-screen).
 * - The DOM avatar sun (crisp photo, no texture stretching) sits
 *   above the canvas, centered on the 3D origin — the camera always
 *   looks at the origin, so the two align perfectly.
 */
"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import Scene, { type Projector } from "./Scene";
import { type CameraRigApi, type RigState } from "./CameraRig";
import GalaxyBackground from "../GalaxyBackground";
import type { GalaxyData } from "@/types/galaxy";

class GlErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Galaxy3D({
  galaxy,
  filter,
  activeId,
  triggerHandlers,
  registerProjector,
  registerFocus,
  onRigReady,
  onRigState,
  onError,
  allowDrag,
}: {
  galaxy: GalaxyData;
  filter: string;
  activeId: string | null;
  triggerHandlers: (id: string) => Record<string, unknown>;
  registerProjector: (fn: Projector | null) => void;
  registerFocus: (fn: (slug: string) => void) => void;
  onRigReady: (api: CameraRigApi) => void;
  onRigState: (s: RigState) => void;
  onError: () => void;
  allowDrag: boolean;
}) {
  const { settings } = galaxy;
  const [inView, setInView] = useState(true);
  const [rigState, setRigState] = useState<RigState>({ focused: false, distMul: 1 });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className="galaxy-stage-3d relative mx-auto aspect-square w-full max-w-[720px]"
    >
      <GalaxyBackground
        showStars={settings.showStars}
        density={settings.starDensity}
        nebula={settings.nebulaVisible}
      />
      <GlErrorBoundary onError={onError}>
        <Canvas
          dpr={[1, 1.75]}
          frameloop={inView ? "always" : "never"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 45, near: 1, far: 30000, position: [0, 500, 3000] }}
        >
          <Scene
            galaxy={galaxy}
            filter={filter}
            activeId={activeId}
            triggerHandlers={triggerHandlers}
            registerProjector={registerProjector}
            registerFocus={registerFocus}
            onRigReady={onRigReady}
            onRigState={(s) => {
              setRigState(s);
              onRigState(s);
            }}
            rigState={rigState}
            allowDrag={allowDrag}
          />
        </Canvas>
      </GlErrorBoundary>
    </div>
  );
}
