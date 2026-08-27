/**
 * admin/[collection]/page.tsx — plan D10 / ui-ux-design.md P0 + galaxy v4 §13
 * List view for a collection (table + edit/delete/duplicate/reorder).
 * The singleton siteConfig collection renders its edit form directly.
 * All writes go through /api/admin/* and revalidate the live site.
 *
 * Galaxy v4 additions (P4): collections with an `orderKey` get up/down
 * reorder arrows (swaps the numeric field between neighbors via PUT),
 * galaxyPlanet delete warns that its moons cascade, every list row can
 * be duplicated, the moon list shows the parent planet NAME instead of
 * the raw _id, and galaxy collections get a "view on site" link.
 */
"use client";

import { ChevronDown, ChevronUp, Copy, ExternalLink, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollectionForm from "@/components/admin/CollectionForm";
import { getCollection, publicUrlFor } from "@/lib/collections";

type Doc = Record<string, unknown> & { _id?: string };

/** Renders a cell value for the list table (arrays → count, booleans → yes/no).
 *  ISO timestamps render as short human dates — `publishedAt` used to
 *  show the raw "2026-08-01T00:00:00.000Z" string in the table. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return String(value);
}

/* --- Phase 11: list polish -------------------------------------------
   · Boolean cells render as colored chips, not "yes"/"no" text.
   · Rows with a public URL get a "View" link that opens exactly what
     the visitor sees — the CMS → site loop, one click away. */

/** Boolean keys → pill styling for true/false (topic-hued, muted off). */
const BOOL_CHIPS: Record<string, { on: string; off: string }> = {
  isVisible: {
    on: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    off: "border-card-border bg-paper-deep text-ink-faint",
  },
  isFeatured: {
    on: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    off: "border-card-border bg-paper-deep text-ink-faint",
  },
  featured: {
    on: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    off: "border-card-border bg-paper-deep text-ink-faint",
  },
  read: {
    // unread (off) is amber so it catches the eye; read is quiet green.
    on: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    off: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

/** Chip label for a boolean cell (overrides the generic yes/no). */
const BOOL_LABELS: Record<string, [string, string]> = {
  isVisible: ["visible", "hidden"],
  isFeatured: ["featured", "regular"],
  featured: ["featured", "regular"],
  read: ["read", "unread"],
};

export default function CollectionListPage() {
  const params = useParams<{ collection: string }>();
  const router = useRouter();
  const collection = params.collection;
  const spec = getCollection(collection);

  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [singleDoc, setSingleDoc] = useState<Doc | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** P20: client-side list filter — type to find a row in big collections.
   *  The input updates `query` instantly (controlled), but filtering runs
   *  against the debounced value so long lists don't re-filter per key. */
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);
  /** galaxyPlanet name map — lets the moon list show "AWS" not the raw _id. */
  const [planetNames, setPlanetNames] = useState<Record<string, string>>({});
  /** Phase 12: ids checked for bulk actions (toggle visibility / delete). */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Re-entrancy guard for Duplicate — double-clicks used to POST twice
   *  and create two copies (the button has no built-in pending state). */
  const duplicating = useRef(false);
  /** #6: Track IDs currently being deleted to prevent double-clicks. */
  const deleting = useRef<Set<string>>(new Set());
  /** #20: Auto-dismiss error banners after 8 seconds. */
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // #20: Auto-dismiss error after 8 seconds.
  useEffect(() => {
    if (!error) return;
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 8000);
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, [error]);

  /** Reload the current collection from the API (used after bulk ops).
   *  Failures are surfaced — a silent no-op left stale rows on screen
   *  with no hint that e.g. a bulk delete half-failed. */
  async function reload() {
    const res = await fetch(`/api/admin/${collection}`);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error || "Failed to refresh the list — refresh the page.");
      return;
    }
    setError(null);
    if (spec?.singleDoc) setSingleDoc((json?.data as Doc) ?? null);
    else setDocs((json?.data as Doc[]) ?? []);
    setLoaded(true);
  }

  /** The boolean field bulk "show/hide" toggles (isVisible → featured → first). */
  const boolField =
    spec?.fields.find((f) => f.type === "boolean" && (f.key === "isVisible" || f.key === "featured")) ??
    spec?.fields.find((f) => f.type === "boolean");
  const boolKey = boolField?.key;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set((filtered ?? []).map((d) => String(d._id))));
    }
  }

  /** Run a request per id in bounded batches — selecting 100+ rows used
   *  to fire every PUT/DELETE simultaneously and hammer the API. */
  async function batchedRequests(ids: string[], make: (id: string) => Promise<Response>): Promise<Response[]> {
    const results: Response[] = [];
    const BATCH = 8;
    for (let i = 0; i < ids.length; i += BATCH) {
      results.push(...(await Promise.all(ids.slice(i, i + BATCH).map(make))));
    }
    return results;
  }

  /** Bulk visibility flip — PUTs the boolean field on every checked row. */
  async function bulkSetVisibility(show: boolean) {
    if (!boolKey || selected.size === 0) return;
    setError(null);
    const ids = [...selected];
    const results = await batchedRequests(ids, (id) =>
      fetch(`/api/admin/${collection}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { [boolKey]: show } }),
      })
    );
    if (results.some((r) => !r.ok)) {
      setError("Some updates failed — refresh to see the current state.");
    }
    setSelected(new Set());
    reload();
  }

  /** Bulk delete — one confirm for the whole checked set. */
  async function bulkDelete() {
    if (selected.size === 0) return;
    const warning =
      spec?.deleteWarning ?? "Delete these items? This cannot be undone.";
    if (!window.confirm(`${warning} Delete ${selected.size} item(s) anyway?`)) return;
    setError(null);
    const ids = [...selected];
    const results = await batchedRequests(ids, (id) =>
      fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" })
    );
    if (results.some((r) => !r.ok)) {
      setError("Some deletes failed — refresh to see what remains.");
    }
    setSelected(new Set());
    reload();
  }

  useEffect(() => {
    // Unknown collection: skip the fetch entirely (the "Unknown
    // collection" screen below handles it; fetching would 400 anyway).
    if (!spec) return;
    let cancelled = false;
    fetch(`/api/admin/${collection}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        if (spec?.singleDoc) setSingleDoc((json.data as Doc) ?? null);
        else setDocs((json.data as Doc[]) ?? []);
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // spec comes from a module-level map — stable identity per collection,
    // so this doesn't re-subscribe on unrelated renders.
  }, [collection, spec, spec?.singleDoc]);

  // Moon list: load planet names for the parent-planet column.
  useEffect(() => {
    if (collection !== "galaxyMoon") return;
    let cancelled = false;
    fetch("/api/admin/galaxyPlanet")
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;
        const list = json?.data;
        if (Array.isArray(list)) {
          const map: Record<string, string> = {};
          for (const p of list as Doc[]) map[String(p._id)] = String(p.name ?? p._id);
          setPlanetNames(map);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [collection]);

  // Order by the spec's orderKey when present (reorder-friendly list).
  const orderKey = spec?.orderKey;
  const sorted = orderKey
    ? (docs ?? []).map((d) => ({ ...d })).sort(
        (a, b) => (Number(a[orderKey]) || 0) - (Number(b[orderKey]) || 0)
      )
    : docs;

  // P20: filter rows by their VISIBLE columns only. The old fallback
  // also matched d.name/d.title even when those weren't listed columns,
  // so searching could surface rows whose hidden fields (message body,
  // markdown content…) happened to contain the query.
  const q = debouncedQuery.trim().toLowerCase();
  const columns = spec?.listColumns ?? [];
  const filtered = q
    ? (sorted ?? []).filter((d) =>
        columns.some((col) =>
          String(d[col] ?? "").toLowerCase().includes(q)
        )
      )
    : sorted;

  // Header checkbox state — must live after `filtered` is computed.
  const allSelected =
    (filtered?.length ?? 0) > 0 &&
    (filtered ?? []).every((d) => selected.has(String(d._id)));

  if (!spec) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs text-accent">~/admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Unknown collection</h1>
        <p className="mt-2 text-sm text-ink-soft">
          <Link href="/admin" className="text-accent hover:underline">← Back to Mission Control</Link>
        </p>
      </div>
    );
  }

  // Singleton (siteConfig): the page IS the edit form.
  if (spec.singleDoc) {
    async function createDefault() {
      setError(null);
      try {
        // #27: Send empty data — the API applies seed defaults server-side.
        const res = await fetch(`/api/admin/${collection}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: {} }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Create failed");
        setSingleDoc((json.data as Doc) ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    }

    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Path doubles as the back-link — no dead-end pages. */}
        <Link href="/admin" className="font-mono text-xs text-accent hover:underline">
          ~/admin/{collection}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{spec.label}</h1>
        <p className="mt-1 text-sm text-ink-soft">{spec.description}</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {!loaded && !error && (
          <p className="mt-6 text-sm text-ink-faint">Loading…</p>
        )}
        {loaded && !error && singleDoc === null && (
          <div className="mt-8 rounded-card border border-dashed border-card-border bg-card/50 p-10 text-center">
            <p className="text-sm text-ink-soft">
              No {spec.label.toLowerCase()} found in the database.
            </p>
            <button
              type="button"
              onClick={createDefault}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover"
            >
              Create {spec.label}
            </button>
          </div>
        )}
        {loaded && singleDoc !== null && (
          <div className="mt-8 rounded-card border border-card-border bg-card p-6 shadow-card">
            <CollectionForm
              key="siteConfig-singleton"
              spec={spec}
              collection={collection}
              initialData={singleDoc}
              isNew
            />
          </div>
        )}
      </div>
    );
  }

  async function remove(id: string) {
    if (deleting.current.has(id)) return; // #6: prevent double-click
    const warning = spec?.deleteWarning ?? "Delete this item? This cannot be undone.";
    if (!window.confirm(`${warning} Delete anyway?`)) return;
    deleting.current.add(id);
    try {
      const res = await fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Delete failed");
        return;
      }
      setDocs((prev) => (prev ?? []).filter((d) => String(d._id) !== id));
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      deleting.current.delete(id);
    }
  }

  async function duplicate(doc: Doc) {
    if (!spec || duplicating.current) return; // ignore double-clicks
    duplicating.current = true;
    try {
    const id = String(doc._id ?? "");
    if (!id) return;
    const clone: Record<string, unknown> = { ...doc };
    delete clone._id;
    delete clone.createdAt;
    delete clone.updatedAt;
    // Make the copy distinguishable + keep slugs unique (galaxy v4).
    // Duplicating a copy used to stack suffixes ("post-copy-copy");
    // now it counts: -copy, -copy-2, -copy-3…
    if (typeof clone.slug === "string") {
      const taken = new Set((docs ?? []).map((d) => String(d.slug ?? "")));
      let n = 1;
      let candidate = `${clone.slug}-copy`;
      while (taken.has(candidate)) candidate = `${clone.slug}-copy-${++n}`;
      clone.slug = candidate;
    }
    if (typeof clone.name === "string") clone.name = `${clone.name} (copy)`;
    else if (typeof clone.title === "string") clone.title = `${clone.title} (copy)`;

    // Galaxy copies can't sit on top of their original — the zero-overlap
    // guard rejects identical geometry. Park the copy somewhere valid:
    //  · planets → a fresh outer lane (+220px past the current max radius)
    //  · moons   → angular offsets around the same planet (30° steps)
    let candidates: Record<string, unknown>[] = [clone];
    if (collection === "galaxyPlanet" || collection === "galaxyMoon") {
      const maxOrder = Math.max(0, ...(docs ?? []).map((d) => Number(d.displayOrder) || 0));
      if (collection === "galaxyPlanet") {
        const maxR = Math.max(0, ...(docs ?? []).map((d) => Number(d.orbitRadius) || 0));
        candidates = [0, 15, 30, 45].map((off) => ({
          ...clone,
          displayOrder: maxOrder + 1,
          orbitRadius: maxR + 220, // fresh outer lane — clear of every other planet
          orbitAngle: ((Number(doc.orbitAngle) || 0) + off) % 360,
        }));
      } else {
        // #24: Reduced from 24 to 8 candidates — each API call runs
        // the full galaxy layout validation, so fewer = faster.
        candidates = Array.from({ length: 8 }, (_, i) => ({
          ...clone,
          displayOrder: maxOrder + 1,
          orbitAngle: ((Number(doc.orbitAngle) || 0) + i * 45) % 360,
        }));
      }
    }

    let lastErr = "Duplicate failed";
    for (const body of candidates) {
      const res = await fetch(`/api/admin/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: body }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        // #26: Reload the list via fetch (not router.refresh) to avoid
        // a flash of stale state between the refresh and setDocs.
        fetch(`/api/admin/${collection}`)
          .then(async (r) => {
            const j = await r.json().catch(() => null);
            if (r.ok && Array.isArray(j?.data)) setDocs(j.data);
          })
          .catch(() => undefined);
        return;
      }
      lastErr = json?.error || lastErr;
    }
    setError(lastErr);
    } finally {
      duplicating.current = false;
    }
  }

  /** Swap this doc's order value with its neighbor and persist both. */
  async function move(id: string, dir: -1 | 1) {
    if (!spec?.orderKey) return;
    const list = sorted ?? [];
    const idx = list.findIndex((d) => String(d._id) === id);
    const other = list[idx + dir];
    if (idx < 0 || !other) return;
    const key = spec.orderKey!;
    const a = Number(list[idx][key]) || 0;
    const b = Number(other[key]) || 0;
    // #7: Snapshot original docs before optimistic swap — restored on failure.
    const originalDocs = docs?.map((d) => ({ ...d })) ?? null;
    // Optimistic local swap first.
    setDocs((prev) => {
      if (!prev) return prev;
      const next = prev.map((d) => ({ ...d }));
      const ai = next.findIndex((d) => String(d._id) === id);
      const bi = next.findIndex((d) => String(d._id) === String(other._id));
      if (ai < 0 || bi < 0) return prev;
      next[ai] = { ...next[ai], [key]: b };
      next[bi] = { ...next[bi], [key]: a };
      return next;
    });
    const put = (docId: string, order: number) =>
      fetch(`/api/admin/${collection}/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { [key]: order } }),
      });
    const results = await Promise.all([put(id, b), put(String(other._id), a)]);
    if (results.some((r) => !r.ok)) {
      // #7: Roll back to the original state immediately.
      setDocs(originalDocs);
      setError("Reorder failed — order restored.");
    }
  }

  const isGalaxy = collection.startsWith("galaxy");
  // Phase 11: preview thumbnails + boolean chips for the table.
  const previewKey = spec?.previewKey;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* Path doubles as the back-link — no dead-end pages. */}
          <Link href="/admin" className="font-mono text-xs text-accent hover:underline">
            ~/admin/{collection}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{spec.label}s</h1>
          <p className="mt-1 text-sm text-ink-soft">{spec.description}</p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
          {/* P20: find a row without scrolling a long table */}
          {sorted !== null && sorted.length > 3 && (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Filter ${spec.label.toLowerCase()}s`}
                placeholder={`Filter ${spec.label.toLowerCase()}s…`}
                className="w-44 rounded-full border border-card-border bg-card py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none sm:w-52"
              />
            </div>
          )}
          {isGalaxy && (
            <a
              href="/detailed-galaxy"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-card-border bg-card px-5 py-2.5 text-sm text-ink-soft transition-colors hover:text-accent"
            >
              View the galaxy ↗
            </a>
          )}
          <a
            href={`/admin/${collection}/new`}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New {spec.label}
          </a>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {sorted === null && <p className="mt-8 text-sm text-ink-faint">Loading…</p>}

      {sorted !== null && sorted.length === 0 && (
        <div className="mt-8 rounded-card border border-dashed border-card-border bg-card/50 p-10 text-center">
          <p className="text-sm text-ink-soft">No {spec.label.toLowerCase()}s yet.</p>
          <a href={`/admin/${collection}/new`} className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
            Create the first one →
          </a>
        </div>
      )}

      {q && filtered !== null && filtered.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-card-border bg-card/50 px-6 py-8 text-center text-sm text-ink-faint">
          No {spec.label.toLowerCase()}s match “{query}”.
        </p>
      )}

      {filtered !== null && filtered.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-card border border-card-border bg-card shadow-card">
          {/* Phase 12: bulk action bar — appears when rows are checked */}
          {selected.size > 0 && (
            <div
              className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-accent/20 bg-accent-soft/50 px-4 py-2.5 backdrop-blur"
              role="toolbar"
              aria-label={`Bulk actions — ${selected.size} selected`}
            >
              <span className="font-mono text-xs font-medium text-accent">
                {selected.size} selected
              </span>
              {boolKey && (
                <>
                  {/* Phase 13: for the message inbox the toggle is
                      "mark read / mark unread" — same PUT, honest label. */}
                  <button
                    type="button"
                    onClick={() => bulkSetVisibility(true)}
                    className="rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
                  >
                    {boolKey === "read" ? "Mark read" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkSetVisibility(false)}
                    className="rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-accent"
                  >
                    {boolKey === "read" ? "Mark unread" : "Hide"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={bulkDelete}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto font-mono text-xs text-ink-faint transition-colors hover:text-ink"
              >
                clear
              </button>
            </div>
          )}
          {q && (
            <p className="border-b border-card-border px-4 py-2 text-xs text-ink-faint">
              {filtered.length} of {sorted?.length ?? 0} shown
            </p>
          )}
          <table className="w-full text-left text-sm">
            {/* SR context: what this table is + how many rows are shown
                (filters shrink the set without any other announcement). */}
            <caption className="sr-only">
              {spec.label} list — {filtered.length}
              {q ? ` matching “${query}”` : ""} of {sorted?.length ?? 0}
            </caption>
            {/* Sticky header: long collections (messages, posts) keep
                column labels visible while scrolling the table. */}
            <thead className="sticky top-0 z-[5] border-b border-card-border bg-paper-deep/50 backdrop-blur">
              <tr>
                <th scope="col" className="w-8 px-2 py-3" aria-label="Select rows">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={`Select all ${spec.label.toLowerCase()}s`}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                </th>
                {orderKey && <th scope="col" className="w-10 px-2 py-3" aria-label="Reorder" />}
                {previewKey && (
                  <th scope="col" className="w-14 px-2 py-3" aria-label="Preview" />
                )}
                {spec.listColumns.map((col) => (
                  <th key={col} scope="col" className="px-4 py-3 font-mono text-xs font-medium text-ink-faint">
                    {col}
                  </th>
                ))}
                {/* #22: Always show updatedAt as the last column. */}
                <th scope="col" className="px-4 py-3 font-mono text-xs font-medium text-ink-faint">
                  updated
                </th>
                <th scope="col" className="px-4 py-3 text-right font-mono text-xs font-medium text-ink-faint">
                  actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.map((doc, i) => {
                const id = String(doc._id ?? "");
                const thumb = previewKey ? String(doc[previewKey] ?? "") : "";
                return (
                  <tr key={id} className="relative transition-colors hover:bg-paper/60">
                    {/* Hover accent: a 2px bar on the leading edge — rows
                        scan faster than a background wash alone. */}
                    <td
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-full w-0.5 bg-accent opacity-0 transition-opacity [tr:hover_&]:opacity-60"
                    />
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          })
                        }
                        aria-label={`Select ${formatCell(doc.name ?? doc.title ?? "")}`}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </td>
                    {orderKey && (
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => move(id, -1)}
                            disabled={i === 0 || q !== ""}
                            aria-label={`Move ${formatCell(doc.name ?? doc.title ?? "")} up`}
                            className="text-ink-faint transition-colors hover:text-accent disabled:opacity-25"
                          >
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(id, 1)}
                            disabled={i === filtered.length - 1 || q !== ""}
                            aria-label={`Move ${formatCell(doc.name ?? doc.title ?? "")} down`}
                            className="text-ink-faint transition-colors hover:text-accent disabled:opacity-25"
                          >
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                    {previewKey && (
                      <td className="px-2 py-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-9 w-14 rounded-md border border-card-border object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="block h-9 w-14 rounded-md border border-dashed border-card-border"
                          />
                        )}
                      </td>
                    )}
                    {spec.listColumns.map((col) => {
                      const raw = doc[col];
                      const chip = BOOL_CHIPS[col];
                      // Boolean chips: colored pill per state.
                      if (chip && typeof raw === "boolean") {
                        const labels = BOOL_LABELS[col];
                        // #23: Inline mark-as-read toggle for message collection.
                        const canToggle = collection === "message" && col === "read";
                        return (
                          <td key={col} className="px-4 py-3">
                            <button
                              type="button"
                              disabled={!canToggle}
                              onClick={canToggle ? async () => {
                                await fetch(`/api/admin/${collection}/${id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ data: { read: !raw } }),
                                });
                                setDocs((prev) =>
                                  (prev ?? []).map((d) =>
                                    String(d._id) === id ? { ...d, read: !raw } : d
                                  )
                                );
                              } : undefined}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                                raw ? chip.on : chip.off
                              } ${canToggle ? "cursor-pointer hover:opacity-80" : ""}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`h-1.5 w-1.5 rounded-full ${
                                  raw ? "bg-current opacity-70" : "bg-current opacity-40"
                                }`}
                              />
                              {raw ? labels[0] : labels[1]}
                            </button>
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="px-4 py-3 text-ink">
                          {collection === "galaxyMoon" && col === "planetId"
                            ? (planetNames[String(doc[col])] ?? formatCell(doc[col]))
                            : formatCell(doc[col])}
                        </td>
                      );
                    })}
                    {/* #22: updatedAt as a relative date in the last data column. */}
                    <td className="px-4 py-3 font-mono text-xs text-ink-faint whitespace-nowrap">
                      {(() => {
                        const u = doc.updatedAt;
                        if (!u) return "—";
                        const d = u instanceof Date ? u : new Date(String(u));
                        return Number.isNaN(d.getTime()) ? "—" : formatCell(d.toISOString());
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {/* Phase 11: open the doc exactly as a visitor sees it */}
                        {(() => {
                          const url = publicUrlFor(doc, collection);
                          if (!url) return null;
                          const cls =
                            "inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-accent";
                          return url.external ? (
                            <a
                              href={url.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open on the live site (new tab)"
                              className={cls}
                            >
                              View
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ) : (
                            <a href={url.href} title="Open on the live site" className={cls}>
                              View
                            </a>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => duplicate(doc)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </button>
                        <a
                          href={`/admin/${collection}/${id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Edit
                        </a>
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          className="text-sm font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
