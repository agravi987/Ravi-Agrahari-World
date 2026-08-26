/**
 * SectionsPanel.tsx (client) — dashboard quick-toggles for section
 * visibility. The Site Config form owns the full document; this panel
 * owns ONLY `sectionsEnabled` and saves each flip instantly (PATCH-
 * semantics via the singleton POST upsert — findByIdAndUpdate merges).
 * A flip revalidates the public site server-side, so the change is
 * live the moment the switch settles.
 */
"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { SECTION_HELP, SECTION_KEYS, sectionEnabled, type SectionKey } from "@/lib/sections";

type SaveState = "idle" | "saving" | "error";

export default function SectionsPanel() {
  const [sections, setSections] = useState<Record<SectionKey, boolean> | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [dbOff, setDbOff] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/siteConfig", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!alive) return;
        if (!json?.data) {
          setDbOff(true); // unseeded / Mongo off — nothing to toggle
          return;
        }
        const saved = json.data.sectionsEnabled ?? {};
        setSections(
          Object.fromEntries(SECTION_KEYS.map((k) => [k, sectionEnabled(saved, k)])) as Record<
            SectionKey,
            boolean
          >
        );
      } catch {
        if (alive) setDbOff(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function toggle(key: SectionKey, next: boolean) {
    if (!sections) return;
    const prev = sections;
    // Optimistic flip — the switch must feel instant.
    setSections({ ...prev, [key]: next });
    setState("saving");
    try {
      const res = await fetch("/api/admin/siteConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            sectionsEnabled: { ...prev, [key]: next },
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("idle");
      showToast(next ? `${key} section is live` : `${key} section hidden`);
    } catch {
      setSections(prev); // revert the flip
      setState("error");
      showToast("Could not save — check the connection and retry");
    }
  }

  return (
    <section
      aria-label="Section visibility"
      className="rounded-2xl border border-card-border bg-card p-6 shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Sections</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Show or hide home-page sections — hidden ones leave the page{" "}
            <em>and</em> navigation. Changes go live instantly.
          </p>
        </div>
        {/* Save indicator — quiet while idle, honest while working */}
        <span
          role="status"
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
            state === "error"
              ? "bg-red-500/10 text-red-600"
              : state === "saving"
                ? "bg-accent-soft text-accent"
                : "bg-paper-deep text-ink-faint"
          }`}
        >
          {state === "error" ? "save failed" : state === "saving" ? "saving…" : "auto-saves"}
        </span>
      </div>

      {dbOff ? (
        <p className="mt-4 rounded-xl border border-card-border bg-paper px-4 py-3 text-sm text-ink-faint">
          Section toggles need the database (run <code className="font-mono text-xs">npm run seed</code>
          ) — the site is on seed fallback right now.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SECTION_KEYS.map((key) => {
            const enabled = sections?.[key] ?? true;
            return (
              <li key={key}>
                <label
                  className={`flex h-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    enabled
                      ? "border-accent/30 bg-accent-soft/40"
                      : "border-card-border bg-paper hover:bg-paper-deep/40"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium capitalize text-ink">{key}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {SECTION_HELP[key]}
                    </span>
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={!sections || state === "saving"}
                      onChange={(e) => toggle(key, e.target.checked)}
                      className="peer sr-only"
                      aria-label={`Show ${key} section`}
                    />
                    <span
                      aria-hidden="true"
                      className="h-6 w-11 rounded-full bg-card-border transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                    />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-ink-soft transition-colors hover:text-accent"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Preview the live site
        </a>
        after toggling
      </p>
    </section>
  );
}
