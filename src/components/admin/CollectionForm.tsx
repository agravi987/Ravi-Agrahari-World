/**
 * CollectionForm.tsx (client) — plan D10 / ui-ux-design.md P0
 * Schema-driven form: renders one control per CollectionField in the
 * registry and serializes back to the API. Handles text, textarea,
 * markdown, number, boolean, date, select, string-list (one per
 * line), JSON blocks (moons, social links), and the sectionsEnabled
 * checkbox grid. Plain on purpose (plan D10 — no fancy editor).
 */
"use client";

import { ImageIcon, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import type { CollectionField, CollectionSpec } from "@/lib/collections";
import { emptyDoc } from "@/lib/collections";
import { showToast } from "@/components/ui/Toast";
import GalaxySettingsPreview from "./GalaxySettingsPreview";

/** Phase 11: derive a URL-safe slug from a name/title (auto-fill). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Which collection's slug auto-fills from which field (Phase 11). */
const SLUG_SOURCE: Record<string, string> = {
  post: "title",
  galaxyPlanet: "name",
  galaxyMoon: "name",
};

/** Seed-default moon types — used only while the galaxySettings
 *  singleton is missing or its moonTypes list is empty. */
const DEFAULT_MOON_TYPES = ["project", "lab", "notes", "certification", "blog", "achievement"];

/**
 * MoonTypeSelect — the moon `type` picker, driven by the CONFIGURABLE
 * galaxySettings.moonTypes list (fetch from the settings singleton),
 * not a hardcoded registry. If the current value isn't in the list it
 * stays visible (merged in first) so the admin can see what's stored.
 */
function MoonTypeSelect({
  value,
  onChange,
  inputClasses,
}: {
  value: string;
  onChange: (v: string) => void;
  inputClasses: string;
}) {
  const [types, setTypes] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/galaxySettings")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive) return;
        const list = json?.data?.moonTypes;
        setTypes(
          Array.isArray(list) && list.length > 0
            ? list.map((t: unknown) => String(t))
            : DEFAULT_MOON_TYPES
        );
      })
      .catch(() => {
        if (alive) setTypes(DEFAULT_MOON_TYPES);
      });
    return () => {
      alive = false;
    };
  }, []);

  const options = types ?? DEFAULT_MOON_TYPES;
  const merged =
    value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClasses}
    >
      {types === null && <option value="">Loading…</option>}
      {merged.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

/**
 * RefSelect — a select whose options load from another collection
 * (galaxy v4: parent planet for moons). Values are Mongo _ids, labels
 * are the doc's `name`. Requires the admin session cookie — this whole
 * form only ever runs inside /admin, so the fetch is authorized.
 */
function RefSelect({
  field,
  value,
  onChange,
  inputClasses,
}: {
  field: CollectionField;
  value: string;
  onChange: (v: string) => void;
  inputClasses: string;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // loading starts true; only async callbacks touch state (lint rule).
    fetch(`/api/admin/${field.refCollection}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive) return;
        const docs = json?.data;
        setOptions(
          Array.isArray(docs)
            ? docs.map((d: { _id: unknown; name?: string }) => ({
                id: String(d._id),
                name: d.name ?? String(d._id),
              }))
            : []
        );
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [field.refCollection]);

  if (failed) {
    return <p className="text-xs text-red-600">Could not load options — refresh and try again.</p>;
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
      {loading ? (
        <option value="">Loading…</option>
      ) : (
        <option value="">Select…</option>
      )}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

/**
 * ImageUpload — uploads a picked file to /api/upload (Cloudinary,
 * plan D8) and feeds the returned URL into the parent form field.
 * Shows a preview once a URL exists; surfaces the "not configured"
 * 503 so the admin knows they can just paste a URL instead.
 */
function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      onChange(json.url);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3">
      <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-card-border bg-paper px-3.5 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent">
        <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? "Uploading…" : "Upload"}
        <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
      </label>
      {msg && <p className="text-xs text-red-600">{msg}</p>}
      {value && (
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-card-border">
          <Image src={value} alt="" fill sizes="80px" className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}

interface CollectionFormProps {
  spec: CollectionSpec;
  collection: string;
  /** Existing doc (edit) or null (new). */
  initialData: Record<string, unknown> | null;
  /** Mongo _id when editing. */
  id?: string;
  isNew: boolean;
}

/** Loose form state: raw strings for text-ish fields, objects for checkboxes. */
type FormState = Record<string, unknown>;

export default function CollectionForm({
  spec,
  collection,
  initialData,
  id,
  isNew,
}: CollectionFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Phase 11: required-field inline errors (key → shown message).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Phase 11: markdown fields currently in preview mode (key → bool).
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});
  // Phase 11: slug fields the user edited by hand — those stop auto-filling.
  const slugEdited = useRef<Set<string>>(new Set());

  // Slug auto-fill wiring (Phase 11): which field feeds the slug.
  const slugField = spec.fields.find((f) => f.key === "slug")?.key;
  const slugSourceKey = SLUG_SOURCE[collection];

  // Initialize once from existing data + registry defaults so every
  // input is controlled and no field is ever undefined.
  const [form, setForm] = useState<FormState>(() => {
    const base = emptyDoc(spec);
    const data = initialData ?? {};
    const out: FormState = {};
    for (const f of spec.fields) {
      const raw = data[f.key] ?? base[f.key];
      switch (f.type) {
        case "stringList":
          out[f.key] = Array.isArray(raw) ? raw.join("\n") : "";
          break;
        case "json":
          out[f.key] = JSON.stringify(raw ?? null, null, 2);
          break;
        case "sectionsEnabled":
          out[f.key] = { ...(raw as Record<string, boolean> | undefined) };
          break;
        case "boolean":
          out[f.key] = Boolean(raw);
          break;
        case "number":
          // Keep the raw string so an empty field stays empty ("use the
          // default") instead of snapping to 0 — see serialize().
          out[f.key] = raw == null ? "" : String(raw);
          break;
        default:
          out[f.key] = raw == null ? "" : String(raw);
      }
    }
    return out;
  });

  function set(key: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Phase 11: auto-derive an empty/untouched slug from name/title.
      if (slugField && key === slugSourceKey && !slugEdited.current.has(slugField)) {
        const derived = slugify(String(value ?? ""));
        if (derived) next[slugField] = derived;
      }
      return next;
    });
    // Typing in the slug field itself marks it as hand-edited.
    if (key === slugField) slugEdited.current.add(key);
    // Clear any inline error for this field as the user fixes it.
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  /** Serialize raw form state → API payload; returns error string on bad JSON. */
  function serialize(): { data: Record<string, unknown> } | { error: string } {
    const data: Record<string, unknown> = {};
    for (const f of spec.fields) {
      const raw = form[f.key];
      switch (f.type) {
        case "stringList":
          data[f.key] = String(raw ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          break;
        case "json":
          try {
            data[f.key] = String(raw ?? "").trim() === "" ? null : JSON.parse(String(raw));
          } catch {
            return { error: `"${f.label}" is not valid JSON — fix it or leave it empty.` };
          }
          break;
        case "number": {
          // Empty string → undefined so JSON.stringify drops the key: the
          // schema default applies on create, the old value is kept on edit.
          const s = String(raw ?? "").trim();
          const n = Number(s);
          data[f.key] = s === "" || Number.isNaN(n) ? undefined : n;
          break;
        }
        case "boolean":
          data[f.key] = Boolean(raw);
          break;
        case "sectionsEnabled":
          data[f.key] = raw; // already an object of booleans
          break;
        default:
          data[f.key] = String(raw ?? "");
      }
    }
    return { data };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // Phase 11: required-field inline validation BEFORE serializing —
    // a red border + message per empty required field, focus the first.
    const missing = spec.fields.filter(
      (f) =>
        f.required &&
        String(form[f.key] ?? "").trim() === "" &&
        f.type !== "number" &&
        f.type !== "boolean"
    );
    if (missing.length > 0) {
      const errs: Record<string, string> = {};
      for (const f of missing) errs[f.key] = `Required — ${f.label.toLowerCase()} can't be empty.`;
      setFieldErrors(errs);
      setError(`${missing[0].label} is required.`);
      const first = document.querySelector<HTMLElement>(`#field-${missing[0].key}`);
      first?.focus();
      return;
    }
    const payload = serialize();
    if ("error" in payload) {
      setError(payload.error);
      return;
    }

    setPending(true);
    try {
      const url = isNew
        ? `/api/admin/${collection}`
        : `/api/admin/${collection}/${id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Save failed");
      // Phase 11: tell the admin the change is ALREADY live (the API
      // revalidated the public pages before responding).
      showToast(isNew ? "Created — the live site is updated" : "Saved — the live site is updated");
      // Back to the list; the API already revalidated the live site.
      router.push(`/admin/${collection}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  /** Renders one labeled control for a registry field. */
  function renderField(f: CollectionField) {
    const key = f.key;
    const value = form[key];
    // Phase 11: red border while a required field is missing.
    const invalid = Boolean(fieldErrors[key]);
    const inputClasses = `w-full rounded-card border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none ${
      invalid
        ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
        : "border-card-border focus:border-accent"
    }`;

    let control: React.ReactNode;
    switch (f.type) {
      case "textarea":
        control = (
          <textarea
            id={`field-${key}`}
            rows={4}
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={`${inputClasses} resize-y`}
            placeholder={f.placeholder}
          />
        );
        break;
      case "markdown": {
        // Phase 11: write / preview tabs — see the rendered note without
        // leaving the form (same react-markdown the blog uses).
        const previewing = Boolean(previewMode[key]);
        control = (
          <div className="overflow-hidden rounded-card border border-card-border">
            <div className="flex items-center justify-between gap-3 border-b border-card-border bg-paper-deep/40 px-2 py-1.5">
              <div
                role="tablist"
                aria-label={`${f.label} mode`}
                className="flex gap-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!previewing}
                  onClick={() => setPreviewMode((p) => ({ ...p, [key]: false }))}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
                    !previewing
                      ? "bg-accent-soft text-accent"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  write
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewing}
                  onClick={() => setPreviewMode((p) => ({ ...p, [key]: true }))}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
                    previewing
                      ? "bg-accent-soft text-accent"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  preview
                </button>
              </div>
              <span className="font-mono text-[10px] text-ink-faint">markdown</span>
            </div>
            {previewing ? (
              <div className="markdown max-h-[420px] overflow-y-auto bg-paper px-4 py-3 text-sm">
                <ReactMarkdown>{String(value ?? "")}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                id={`field-${key}`}
                rows={14}
                value={String(value ?? "")}
                onChange={(e) => set(key, e.target.value)}
                className={`w-full resize-y border-0 bg-paper px-4 py-3 font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none`}
                placeholder={f.placeholder}
              />
            )}
          </div>
        );
        break;
      }
      case "number":
        control = (
          <input
            id={`field-${key}`}
            type="number"
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={inputClasses}
          />
        );
        break;
      case "boolean":
        control = (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              id={`field-${key}`}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => set(key, e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Enabled
          </label>
        );
        break;
      case "select":
        control = (
          <select
            id={`field-${key}`}
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={inputClasses}
          >
            {(f.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
        break;
      case "moonType":
        // Options come from galaxySettings.moonTypes (configurable),
        // not from a hardcoded list — see MoonTypeSelect.
        control = (
          <MoonTypeSelect
            value={String(value ?? "")}
            onChange={(v) => set(key, v)}
            inputClasses={inputClasses}
          />
        );
        break;
      case "refSelect":
        control = (
          <RefSelect
            field={f}
            value={String(value ?? "")}
            onChange={(v) => set(key, v)}
            inputClasses={inputClasses}
          />
        );
        break;
      case "color":
        control = (
          <div className="flex items-center gap-3">
            <input
              id={`field-${key}`}
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(String(value ?? "")) ? String(value) : "#4f46e5"}
              onChange={(e) => set(key, e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-card border border-card-border bg-paper p-1"
              aria-label={`${f.label} swatch`}
            />
            <input
              type="text"
              value={String(value ?? "")}
              onChange={(e) => set(key, e.target.value)}
              className={inputClasses}
              placeholder="#4f46e5"
            />
          </div>
        );
        break;
      case "stringList":
        control = (
          <textarea
            id={`field-${key}`}
            rows={4}
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={`${inputClasses} resize-y`}
            placeholder={f.placeholder}
          />
        );
        break;
      case "json":
        control = (
          <textarea
            id={`field-${key}`}
            rows={8}
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={`${inputClasses} resize-y font-mono text-xs`}
            spellCheck={false}
          />
        );
        break;
      case "sectionsEnabled":
        control = (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(f.options ?? []).map((section) => {
              const enabled = Boolean((value as Record<string, boolean> | undefined)?.[section]);
              return (
                <label
                  key={section}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-card-border bg-paper px-3 py-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      set(key, { ...(value as Record<string, boolean>), [section]: e.target.checked })
                    }
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  {section}
                </label>
              );
            })}
          </div>
        );
        break;
      default:
        control = (
          <div className="flex flex-col gap-2">
            <input
              id={`field-${key}`}
              type={f.type === "date" ? "date" : "text"}
              value={String(value ?? "")}
              onChange={(e) => set(key, e.target.value)}
              className={inputClasses}
              placeholder={f.placeholder}
            />
            {f.image && (
              <ImageUpload value={String(value ?? "")} onChange={(url) => set(key, url)} />
            )}
          </div>
        );
    }

    return (
      <div key={key}>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={`field-${key}`} className="text-sm font-medium text-ink">
            {f.label}
            {f.required && <span className="text-accent" aria-hidden="true"> *</span>}
          </label>
          {f.image && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint">
              <ImageIcon className="h-3 w-3" aria-hidden="true" />
              image
            </span>
          )}
        </div>
        {control}
        {/* Phase 11: inline required-field error under the control */}
        {fieldErrors[key] && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            {fieldErrors[key]}
          </p>
        )}
        {f.help && <p className="mt-1 text-xs text-ink-faint">{f.help}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {spec.fields.map((f) => (
          <div
            key={f.key}
            className={
              f.type === "sectionsEnabled" || f.type === "json" || f.type === "markdown"
                ? "sm:col-span-2"
                : ""
            }
          >
            {renderField(f)}
          </div>
        ))}
      </div>

      {/* Phase 12: full post-shell live preview — title, date, tags and
          rendered markdown update as you type, mirroring /blog/[slug]. */}
      {collection === "post" && (
        <div className="rounded-card border border-card-border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-card-border px-5 py-3">
            <p className="font-mono text-xs text-accent">
              live preview · /blog/{String(form.slug || "…")}
            </p>
            <span className="font-mono text-[10px] text-ink-faint">updates as you type</span>
          </div>
          <article className="px-5 py-6 sm:px-8">
            <h3 className="font-display text-2xl font-semibold text-ink">
              {String(form.title || "Untitled note")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {form.publishedAt ? (
                <time
                  dateTime={String(form.publishedAt)}
                  className="font-mono text-xs text-ink-faint"
                >
                  {String(form.publishedAt)}
                </time>
              ) : (
                <span className="font-mono text-xs text-ink-faint">no date yet</span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {String(form.tags ?? "")
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-card-border bg-paper-deep px-2.5 py-0.5 font-mono text-[10px] text-ink-soft"
                    >
                      #{t}
                    </span>
                  ))}
              </div>
            </div>
            <div className="markdown mt-5 border-t border-card-border pt-5">
              {String(form.contentMarkdown ?? "").trim() ? (
                <ReactMarkdown>{String(form.contentMarkdown)}</ReactMarkdown>
              ) : (
                <p className="text-sm text-ink-faint">
                  Write markdown above — the rendered note appears here.
                </p>
              )}
            </div>
          </article>
        </div>
      )}

      {/* Galaxy v4 §29: live preview for the settings singleton — reads
          the form's current (unsaved) values. */}
      {spec.key === "galaxySettings" && (
        <GalaxySettingsPreview
          override={{
            showOrbitLines: Boolean(form.showOrbitLines),
            showStars: Boolean(form.showStars),
            starDensity: String(form.starDensity || "medium") as "low" | "medium" | "high",
            animationEnabled: Boolean(form.animationEnabled),
            globalSpeedScale: Number(form.globalSpeedScale) || 1,
          }}
        />
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent-btn px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : isNew ? "Create" : "Save changes"}
        </button>
        <a
          href={`/admin/${collection}`}
          className="rounded-full border border-card-border bg-card px-6 py-2.5 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
