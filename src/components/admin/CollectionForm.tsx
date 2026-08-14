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
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { CollectionField, CollectionSpec } from "@/lib/collections";
import { emptyDoc } from "@/lib/collections";

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
          out[f.key] = raw == null ? 0 : Number(raw);
          break;
        default:
          out[f.key] = raw == null ? "" : String(raw);
      }
    }
    return out;
  });

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        case "number":
          data[f.key] = Number(raw) || 0;
          break;
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
    const inputClasses =
      "w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

    let control: React.ReactNode;
    switch (f.type) {
      case "textarea":
      case "markdown":
        control = (
          <textarea
            id={`field-${key}`}
            rows={f.type === "markdown" ? 14 : 4}
            value={String(value ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className={`${inputClasses} resize-y ${f.type === "markdown" ? "font-mono text-xs" : ""}`}
            placeholder={f.placeholder}
          />
        );
        break;
      case "number":
        control = (
          <input
            id={`field-${key}`}
            type="number"
            value={Number(value) || 0}
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
          {f.type === "markdown" && (
            <span className="font-mono text-[10px] text-ink-faint">markdown supported</span>
          )}
          {f.image && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint">
              <ImageIcon className="h-3 w-3" aria-hidden="true" />
              image
            </span>
          )}
        </div>
        {control}
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

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
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
