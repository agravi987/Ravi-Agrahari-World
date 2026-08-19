/**
 * Scene.tsx — the T2 WebGL scene contents (v4 §6.2).
 * Locked constellation in 3D: planets as flat billboarded sprites
 * (always face the camera — crisp, premium, no cartoon spheres),
 * ALL moons in ONE InstancedMesh draw call, faint orbit rings
 * (drei Line), a soft pulsing sun glow, and gentle drifting
 * sparkles. Camera is clamped (§CameraRig) so the zero-overlap
 * guarantee holds at every reachable angle.
 *
 * Interaction: pointer raycasts the planet sprites and feeds the
 * SAME sticky-card hook as the 2D layer (via triggerHandlers), and
 * exposes a projector (3D → screen px) the card overlay uses to
 * track the hovered planet. The canvas itself is aria-hidden — all
 * keyboard access goes through the IndexPanel (real buttons).
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import CameraRig, { type CameraRigApi, type RigState } from "./CameraRig";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { glowTexture, moonTexture, planetTexture, sunTexture } from "./textures";
import { moonTypeColor } from "../MoonCard";
import type { GalaxyData, GalaxyMoon, GalaxyPlanetWithMoons, GalaxyProfile } from "@/types/galaxy";

export type Projector = (slug: string) => { x: number; y: number } | null;

const DEG = Math.PI / 180;

/** Orbit ring as a dotted ring that FLOWS (P12). The 2D tier's orbit
 *  dashes already flow; the old 3D tier used static solid drei Lines —
 *  this replaces them with evenly-spaced points that rotate around the
 *  orbit at a constant 30 s/rev (matching the 2D orbit-dash pace), so
 *  the dots visibly travel along the orbit just like the 2D dashes. */
function OrbitRingDots({ radius, color, opacity, paused }: { radius: number; color: string; opacity: number; paused?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const n = 48; // dots per ring — enough to read as a dotted circle
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * radius;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [radius]);

  const reducedMotion = useReducedMotion();
  useFrame((_, delta) => {
    if (group.current && !paused && !reducedMotion) {
      // 30 s per revolution — matches the 2D orbit-dash pace.
      group.current.rotation.y += (delta * Math.PI * 2) / 30;
    }
  });

  if (radius === 0) return null;
  return (
    <group ref={group}>
      <points geometry={geo} frustumCulled={false}>
        <pointsMaterial
          size={4}
          sizeAttenuation
          transparent
          opacity={opacity}
          color={color}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/** A planet = one billboarded sprite with a canvas-textured disc.
 *  Registers itself in the scene's sprite map (for raycast hover
 *  + 3D→screen projection) and unregisters on unmount. */
function PlanetSprite({
  planet,
  texture,
  active,
  register,
}: {
  planet: GalaxyPlanetWithMoons;
  texture: THREE.Texture;
  active: boolean;
  register: (slug: string, sprite: THREE.Sprite | null) => void;
}) {
  const ref = useRef<THREE.Sprite>(null);
  useEffect(() => {
    register(planet.slug, ref.current);
    return () => register(planet.slug, null);
  }, [planet.slug, register]);
  useFrame((s) => {
    const sp = ref.current;
    if (!sp) return;
    const t = s.clock.elapsedTime;
    const ang = (planet.orbitAngle + (t * 360) / planet.orbitSpeed) * DEG;
    // P6 "alive" motion: gentle vertical bob (2.5px) + slow texture sway
    // (±0.1 rad) — subtle life without breaking the flat orbital plane
    // (z-jitter only, so the zero-overlap lanes are untouched).
    sp.position.set(
      Math.cos(ang) * planet.orbitRadius,
      Math.sin(t * 1.3 + planet.orbitAngle) * 2.5,
      Math.sin(ang) * planet.orbitRadius
    );
    const mat = sp.material as THREE.SpriteMaterial;
    mat.rotation = Math.sin(t * 0.8 + planet.orbitAngle) * 0.1;
    const sc = planet.size * (active ? 1.12 : 1);
    sp.scale.set(sc, sc, 1);
  });
  return (
    <sprite ref={ref} userData={{ slug: planet.slug }}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/** All visible moons in a single draw call (three InstancedMesh).
 *  REAL 3D spheres, not flat discs: SphereGeometry + a white sphere-shaded
 *  canvas texture, tinted per-instance by the moon TYPE color (instance
 *  color × texture = a shaded colored marble that reads as round in
 *  perspective, not a flat dot). */
function MoonLayer({ galaxy, filter }: { galaxy: GalaxyData; filter: string }) {
  const { planets } = galaxy;
  const entries = useMemo(() => {
    const out: { planet: GalaxyPlanetWithMoons; moon: GalaxyMoon }[] = [];
    for (const p of planets) {
      const moons = filter === "all" ? p.moons : p.moons.filter((m) => m.type === filter);
      for (const m of moons) out.push({ planet: p, moon: m });
    }
    return out;
  }, [planets, filter]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.5, 14, 14), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: moonTexture(), transparent: true, opacity: 0.96 }),
    []
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Per-instance colors from the moon TYPE (configurable list).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < entries.length; i++) {
      mesh.setColorAt(i, new THREE.Color(moonTypeColor(entries[i].moon.type)));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [entries]);

  useFrame((s) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = s.clock.elapsedTime;
    // Moon orbits tilt ~24° off the system plane (real-solar-system feel:
    // moons rise and fall around their planet instead of lying flat).
    const INC = 0.42;
    for (let i = 0; i < entries.length; i++) {
      const { planet, moon } = entries[i];
      const pAng = (planet.orbitAngle + (t * 360) / planet.orbitSpeed) * DEG;
      const px = Math.cos(pAng) * planet.orbitRadius;
      const pz = Math.sin(pAng) * planet.orbitRadius;
      const mAng = (moon.orbitAngle + (t * 360) / moon.orbitSpeed) * DEG;
      const mr = moon.orbitRadius;
      dummy.position.set(
        px + Math.cos(mAng) * mr,
        Math.sin(mAng) * mr * Math.sin(INC),
        pz + Math.sin(mAng) * mr * Math.cos(INC)
      );
      // Moon spheres read as clear dots at ~1.1× their orbit spacing;
      // raw size/2 renders them as sub-3px specks at camera distance.
      dummy.scale.setScalar(Math.max(8, moon.size * 1.1));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, entries.length]} frustumCulled={false} />;
}

/** Soft pulsing glow behind the 3D sun body (normal blending, no bloom).
 *  Dims while the camera is focused/zoomed so it can't wash over the
 *  planet you're exploring. */
function SunGlow({ dark, intensity = 1 }: { dark: boolean; intensity?: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => glowTexture(), []);
  useFrame((s) => {
    const sp = ref.current;
    if (!sp) return;
    const pulse = 1 + Math.sin(s.clock.elapsedTime * 1.1) * 0.08;
    sp.scale.setScalar(560 * pulse);
    (sp.material as THREE.SpriteMaterial).opacity = intensity * (dark ? 0.5 : 0.32);
  });
  return (
    <sprite ref={ref} position={[0, 0, 0]} scale={[560, 560, 1]}>
      <spriteMaterial
        map={tex}
        color={dark ? "#818cf8" : "#4f46e5"}
        transparent
        depthWrite={false}
      />
    </sprite>
  );
}

/**
 * AsteroidBelt — a faint ring of rock dots in the widest radial gap
 * between planet lanes (P6). Pure decoration: no pointer events, no
 * overlap guarantee (it sits in empty space between lanes by
 * construction). One draw call (THREE.Points).
 */
function AsteroidBelt({ planets, dark }: { planets: GalaxyPlanetWithMoons[]; dark: boolean }) {
  const { radius, spread } = useMemo(() => {
    // Lane edges per planet (radius ± size/2 ± max moon sweep).
    const lanes = planets
      .map((p) => {
        const sweep = Math.max(0, ...p.moons.map((m) => m.orbitRadius + m.size / 2));
        return {
          r: p.orbitRadius,
          inner: p.orbitRadius - p.size / 2 - sweep,
          outer: p.orbitRadius + p.size / 2 + sweep,
        };
      })
      .sort((a, b) => a.r - b.r);
    let best = { mid: 0, width: 0 };
    for (let i = 1; i < lanes.length; i++) {
      const gap = lanes[i].inner - lanes[i - 1].outer;
      if (gap > best.width) best = { mid: (lanes[i].inner + lanes[i - 1].outer) / 2, width: gap };
    }
    return best.width > 24 ? { radius: best.mid, spread: best.width * 0.45 } : { radius: 0, spread: 0 };
  }, [planets]);

  const groupRef = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    // Deterministic jitter (no Math.random — the compiler requires pure
    // render code); stable across renders, one draw call for the belt.
    const jitter = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      const a = jitter(i) * Math.PI * 2;
      const r = radius + (jitter(i + 7) - 0.5) * 2 * spread;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (jitter(i + 13) - 0.5) * 6; // slight thickness
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [radius, spread]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.025;
  });

  if (radius === 0) return null;
  return (
    <group ref={groupRef}>
      <points geometry={geo} frustumCulled={false}>
        <pointsMaterial
          size={3.2}
          sizeAttenuation
          transparent
          opacity={dark ? 0.3 : 0.22}
          color={dark ? "#cbd5e1" : "#78716c"}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/** Loads the profile photo (or initials) into a canvas texture for the
 *  3D sun body. Returns null until the first build completes. */
function useSunTexture(profile: GalaxyProfile): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    const make = (img: HTMLImageElement | null) => {
      const t = sunTexture(img, profile.name);
      if (alive) setTex(t);
    };
    if (profile.image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => make(img);
      img.onerror = () => make(null);
      img.src = profile.image;
    } else {
      make(null);
    }
    return () => {
      alive = false;
    };
  }, [profile.image, profile.name]);
  return tex;
}

/** The sun as a REAL celestial body at the origin — a billboarded sprite
 *  with the profile photo/initials face + a slow breathe, wrapped in a
 *  faint rotating dashed ring (like the 2D sun's indigo ring). Because it
 *  lives in the 3D world, it recedes naturally when you zoom to a planet
 *  (no overlap, never "goes missing") — exactly like the planets around it.
 *  The face is the admin's profile photo (siteConfig.profileImage). */
function SunBody({ profile }: { profile: GalaxyProfile }) {
  const tex = useSunTexture(profile);
  const ref = useRef<THREE.Sprite>(null);
  const ringRef = useRef<THREE.Points>(null);
  const ringGeo = useMemo(() => {
    const n = 40;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * 165;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * 165;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((s) => {
    const sp = ref.current;
    if (sp) {
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 1.1) * 0.03;
      sp.scale.setScalar(150 * pulse);
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = s.clock.elapsedTime * 0.06;
    }
  });
  return (
    <>
      <points ref={ringRef} geometry={ringGeo} frustumCulled={false}>
        <pointsMaterial
          size={5}
          sizeAttenuation
          transparent
          opacity={0.4}
          color="#818cf8"
          depthWrite={false}
        />
      </points>
      {tex && (
        <sprite ref={ref} position={[0, 0, 0]}>
          <spriteMaterial map={tex} transparent depthWrite={false} />
        </sprite>
      )}
    </>
  );
}

/** A comet on a FIXED elliptical orbit around the sun (Halley-style —
 *  a wide ellipse that crosses the inner lanes). The faint dashed ellipse
 *  marks the path; the glowing head rides it. Parametric motion, one
 *  sprite + one points geometry — cheap. */
function CometOrbit3D({
  semiMajor,
  squash,
  speed,
  phase,
  size = 30,
  dark,
}: {
  semiMajor: number;
  squash: number;
  speed: number;
  phase: number;
  size?: number;
  dark: boolean;
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => glowTexture(), []);
  const path = useMemo(() => {
    const n = 72;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * semiMajor;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = Math.sin(a) * semiMajor * squash;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [semiMajor, squash]);

  useFrame((s) => {
    const sp = spriteRef.current;
    if (!sp) return;
    const t = s.clock.elapsedTime * speed + phase;
    sp.position.set(Math.cos(t) * semiMajor, 0, Math.sin(t) * semiMajor * squash);
  });

  return (
    <>
      <points geometry={path} frustumCulled={false}>
        <pointsMaterial
          size={3.4}
          sizeAttenuation
          transparent
          opacity={dark ? 0.3 : 0.24}
          color={dark ? "#c7d2fe" : "#6d28d9"}
          depthWrite={false}
        />
      </points>
      <sprite ref={spriteRef} scale={[size, size, 1]}>
        <spriteMaterial
          map={tex}
          color={dark ? "#c7d2fe" : "#6366f1"}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </sprite>
    </>
  );
}

export default function Scene({
  galaxy,
  filter,
  activeId,
  triggerHandlers,
  registerProjector,
  registerFocus,
  onRigReady,
  onRigState,
  rigState,
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
  rigState: RigState;
  allowDrag: boolean;
}) {
  const { settings, planets } = galaxy;
  const { camera, gl } = useThree();
  const world = useMemo(() => {
    let maxExtent = 0;
    for (const p of planets) {
      let ext = p.orbitRadius + p.size / 2;
      for (const m of p.moons) ext = Math.max(ext, p.orbitRadius + m.orbitRadius + m.size / 2);
      maxExtent = Math.max(maxExtent, ext);
    }
    return Math.max(240, Math.ceil((maxExtent + 28) * 2));
  }, [planets]);

  const spritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const rigApi = useRef<CameraRigApi | null>(null);
  const timeRef = useRef(0);
  const hoverRef = useRef<string | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  // Theme-aware colors (light paper theme by default; dark mode detected).
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.dataset.theme === "dark");
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const textures = useMemo(() => {
    const m = new Map<string, THREE.Texture>();
    for (const p of planets) m.set(p.slug, planetTexture(p.color, p.icon));
    return m;
  }, [planets]);

  // Track elapsed time for focus pan + projection.
  useFrame((s) => {
    timeRef.current = s.clock.elapsedTime;
  });

  // P6: live world position of a planet (the camera chases this while
  // focused, so it follows the planet as it keeps orbiting).
  const getPlanetPos = useMemo(
    () => (slug: string) => {
      const p = planets.find((x) => x.slug === slug);
      if (!p) return null;
      const t = timeRef.current;
      const ang = (p.orbitAngle + (t * 360) / p.orbitSpeed) * DEG;
      return { x: Math.cos(ang) * p.orbitRadius, z: Math.sin(ang) * p.orbitRadius };
    },
    [planets]
  );

  // Focus: pan the camera toward a planet's current azimuth.
  useEffect(() => {
    registerFocus((slug) => {
      const p = planets.find((x) => x.slug === slug);
      if (!p || !rigApi.current) return;
      const ang = (p.orbitAngle + (timeRef.current * 360) / p.orbitSpeed) % 360;
      rigApi.current.panToAzimuth(ang);
    });
    return () => registerFocus(() => {});
  }, [planets, registerFocus]);

  // Projector: world position → viewport px (for the DOM card overlay).
  useEffect(() => {
    const project: Projector = (slug) => {
      const sp = spritesRef.current.get(slug);
      if (!sp) return null;
      const v = new THREE.Vector3();
      sp.getWorldPosition(v).project(camera);
      if (v.z > 1 || v.z < -1) return null;
      const rect = gl.domElement.getBoundingClientRect();
      return {
        x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
      };
    };
    registerProjector(project);
    return () => registerProjector(null);
  }, [camera, gl, registerProjector]);

  // Pointer raycast → same sticky-card handlers as the 2D layer.
  useEffect(() => {
    const el = gl.domElement;
    const pick = (clientX: number, clientY: number): string | null => {
      const rect = el.getBoundingClientRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const objs = [...spritesRef.current.values()];
      const hits = raycaster.intersectObjects(objs, false);
      return hits.length ? (hits[0].object.userData.slug as string) : null;
    };
    const move = (e: PointerEvent) => {
      const slug = pick(e.clientX, e.clientY);
      const cur = hoverRef.current;
      if (slug && slug !== cur) {
        if (cur) (triggerHandlers(`planet:${cur}`).onPointerLeave as (() => void) | undefined)?.();
        hoverRef.current = slug;
        (triggerHandlers(`planet:${slug}`).onPointerEnter as (() => void) | undefined)?.();
      } else if (!slug && cur) {
        (triggerHandlers(`planet:${cur}`).onPointerLeave as (() => void) | undefined)?.();
        hoverRef.current = null;
      }
    };
    const leave = () => {
      if (hoverRef.current) {
        (triggerHandlers(`planet:${hoverRef.current}`).onPointerLeave as (() => void) | undefined)?.();
        hoverRef.current = null;
      }
    };
    // P8: a single CLICK on a planet flies the camera into it (explore
    // its moons up close) AND opens its details card. Hover still opens
    // the card as a preview — click is the explicit "explore this one".
    // A drag guard (moved > 6px) keeps rotate-drags from firing clicks.
    let downX = 0;
    let downY = 0;
    const down = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const click = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const slug = pick(e.clientX, e.clientY);
      if (!slug) return;
      rigApi.current?.flyToPlanet(slug);
      (triggerHandlers(`planet:${slug}`).onClick as (() => void) | undefined)?.();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", click);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", click);
    };
  }, [camera, gl, ndc, raycaster, triggerHandlers]);

  const orbitColor = dark ? "#ffffff" : "#1c1917";
  const sparkleColor = dark ? "#a5b4fc" : "#4f46e5";
  const sparkleCount = settings.starDensity === "high" ? 70 : settings.starDensity === "low" ? 24 : 45;

  return (
    <>
      <CameraRig
        worldSize={world}
        allowDrag={allowDrag}
        autoRotate={settings.animationEnabled !== false}
        getPlanetPos={getPlanetPos}
        onReady={(api) => {
          rigApi.current = api;
          onRigReady(api);
        }}
        onState={onRigState}
      />

      <SunBody profile={galaxy.profile} />
      <SunGlow dark={dark} intensity={rigState.focused || rigState.distMul < 0.75 ? 0.22 : 1} />
      <AsteroidBelt planets={planets} dark={dark} />

      {/* Comets — fixed elliptical orbits around the sun (real-solar-system
          feel). Wide, Halley-like ellipses that cross the inner lanes. */}
      <CometOrbit3D
        semiMajor={world * 0.38}
        squash={0.5}
        speed={0.05}
        phase={0.6}
        size={30}
        dark={dark}
      />
      <CometOrbit3D
        semiMajor={world * 0.44}
        squash={0.34}
        speed={0.027}
        phase={2.4}
        size={24}
        dark={dark}
      />

      {/* Faint FLOWING orbit rings (P12) — dotted + rotating like the
          2D tier's dashes; toggleable via settings, never dark. */}
      {settings.showOrbitLines &&
        planets.map((p) => (
          <OrbitRingDots
            key={p.slug}
            radius={p.orbitRadius}
            color={orbitColor}
            opacity={dark ? 0.16 : 0.2}
            paused={settings.animationEnabled === false}
          />
        ))}

      {planets.map((p) => (
        <PlanetSprite
          key={p.slug}
          planet={p}
          texture={textures.get(p.slug)!}
          active={activeId === `planet:${p.slug}`}
          register={(slug, sprite) => {
            if (sprite) spritesRef.current.set(slug, sprite);
            else spritesRef.current.delete(slug);
          }}
        />
      ))}

      <MoonLayer galaxy={galaxy} filter={filter} />

      {/* Gentle drifting particles (drei) — density from settings. */}
      <Sparkles
        count={sparkleCount}
        scale={[world * 1.15, world * 0.3, world * 1.15]}
        size={3}
        speed={0.22}
        color={sparkleColor}
        opacity={0.35}
        noise={0.6}
      />
    </>
  );
}
