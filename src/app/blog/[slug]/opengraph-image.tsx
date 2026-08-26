/**
 * blog/[slug]/opengraph-image.tsx — per-post OG card (1200×630).
 * Next's file-convention picks this up for every /blog/<slug> URL, so
 * X/Slack/etc. show the actual post title instead of the generic site
 * card. Same warm-paper visual language as the root OG image.
 */
import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = "Note — learning in public";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { posts, config } = await getContent();
  const post = posts.find((p) => p.slug === slug);

  const title = post?.title ?? "Notes & learnings";
  const tags = post?.tags.slice(0, 4) ?? [];

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
        {/* Header: author + blog eyebrow */}
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
            {config.name} · notes
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

        {/* Footer: tag chips */}
        <div style={{ display: "flex", gap: 12 }}>
          {tags.map((t) => (
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
              #{t}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
