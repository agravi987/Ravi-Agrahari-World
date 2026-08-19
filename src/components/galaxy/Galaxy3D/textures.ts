/**
 * textures.ts — CanvasTexture builders for the T2 WebGL scene (v4 §6.2).
 * Planet discs are flat, theme-colored, with a soft sphere shading and
 * the planet's icon drawn on the face (premium look, not cartoonish).
 * The glow is a radial gradient sprite — NO postprocessing/bloom, per
 * plan §5 (cheap additive-style glow without screen-space effects).
 */
import * as THREE from "three";

const EMOJI_FONT =
  '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

export function planetTexture(color: string, icon: string, size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  // base disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // soft sphere shading: light top-left → shadowed rim bottom-right
  const g = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.05, cx, cy, r);
  g.addColorStop(0, "rgba(255,255,255,0.5)");
  g.addColorStop(0.5, "rgba(255,255,255,0.06)");
  g.addColorStop(0.82, "rgba(0,0,0,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // icon (emoji) centered on the face
  if (icon) {
    ctx.font = `${Math.round(size * 0.44)}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, cx, cy + size * 0.02);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** White sphere-shaded marble texture for the 3D moons. Pure white base so
 *  the InstancedMesh per-instance color tints it into a shaded colored sphere
 *  (map × instance color), with the baked highlight/shadow giving the round
 *  relief. Transparent outside the circle so it renders as a clean ball. */
export function moonTexture(size = 64): THREE.CanvasTexture {  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const g = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.05, cx, cy, r);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.28)");
  g.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial glow — tinted white texture; the material colors it. */
export function glowTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.22, "rgba(255,255,255,0.4)");
  g.addColorStop(0.55, "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** The sun's face as a texture for the 3D sun body (a billboarded sprite
 *  at the world origin — the sun is PART of the solar system, so it moves
 *  with the camera like every other body). The profile photo fills the
 *  disc (crisp, no sphere distortion); initials render when there's no
 *  photo or it fails to load. Baked rim shading + a light ring give it a
 *  solar-body glow against both themes. */
export function sunTexture(img: HTMLImageElement | null, name: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const r = size / 2 - 4;

  // base disc
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fillStyle = "#4f46e5";
  ctx.fill();

  if (img && img.width > 0) {
    // photo — cover-cropped inside the disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cx, r - 6, 0, Math.PI * 2);
    ctx.clip();
    const s = Math.max(img.width, img.height);
    const w = (img.width / s) * (r - 6) * 2;
    const h = (img.height / s) * (r - 6) * 2;
    ctx.drawImage(img, cx - w / 2, cx - h / 2, w, h);
    ctx.restore();
  } else {
    // initials fallback (or a spark when the name is empty)
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${Math.round(r * 0.46)}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials || "✦", cx, cx + r * 0.04);
  }

  // rim shading (light top-left → shadowed bottom-right) — reads as round
  const g = ctx.createRadialGradient(cx - r * 0.38, cx - r * 0.42, r * 0.05, cx, cx, r);
  g.addColorStop(0, "rgba(255,255,255,0.35)");
  g.addColorStop(0.6, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // light halo ring so the sun reads against the starfield
  ctx.beginPath();
  ctx.arc(cx, cx, r + 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
