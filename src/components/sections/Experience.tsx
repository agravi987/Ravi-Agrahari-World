/**
 * Experience.tsx (client) — plan S7 + P13 progressive disclosure + P25.
 * Timeline where each role is a ROW (company · role · period); click
 * to expand the description + metrics in place. One role open at a
 * time (accordion), all collapsed by default. The timeline stays a clean
 * scan line — detail waits behind the click.
 *
 * P25: metrics get emerald check icons (done-things, not bullets),
 * the OPEN row raises with a card shadow, the period sits in a mono
 * chip on the right, and the row carries an "expand" tooltip.
 * Auto-hides when empty — freshers typically ship this empty
 * until internships land (plan §5.2 / §5.4).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Link2 } from "lucide-react";
import Section from "@/components/ui/Section";
import { showToast } from "@/components/ui/Toast";
import { initials } from "@/lib/galaxyGeometry";
import type { Experience as ExperienceItem } from "@/types";

/** P18: timeline dots cycle the topic hues per role — colorful scan line. */
const DOT_HUES = [
  "border-topic-cloud",
  "border-topic-devops",
  "border-topic-ai",
  "border-topic-linux",
  "border-topic-mars",
  "border-topic-ice",
];

/** Company monogram avatar — a topic-hued tile with the company's initials,
 *  so the timeline scans without reading every company name. */
const AVATAR_STYLES = [
  "bg-topic-cloud/10 text-topic-cloud-deep",
  "bg-topic-devops/10 text-topic-devops-deep",
  "bg-topic-ai/10 text-topic-ai-deep",
  "bg-topic-linux/10 text-topic-linux-deep",
  "bg-topic-mars/10 text-topic-mars-deep",
  "bg-topic-ice/10 text-topic-ice-deep",
];

/** Open row: a topic-hued 3px left accent so the active role reads at a glance. */
const LEFT_ACCENTS = [
  "border-l-topic-cloud",
  "border-l-topic-devops",
  "border-l-topic-ai",
  "border-l-topic-linux",
  "border-l-topic-mars",
  "border-l-topic-ice",
];

/** Open dot: ring glow matches the role's hue (was hardcoded devops). */
const DOT_SHADOWS = [
  "shadow-topic-cloud/20",
  "shadow-topic-devops/20",
  "shadow-topic-ai/20",
  "shadow-topic-linux/20",
  "shadow-topic-mars/20",
  "shadow-topic-ice/20",
];

/** Phase 16 (#21): on row hover the timeline dot takes the row's hue. */
const DOT_HOVER = [
  "group-hover:border-topic-cloud",
  "group-hover:border-topic-devops",
  "group-hover:border-topic-ai",
  "group-hover:border-topic-linux",
  "group-hover:border-topic-mars",
  "group-hover:border-topic-ice",
];

/** Phase 16 (#13): "2025-06 → 2025-08" → "3 mo" (null when unparseable). */
function durationOf(period: string): string | null {
  const m = period.match(/(\d{4})-(\d{1,2})/g);
  if (!m || m.length < 2) return null;
  const [ys, ms] = m[0].split("-").map(Number);
  const [ye, me] = m[1].split("-").map(Number);
  const months = (ye - ys) * 12 + (me - ms);
  if (!Number.isFinite(months) || months < 1) return null;
  return months < 12 ? `${months} mo` : `${(months / 12).toFixed(1)}y`;
}

/** Phase 16 (#10): the first 4-digit year in a period string, if any. */
function periodYear(period: string): string | null {
  const m = period.match(/(\d{4})/);
  return m ? m[1] : null;
}

/** Phase 16 (#15): an interview-ready summary paragraph for the row. */
function summaryOf(item: ExperienceItem): string {
  const head = `${item.role} at ${item.company}${item.period ? ` (${item.period})` : ""}`;
  const metrics = item.metrics.length > 0 ? ` — ${item.metrics.join("; ")}` : "";
  return `${head}.${item.description ? ` ${item.description}` : ""}${metrics}`;
}

interface ExperienceProps {
  experience: ExperienceItem[];
}

export default function Experience({ experience }: ExperienceProps) {
  // Collapsed by default — the visitor scans the timeline rows first;
  // detail is one click away on every role (progressive disclosure).
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const trackRef = useRef<HTMLOListElement>(null);

  // Growing timeline (UX pass): --track-progress scales the gradient line
  // from 0→1 as the timeline scrolls into the viewport. rAF-throttled.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const visible = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      el.style.setProperty("--track-progress", `${1 - visible}`);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          update();
          window.addEventListener("scroll", update, { passive: true });
          io.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  if (experience.length === 0) return null; // auto-hide (§5.2)

  // Phase 16 (#10): year rail — first entry id per year (zero-data: only
  // when a period actually carries a year).
  const yearToId: Record<string, string> = {};
  for (const e of experience) {
    const y = periodYear(e.period);
    if (y && !yearToId[y]) {
      yearToId[y] = `experience-${e.slug ?? String(experience.indexOf(e))}`;
    }
  }
  const years = Object.keys(yearToId);

  async function copySummary(item: ExperienceItem) {
    try {
      await navigator.clipboard.writeText(summaryOf(item));
      showToast("Role summary copied");
    } catch {
      /* clipboard blocked — nothing to do */
    }
  }

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#experience-${slug}`);
      showToast("Link copied — points to this role");
    } catch {
      /* clipboard blocked — nothing to do */
    }
  }

  return (
    <Section
      id="experience"
      index="03"
      eyebrow="experience"
      title="Experience & internships"
      description="Early-career, but every role taught me something real — click a role to read it."
      tone="devops"
      band
    >
      {/* Phase 16 (#25): honest count — how many roles are on the map */}
      <p className="mb-4 text-center font-mono text-xs text-ink-faint">
        {experience.length} role{experience.length === 1 ? "" : "s"} on the timeline
      </p>

      <div className="relative xl:grid xl:grid-cols-[minmax(0,1fr)_130px] xl:gap-8">
      <ol
        ref={trackRef}
        className="timeline-track relative space-y-4 pl-6 [border-left:2px_solid_transparent]"
      >
        {experience.map((item, i) => {
          const open = openIdx === i;
          // Active role (UX pass) — ongoing roles get a live pulse dot.
          const isActive = /present|current|now|ongoing/i.test(item.period);
          const dur = durationOf(item.period); // Phase 16 (#13)
          return (
            <li
              // index-prefixed: the Duplicate button can produce two
              // same company+role rows, which collided as React keys
              key={`${i}-${item.company}-${item.role}`}
              id={item.slug ? `experience-${item.slug}` : undefined}
              className="group relative scroll-mt-28"
            >
              {/* Timeline dot — topic hue cycles per role (P18) */}
              <span
                aria-hidden="true"
                className={`absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 bg-paper transition-colors ${
                  open
                    ? `${DOT_HUES[i % DOT_HUES.length]} shadow-[0_0_0_3px] ${DOT_SHADOWS[i % DOT_SHADOWS.length]}`
                    : `border-card-border ${DOT_HOVER[i % DOT_HOVER.length]}`
                }`}
              />
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                aria-controls={`experience-detail-${i}`}
                title="Click to expand"
                className={`block w-full cursor-pointer rounded-card p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  // P25: the open row raises — a card with a topic-hued
                  // left accent marking the active role
                  open
                    ? `border border-card-border border-l-[3px] bg-card shadow-card ${LEFT_ACCENTS[i % LEFT_ACCENTS.length]}`
                    : "border border-transparent hover:bg-card/60"
                }`}
              >
                <span className="flex items-start gap-3">
                  {/* Company avatar — CMS logo when present, monogram
                      otherwise (Phase 16 #2/#17). */}
                  {item.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.companyLogo}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      title={item.company}
                      className="experience-logo h-10 w-10 shrink-0 rounded-xl border border-card-border bg-card object-contain p-1"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                        AVATAR_STYLES[i % AVATAR_STYLES.length]
                      }`}
                    >
                      {initials(item.company) || "✦"}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <span className="min-w-0">
                      {/* P26: mono index + role + company */}
                      <span className="flex items-baseline gap-2">
                        <span aria-hidden="true" className="font-mono text-xs text-ink-faint">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-lg font-semibold text-ink">{item.role}</h3>
                      </span>
                      <p className="mt-0.5 text-sm font-medium text-accent">{item.company}</p>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {/* Active pulse + achievements count (UX pass) */}
                      {isActive && (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 sm:px-2.5 sm:py-1"
                        >
                          <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                          active
                        </span>
                      )}
                      {item.metrics.length > 0 && (
                        <span
                          title={`${item.metrics.length} achievements at ${item.company}`}
                          className="hidden rounded-full border border-card-border bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-faint sm:inline-block sm:px-2.5 sm:py-1"
                        >
                          {item.metrics.length} ✦
                        </span>
                      )}
                      {/* Phase 16 (#13): auto-computed duration, when the
                          period is parseable ("3 mo") */}
                      {dur && (
                        <span
                          title={`Computed from the period — ${item.period}`}
                          className="inline-block rounded-full border border-card-border bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-faint sm:px-2.5 sm:py-1"
                        >
                          {dur}
                        </span>
                      )}
                      {/* P25 chip, P26: now on mobile too (smaller) */}
                      <span className="inline-block rounded-full border border-card-border bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-faint sm:px-2.5 sm:py-1">
                        {item.period}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`mt-1 h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </span>
                </span>
              </button>

              {open && (
                <div id={`experience-detail-${i}`} className="project-body px-4 pb-4">
                  <p className="text-sm leading-relaxed text-ink-soft">{item.description}</p>
                  {item.metrics.length > 0 && (
                    /* Phase 16 (#4): metrics stagger in when the row opens */
                    <ul className="metric-stagger mt-3 space-y-1.5">
                      {item.metrics.map((m, mi) => (
                        <li
                          key={m}
                          className="flex items-start gap-2 text-sm text-ink-soft"
                          style={{ animationDelay: `${mi * 70}ms` }}
                        >
                          {/* P25: done-things get emerald checks, not bullets */}
                          <span
                            aria-hidden="true"
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Phase 16 (#19): tools used — chips, only when present */}
                  {item.tools && item.tools.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tools.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-card-border bg-paper px-2.5 py-0.5 font-mono text-[10px] text-ink-soft"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Phase 16 (#15/#20): copy the summary / deep-link */}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => void copySummary(item)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
                    >
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      copy summary
                    </button>
                    {item.slug && (
                      <button
                        type="button"
                        onClick={() => void copyLink(item.slug!)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
                      >
                        <Link2 className="h-3 w-3" aria-hidden="true" />
                        copy link
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Phase 16 (#10): year anchor rail — sticky on xl screens, jumps
          to the first role of that year. Zero-data: hidden when no
          period carries a parseable year. */}
      {years.length > 0 && (
        <aside aria-label="Years" className="hidden xl:block">
          <div className="sticky top-28 rounded-card border border-card-border bg-card/60 p-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              years
            </p>
            <ul className="mt-2 space-y-1">
              {years.map((y) => (
                <li key={y}>
                  <a
                    href={`#${yearToId[y]}`}
                    className="inline-flex font-mono text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {y}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
      </div>

      {/* Phase 16 (#9): print-friendly full text — every role expands on
          paper (the accordion can't). */}
      <div className="experience-print-list hidden print:block">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider">
          Experience
        </p>
        <ul>
          {experience.map((e, i) => (
            <li key={`${i}-${e.company}-${e.role}`}>
              <strong>{e.role}</strong> — {e.company}
              {e.period ? ` (${e.period})` : ""}
              {e.description ? ` — ${e.description}` : ""}
              {e.metrics.length > 0 ? ` [${e.metrics.join("; ")}]` : ""}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
