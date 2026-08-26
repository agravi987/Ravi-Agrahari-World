/**
 * projects/[slug]/opengraph-image.tsx — per-project OG card (1200×630).
 * Next's file-convention picks this up for every /projects/<slug> URL,
 * so LinkedIn/X/WhatsApp shares show the project's own branded card.
 * Note: when a project has a coverImage, generateMetadata overrides
 * this with the real screenshot — this card is the no-cover default.
 * Same warm-paper visual language as the root + blog OG images.
 */
import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = "Project case study";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { projects, config } = await getContent();
  const project = projects.find((p) => p.slug === slug);

  const title = project?.title ?? "Project";
  const tech = project?.tech.slice(0, 4) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#faf9f6",
          color: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header: author + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#06b6d4",
            }}
          />
          <div style={{ display: "flex", fontSize: 28, color: "#57534e" }}>
            {config.name} · project
          </div>
        </div>

        {/* Title (wraps naturally; oversized titles clip gracefully) */}
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxHeight: 320,
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        {/* Footer: tech chips */}
        <div style={{ display: "flex", gap: 12 }}>
          {tech.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: 24,
                color: "#4f46e5",
                border: "2px solid rgba(79,70,229,0.35)",
                borderRadius: 999,
                padding: "6px 20px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
