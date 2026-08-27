/**
 * Certifications.tsx (client) — plan S7 + P13/P14 hierarchy + P25.
 * Spotlight switcher: a chip per certification; click one → its
 * focus card (logo, name, issuer, category, verify link) appears.
 * One at a time — the wall of badges is gone, detail waits behind
 * the click. Verify links are the proof, honest by design (plan
 * §4.3: never scraped logos).
 *
 * P25: the category chip cycles the topic hues per cert, the card
 * footer says "verified · check it yourself" (or honestly notes a
 * pending link), and the issuer logo carries a title tooltip.
 * Auto-hides when empty (plan §5.2).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Award, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import Tooltip from "@/components/ui/Tooltip";
import { useSwipe } from "@/lib/useSwipe";
import type { Certification } from "@/types";

interface CertificationsProps {
  certifications: Certification[];
  /** Phase 16 (#15): category → galaxy planet slug (name/slug matched in
   *  page.tsx). The category badge links to the planet when it matches. */
  galaxyCategorySlugs?: Record<string, string>;
}

/** Phase 16 (#5): "2026-06" → "Jun 2026", "2026" → "2026", else raw. */
function formatDate(date: string): string {
  const m = date.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
  }
  if (/^\d{4}$/.test(date)) return date;
  return date || "—";
}

/** Phase 16 (#6): comparable month value for newest-first sorting
 *  ("2026-06" → 2026.5; unparseable → -Infinity so it sorts last). */
function monthValue(date: string): number {
  const m = date.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return Number(m[1]) + (Number(m[2]) - 1) / 12;
  const y = date.match(/^(\d{4})$/);
  if (y) return Number(y[1]);
  return -Infinity;
}

/** Phase 16 (#1): issuer hostname from a verify URL ("credly.com"). */
function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Topic-hued fallback tiles, rotated per cert. */
const TILES = [
  "bg-topic-cloud/10 text-topic-cloud",
  "bg-topic-devops/10 text-topic-devops",
  "bg-topic-ai/10 text-topic-ai",
  "bg-topic-linux/10 text-topic-linux",
];

/** Active-chip underline hue per index. */
const CHIP_HUES = [
  "after:bg-topic-cloud",
  "after:bg-topic-devops",
  "after:bg-topic-ai",
  "after:bg-topic-linux",
];

/** P25: category chips cycle the topic hues too (was accent always). */
const CATEGORY_HUES = [
  "bg-topic-cloud/10 text-topic-cloud",
  "bg-topic-devops/10 text-topic-devops",
  "bg-topic-ai/10 text-topic-ai",
  "bg-topic-linux/10 text-topic-linux",
];

/** Phase 16 (#19): colored top hairline per cert, cycling the hues. */
const HAIRLINE = [
  "border-t-topic-cloud",
  "border-t-topic-devops",
  "border-t-topic-ai",
  "border-t-topic-linux",
];

/** Progressive disclosure: the chip row shows this many certs until
 *  "Show all" expands the rest — long lists stay scannable. */
const CHIP_LIMIT = 6;

export default function Certifications({
  certifications,
  galaxyCategorySlugs,
}: CertificationsProps) {
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState("all");

  // Category filter (UX pass) — layered: All + one tab per category.
  // Computed BEFORE the early return so the gesture hooks below can key
  // on the real (filtered) length (hooks order must be stable).
  const categories = Array.from(new Set(certifications.map((c) => c.category))).sort();
  // Phase 16 (#6): newest-first by date (copy first — sort mutates).
  const visible = (
    filter === "all"
      ? [...certifications]
      : certifications.filter((c) => c.category === filter)
  ).sort((a, b) => monthValue(b.date) - monthValue(a.date));

  /** Collapsed by default: only the first CHIP_LIMIT chips (+ spotlight)
      render until "Show all" expands — less content per screen. */
  const [expandedAll, setExpandedAll] = useState(false);
  const shownCerts = expandedAll ? visible : visible.slice(0, CHIP_LIMIT);

  // Phase 9 gestures: prev/next via click or touch swipe (parity with skills).
  // Browsing cycles within the SHOWN set so the active chip is always visible.
  const len = Math.max(1, shownCerts.length); // guard: section hides when empty
  const prev = useCallback(
    () => setActive((i) => (i - 1 + len) % len),
    [len]
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % len),
    [len]
  );
  const swipe = useSwipe(next, prev);

  // BUGFIX: the old ←/→ handlers computed the focus target from the
  // render-closure `active`, so RAPID presses (two keydowns before a
  // re-render) both focused the same stale index. activeRef + goTo
  // move state AND focus together, deterministically.
  const activeRef = useRef(0);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const goTo = (i: number) => {
    const target = ((i % len) + len) % len;
    activeRef.current = target;
    setActive(target);
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLButtonElement>("#certifications [role=tab]")
        [target]?.focus();
    });
  };

  if (certifications.length === 0) return null; // auto-hide (§5.2)

  const idx = Math.min(active, shownCerts.length - 1);
  const cert = shownCerts[idx];
  // Phase 16 (#1): issuer domain for the "verified" tooltip.
  const domain = cert?.verifyUrl ? domainOf(cert.verifyUrl) : null;

  return (
    <Section
      id="certifications"
      index="04"
      eyebrow="certifications"
      title="Certifications"
      description="Verified, with links — check them yourself. Pick one below."
      tone="ai"
    >
      {/* Category filter tabs (UX pass) — same interaction language as
          projects & blog; narrows the list before the spotlight switcher. */}
      {categories.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              goTo(0);
            }}
            aria-pressed={filter === "all"}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              filter === "all"
                ? "border-transparent bg-accent-btn text-white shadow-card"
                : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
            }`}
          >
            All
            <span className="ml-1.5 font-mono text-[10px] opacity-70">{certifications.length}</span>
          </button>
          {categories.map((cat) => {
            const count = certifications.filter((c) => c.category === cat).length;
            const selected = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFilter(cat);
                  goTo(0);
                }}
                aria-pressed={selected}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected
                    ? "border-transparent bg-topic-ai text-white shadow-card"
                    : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
                }`}
              >
                {cat}
                <span className="ml-1.5 font-mono text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chip row — one cert focused at a time. */}
      <div role="tablist" aria-label="Certifications" className="flex flex-wrap justify-center gap-2">
        {shownCerts.map((c, i) => {
          const selected = i === idx;
          return (
            <button
              key={`${i}-${c.name}-${c.date}`}
              type="button"
              role="tab"
              id={`cert-tab-${i}`}
              aria-selected={selected}
              aria-controls="cert-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => goTo(i)}
              onKeyDown={(e) => {
                // P27: Home/End jump; ←/→ roving nav — all through goTo
                // so the focused chip always matches the active one.
                if (e.key === "Home") {
                  e.preventDefault();
                  goTo(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  goTo(shownCerts.length - 1);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  goTo(activeRef.current - 1);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  goTo(activeRef.current + 1);
                }
              }}
              className={`relative rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:rounded-full after:transition-opacity after:duration-300 ${
                selected
                  ? `border-transparent bg-card text-ink shadow-card after:opacity-100 ${CHIP_HUES[i % 4]}`
                  : "border-card-border bg-transparent text-ink-faint hover:border-accent/30 hover:text-ink"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Progressive disclosure toggle — reveal/hide the rest of the list */}
      {visible.length > CHIP_LIMIT && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setExpandedAll((v) => !v)}
            aria-expanded={expandedAll}
            className="inline-flex items-center gap-1 rounded-full border border-card-border bg-card px-4 py-2 text-xs font-medium text-ink-soft shadow-card transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {expandedAll ? "Show fewer" : `Show all ${visible.length} certifications`}
          </button>
        </div>
      )}
      <p className="mt-3 text-center font-mono text-xs text-ink-faint">
        {shownCerts.length} of {visible.length} certification{visible.length === 1 ? "" : "s"} in this view
      </p>

      {/* Focus card — only the selected cert's detail is on screen. */}
      <div
        id="cert-panel"
        role="tabpanel"
        aria-labelledby={`cert-tab-${idx}`}
        key={`${idx}-${cert.name}-${cert.date}`}
        className="skill-swap mx-auto mt-6 max-w-2xl"
        aria-live="polite"
        // Phase 9 gestures: swipe left/right cycles certifications
        {...swipe}
      >
        <Card
          hover
          onMouseMove={(e) => {
            const el = e.currentTarget as HTMLElement;
            const r = el.getBoundingClientRect();
            el.style.setProperty("--sx", `${((e.clientX - r.left) / r.width) * 100}%`);
            el.style.setProperty("--sy", `${((e.clientY - r.top) / r.height) * 100}%`);
          }}
          className={`group card-spotlight flex items-center gap-5 p-6 sm:p-8 border-t-2 ${HAIRLINE[idx % HAIRLINE.length]}`}
        >
          {/* P8: issuer logo when the CMS provides one; topic-hued Award
              tile otherwise (images come from the CMS — Cloudinary). */}
          {cert.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cert.logo}
              alt={cert.issuer}
              loading="lazy"
              decoding="async"
              title={cert.issuer}
              // Phase 16 (#16): cert-logo carries the dark-mode rule
              className="cert-logo h-12 w-12 shrink-0 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${TILES[idx % 4]}`}
            >
              <Award className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold text-ink">{cert.name}</h3>
            <p className="mt-0.5 text-sm text-ink-soft">{cert.issuer}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Phase 16 (#15): when the category matches a galaxy planet,
                  the badge deep-links to it (zero-data: plain badge otherwise) */}
              {(() => {
                const planetSlug = galaxyCategorySlugs?.[cert.category.toLowerCase()];
                const badge = (
                  <Badge variant="colored" className={CATEGORY_HUES[idx % 4]}>
                    {cert.category}
                  </Badge>
                );
                return planetSlug ? (
                  <a
                    href={`/detailed-galaxy#planet-${planetSlug}`}
                    title="Explore this category in the learning galaxy"
                    className="transition-opacity hover:opacity-80"
                  >
                    {badge}
                  </a>
                ) : (
                  badge
                );
              })()}
              {/* Phase 16 (#5): "2026-06" reads "Jun 2026" */}
              <span className="inline-block rounded-full border border-card-border bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-faint">
                {formatDate(cert.date)}
              </span>
            </div>
          </div>

          {cert.verifyUrl && (
            /* Phase 16 (#1): the button says WHERE it's verified; #12: a
                shield marks the real-proof affordance */
            <Tooltip
              label={domain ? `Verified on ${domain}` : "Official verification link"}
              side="left"
            >
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Verify ${cert.name}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-card-border bg-paper px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:bg-accent hover:text-white"
              >
                Verify
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Tooltip>
          )}
        </Card>

        {/* Phase 9: prev/next controls + position — click, swipe or
            ←/→ keys all browse the same spotlight. */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous certification"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span aria-live="polite" className="font-mono text-[10px] text-ink-faint">
            {idx + 1} of {visible.length}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label="Next certification"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {/* Touch hint — phones get a quiet nudge that the card swipes */}
        <p className="mt-2 text-center font-mono text-[10px] text-ink-faint md:hidden">
          ‹ swipe to browse ›
        </p>

        {/* P25: honest proof line — only claims "verified" when a link exists */}
        <p className="mt-4 text-center font-mono text-xs text-ink-faint">
          {cert.verifyUrl ? "verified · check it yourself" : "listed · verification link pending"}
        </p>
      </div>

      {/* Phase 16 (#9): print — every cert + its verify URL on paper */}
      <div className="cert-print-list hidden print:block">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider">
          Certifications
        </p>
        <ul>
          {certifications.map((c, i) => (
            <li key={`${i}-${c.name}-${c.date}`}>
              <strong>{c.name}</strong> — {c.issuer}
              {c.date ? ` (${formatDate(c.date)})` : ""}
              {c.verifyUrl ? ` — verify: ${c.verifyUrl}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
