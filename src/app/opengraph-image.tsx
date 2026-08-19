/**
 * opengraph-image.tsx — plan S9 SEO
 * Auto-generated OG image (1200×630) via next/og: warm paper,
 * indigo accent, a little orbital ring — no image files needed.
 */
import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Alt is a static export — kept generic so the name lives only in
// the content layer (P24 zero-hardcoding; the rendered name below
// reads config.name).
export const alt = "Cloud, DevOps & AI portfolio — learning in public";

export default async function OpengraphImage() {
  const { config } = await getContent();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f6",
          color: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        {/* Orbital ring accent */}
        <div
          style={{
            display: "flex",
            width: 260,
            height: 260,
            border: "2px solid rgba(79,70,229,0.35)",
            borderRadius: "50%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              background: "#06b6d4",
              borderRadius: "50%",
              marginTop: -120,
            }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: "-0.02em", marginTop: -220 }}>
          {config.name}
          <span style={{ color: "#4f46e5" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#57534e", marginTop: 16 }}>
          {config.headline}
        </div>
      </div>
    ),
    size
  );
}
