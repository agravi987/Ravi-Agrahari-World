/**
 * CollectionForm.tsx (client) — plan D10 / ui-ux-design.md P0
 * Schema-driven form: renders one control per CollectionField in the
 * registry and serializes back to the API. Handles text, textarea,
 * markdown, number, boolean, date, select, string-list (one per
 * line), JSON blocks (moons, social links), and the sectionsEnabled
 * checkbox grid. Plain on purpose (plan D10 — no fancy editor).
 */
"use client";

import { UploadCloud, Bold, Italic, Code, Code2, List, Type, Quote, Link2, ImageIcon, Minus } from "lucide-react";
import IconPicker from "@/components/admin/IconPicker";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import dynamic from "next/dynamic";
import type { CollectionField, CollectionSpec } from "@/lib/collections";
import { emptyDoc } from "@/lib/collections";
import { showToast } from "@/components/ui/Toast";
import { SECTION_HELP, type SectionKey } from "@/lib/sections";
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

/** react-markdown (+ remark stack) is heavy and only needed once the
 *  admin opens a preview or edits a post — load it on demand so the
 *  form itself hydrates fast. */
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => (
    <p className="px-4 py-3 text-sm text-ink-faint">Loading preview…</p>
  ),
});

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

/** 
 * MarkdownField — a markdown textarea with toolbar and preview.
 * NOTE: receives the field key as an explicit `fieldKey` PROP — React
 * strips `key` from props before a component ever sees it, so the old
 * `key: fieldKey` destructure was always undefined (every markdown
 * textarea rendered id="field-undefined", breaking label htmlFor and
 * focus-on-required-error).
 */
function MarkdownField({
  fieldKey,
  value,
  onChange,
  previewMode,
  setPreviewMode,
  label,
  placeholder,
}: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
  label: string;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insert = (prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const replacement = prefix + selected + suffix;
    const next = before + replacement + after;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const insertLine = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lines = value.slice(0, start).split("\n");
    const currentLine = lines[lines.length - 1];
    if (currentLine.startsWith(prefix)) return;
    insert(prefix, "");
  };

  const handleClick = (action: string) => {
    switch (action) {
      case "heading1":
        insertLine("# ");
        break;
      case "heading2":
        insertLine("## ");
        break;
      case "heading3":
        insertLine("### ");
        break;
      case "bold":
        insert("**", "**");
        break;
      case "italic":
        insert("*", "*");
        break;
      case "code":
        insert("`", "`");
        break;
      case "codeblock":
        insert("```\n", "\n```");
        break;
      case "bullet":
        insertLine("- ");
        break;
      case "numbered":
        insertLine("1. ");
        break;
      case "quote":
        insertLine("> ");
        break;
      case "link":
        insert("[", "](url)");
        break;
      case "image":
        insert("![", "](url)");
        break;
      case "hr":
        insert("\n---\n");
        break;
    }
  };

  const buttons = [
    // #19: Distinct text labels for heading buttons instead of generic Type icon.
    { icon: <span className="text-[10px] font-bold">H1</span>, title: "Heading 1", action: "heading1" as const },
    { icon: <span className="text-[10px] font-bold">H2</span>, title: "Heading 2", action: "heading2" as const },
    { icon: <span className="text-[10px] font-bold">H3</span>, title: "Heading 3", action: "heading3" as const },
    { icon: <Bold className="h-4 w-4" />, title: "Bold", action: "bold" as const },
    { icon: <Italic className="h-4 w-4" />, title: "Italic", action: "italic" as const },
    { icon: <Code className="h-4 w-4" />, title: "Inline code", action: "code" as const },
    { icon: <Code2 className="h-4 w-4" />, title: "Code block", action: "codeblock" as const },
    { icon: <List className="h-4 w-4" />, title: "Bullet list", action: "bullet" as const },
    { icon: <List className="h-4 w-4" />, title: "Numbered list", action: "numbered" as const },
    { icon: <Quote className="h-4 w-4" />, title: "Blockquote", action: "quote" as const },
    { icon: <Link2 className="h-4 w-4" />, title: "Link", action: "link" as const },
    { icon: <ImageIcon className="h-4 w-4" />, title: "Image", action: "image" as const },
    { icon: <Minus className="h-4 w-4" />, title: "Horizontal rule", action: "hr" as const },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-card-border">
      {!previewMode && (
        <div className="flex flex-wrap gap-1 p-1.5 border-b border-card-border bg-paper-deep/30 rounded-t-card" role="toolbar" aria-label="Markdown formatting">
          {buttons.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(b.action)}
              title={b.title}
              className="p-1.5 rounded text-ink-soft hover:text-accent hover:bg-accent-soft transition-colors disabled:opacity-40"
              aria-label={b.title}
            >
              {b.icon}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-b border-card-border bg-paper-deep/40 px-2 py-1.5">
        <div role="tablist" aria-label={`${label} mode`} className="flex gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={!previewMode}
            onClick={() => setPreviewMode(false)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
              !previewMode ? "bg-accent-soft text-accent" : "text-ink-faint hover:text-ink"
            }`}
          >
            write
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={previewMode}
            onClick={() => setPreviewMode(true)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] font-medium transition-colors ${
              previewMode ? "bg-accent-soft text-accent" : "text-ink-faint hover:text-ink"
            }`}
          >
            preview
          </button>
        </div>
        <span className="font-mono text-[10px] text-ink-faint">markdown</span>
      </div>
      {previewMode ? (
        <div className="markdown max-h-[420px] overflow-y-auto bg-paper px-4 py-3 text-sm">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={`field-${fieldKey}`}
          rows={14}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full resize-y border-0 bg-paper px-4 py-3 font-mono text-xs text-ink placeholder:text-ink-faint focus:outline-none`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/**
 * AutoSaveDraft — persists form state to localStorage and restores on mount.
 * Keyed by collection + id (or 'new') so each doc gets its own draft.
 */
function useAutoSaveDraft({
  collection,
  id,
  isNew,
  form,
  spec,
  enabled,
}: {
  collection: string;
  id?: string;
  isNew: boolean;
  form: Record<string, unknown>;
  spec: { fields: Array<{ key: string; type: string }> };
  /** Only true once the admin actually edits something — an untouched
   *  document must never grow a "draft" (the old behavior wrote the
   *  pristine doc to localStorage on mount, so EVERY edit page showed
   *  a phantom unsaved-draft banner). */
  enabled: boolean;
}) {
  const draftKey = `draft:${collection}:${isNew ? "new" : id}`;
  const [hasDraft, setHasDraft] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only restore if draft is recent (24h) and has content
        if (Date.now() - (parsed.ts || 0) < 24 * 60 * 60 * 1000) {
          const hasContent = Object.values(parsed.data).some(
            (v) => v !== "" && v !== false && v !== null && v !== undefined
          );
          if (hasContent) {
            // Wrap in setTimeout to avoid synchronous setState in effect
            setTimeout(() => setHasDraft(true), 0);
          }
        }
      }
    } catch {
      // ignore corrupt draft
    }
  }, [draftKey]);

  // Save draft on form change (debounced 1s) — but only after a real
  // user edit (`enabled`), never on mount.
  useEffect(() => {
    if (!enabled) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ data: form, ts: Date.now() }));
      } catch {
        // quota exceeded, ignore
      }
    }, 1000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [form, draftKey, enabled]);

  // Restore draft into form
  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // #15: Merge draft with current form — use Object.hasOwn to
        // detect fields the draft explicitly set, not truthiness checks
        // that lose `false` and `0` values.
        const merged: Record<string, unknown> = { ...form };
        for (const f of spec.fields) {
          if (Object.hasOwn(parsed.data, f.key)) {
            merged[f.key] = parsed.data[f.key];
          }
        }
        return merged;
      }
    } catch {
      // ignore
    }
    return form;
  };

  // Clear draft on successful save
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch {
      // ignore
    }
  };

  return { hasDraft, restoreDraft, clearDraft };
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

  // Auto-save draft hook — writes only after real edits (see `dirty`).
  const [dirty, setDirty] = useState(false);

  // #18: Expose dirty state globally so AdminShortcuts can guard navigation.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__adminFormDirty = dirty;
    return () => { (window as unknown as Record<string, unknown>).__adminFormDirty = false; };
  }, [dirty]);
  const { hasDraft, restoreDraft, clearDraft } = useAutoSaveDraft({
    collection,
    id,
    isNew,
    form,
    spec,
    enabled: dirty,
  });
  // Banner state: hasDraft comes from a PREVIOUS session's localStorage
  // entry; Restore/Discard both dismiss it. There is deliberately NO
  // auto-restore effect — the old one silently overwrote the freshly
  // loaded doc ~1s after mount (and made the banner unreachable).
  const [draftRestored, setDraftRestored] = useState(false);

  // #2: Unsaved-changes guard: warn before navigating away when dirty.
  // The Cancel button checks this via onClick (see below).
  function handleCancel(e: React.MouseEvent) {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
      e.preventDefault();
    }
  }

  // Also guard browser-level navigation (tab close, hard refresh).
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to show the dialog
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl/Cmd+S saves the form without leaving it (standard editor
  // muscle memory) — requestSubmit runs the same validation + submit.
  const formRef = useRef<HTMLFormElement | null>(null);
  // #21: When true, save stays on the edit page instead of navigating back.
  const stayOnPage = useRef(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function set(key: string, value: unknown) {
    setDirty(true); // first edit arms the autosave
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

  // Auto-fill moon fields when a project is selected (galaxyMoon only).
  // Runs after the projectId refSelect value changes.
  const [importingProject, setImportingProject] = useState(false);
  useEffect(() => {
    if (collection !== "galaxyMoon") return;
    const projectId = form.projectId as string | undefined;
    if (!projectId) return;
    let alive = true;
    setImportingProject(true);
    fetch(`/api/admin/project/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!alive) return;
        const p = json?.data;
        if (!p) return;
        // Map project fields → moon fields
        const updates: Record<string, unknown> = {
          name: p.title ?? "",
          description: p.description ?? "",
          githubUrl: p.repoUrl ?? "",
          liveUrl: p.demoUrl ?? "",
          technologies: Array.isArray(p.tech) ? p.tech.join("\n") : "",
          // Derive slug from project slug if available, else from title
          slug: p.slug ? `project-${p.slug}` : slugify(p.title ?? ""),
          // Use first tech as icon emoji fallback, or a default
          icon: p.tech?.[0] ? `🛠️` : "📦",
        };
        // Only apply fields that are currently empty — don't overwrite user edits
        setForm((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(updates)) {
            const current = String(prev[k] ?? "").trim();
            if (current === "") next[k] = v;
          }
          return next;
        });
        // Also clear draft since we're importing fresh data
        if (typeof window !== "undefined") {
          const draftKey = `draft:galaxyMoon:${isNew ? "new" : id}`;
          localStorage.removeItem(draftKey);
        }
      })
      .catch((err) => {
        console.error("[import project]", err);
      })
      .finally(() => {
        if (alive) setImportingProject(false);
      });
    return () => { alive = false; };
  }, [form.projectId, collection, isNew, id]);

  // "＋ New Project" modal state
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    description: "",
    tech: "",
    repoUrl: "",
    demoUrl: "",
  });
  const [newProjectPending, setNewProjectPending] = useState(false);

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewProjectPending(true);
    try {
      const res = await fetch("/api/admin/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title: newProjectForm.title,
            description: newProjectForm.description,
            tech: newProjectForm.tech.split("\n").map((s) => s.trim()).filter(Boolean),
            repoUrl: newProjectForm.repoUrl || undefined,
            demoUrl: newProjectForm.demoUrl || undefined,
            featured: false,
            order: 0,
          },
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Create failed");
      const newProject = json.data;
      // Close modal, set projectId to the new project, which triggers the import effect
      setNewProjectForm({ title: "", description: "", tech: "", repoUrl: "", demoUrl: "" });
      setNewProjectModal(false);
      set("projectId", newProject._id);
      showToast("Project created & imported into moon");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setNewProjectPending(false);
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
    const missing = spec.fields.filter((f) => {
      if (!f.required) return false;
      const raw = form[f.key];
      // #12: Numbers are required when the field is empty string or NaN.
      if (f.type === "number") {
        const s = String(raw ?? "").trim();
        return s === "" || Number.isNaN(Number(s));
      }
      // Booleans always have a value (true/false), never truly "empty".
      if (f.type === "boolean") return false;
      return String(raw ?? "").trim() === "";
    });
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
      // Clear draft on successful save
      clearDraft();
      // #21: If "Save and continue" was clicked, stay on the page.
      if (stayOnPage.current) {
        stayOnPage.current = false;
        showToast("Saved — staying on this page");
        return;
      }
      // #11: Back to the list. No router.refresh() needed — the target
      // page's own fetch-on-mount handles freshness.
      router.push(`/admin/${collection}`);
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
    // #15: focus-visible:ring for keyboard users
    const inputClasses = `w-full rounded-card border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 ${
      invalid
        ? "border-red-500/60 focus:border-red-500 focus-visible:ring-red-500/15"
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
          <MarkdownField
            key={key}
            fieldKey={key}
            value={String(value ?? "")}
            onChange={(v) => set(key, v)}
            previewMode={previewing}
            setPreviewMode={(v) => setPreviewMode((p) => ({ ...p, [key]: v }))}
            label={f.label}
            placeholder={f.placeholder}
          />
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
            min={f.min}
            max={f.max}
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
            {/* #4: Derive boolean label from field key instead of hardcoded "Enabled" */}
            {f.key === "isVisible" ? "Visible" : f.key === "isFeatured" ? "Featured" : f.key === "read" ? "Read" : f.label}
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
            {/* #9: Leading placeholder option for non-required selects */}
            {!f.required && <option value="">— Select —</option>}
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
        // projectId on galaxyMoon gets a "＋ New Project" button for inline creation
        if (key === "projectId" && collection === "galaxyMoon") {
          control = (
            <div className="flex items-center gap-2">
              <RefSelect
                field={f}
                value={String(value ?? "")}
                onChange={(v) => set(key, v)}
                inputClasses={inputClasses}
              />
              <button
                type="button"
                onClick={() => setNewProjectModal(true)}
                disabled={newProjectPending || importingProject}
                className="shrink-0 rounded-full border border-card-border bg-card px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-accent hover:border-accent disabled:opacity-50"
                title="Create a new project and import it"
              >
                ＋ New Project
              </button>
            </div>
          );
        } else {
          control = (
            <RefSelect
              field={f}
              value={String(value ?? "")}
              onChange={(v) => set(key, v)}
              inputClasses={inputClasses}
            />
          );
        }
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
      case "sectionsEnabled": {
        control = (
          <div className="space-y-2" role="group" aria-label="Section visibility">
            <p className="text-xs text-ink-faint">
              Hidden sections disappear from the page <em>and</em> from navigation —
              perfect while content is still in progress.
            </p>
            {(f.options ?? []).map((section) => {
              const enabled = Boolean((value as Record<string, boolean> | undefined)?.[section]);
              return (
                <label
                  key={section}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    enabled
                      ? "border-accent/30 bg-accent-soft/40"
                      : "border-card-border bg-paper hover:bg-paper-deep/40"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium capitalize text-ink">
                      {section}
                    </span>
                    <span className="block truncate text-xs text-ink-faint">
                      {SECTION_HELP[section as SectionKey] ?? "Show this section on the site"}
                    </span>
                  </span>
                  {/* iOS-style switch: sr-only checkbox + peer-styled track */}
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        set(key, { ...(value as Record<string, boolean>), [section]: e.target.checked })
                      }
                      className="peer sr-only"
                      aria-label={`Show ${section} section`}
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
              );
            })}
          </div>
        );
        break;
      }
      default:
        // #icon: Icon fields get the IconPicker with live preview + browse.
        if (f.key === "icon") {
          const iconMode = collection === "skill" ? "lucide" : "emoji";
          control = (
            <IconPicker
              id={`field-${key}`}
              value={String(value ?? "")}
              onChange={(v) => set(key, v)}
              mode={iconMode}
              inputClasses={inputClasses}
            />
          );
        } else {
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-save draft restore banner */}
      {hasDraft && !draftRestored && (
        <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4">
          <span>You have an unsaved draft from a previous session.</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const restored = restoreDraft();
                setForm(restored);
                setDraftRestored(true);
              }}
              className="rounded-full border border-card-border bg-card px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setDraftRestored(true); // dismiss without restoring
              }}
              className="rounded-full border border-card-border bg-card px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-red-500"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      {draftRestored && hasDraft && (
        <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-4">
          <span>Draft restored.</span>
          <button
            type="button"
            onClick={() => clearDraft()}
            className="font-mono text-[10px] text-emerald-600 hover:underline"
          >
            Clear draft
          </button>
        </div>
      )}

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

      {/* ＋ New Project modal — inline project creation from moon form */}
      {newProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setNewProjectModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-project-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-card-border bg-card shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="new-project-title" className="mb-4 text-lg font-semibold text-ink">
              Create New Project
            </h3>
            <p className="mb-4 text-sm text-ink-faint">
              Fill in the project details — it will be saved and imported into this moon.
            </p>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="np-title" className="block text-sm font-medium text-ink mb-1">
                  Title *
                </label>
                <input
                  id="np-title"
                  type="text"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  placeholder="My Cool Project"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="np-description" className="block text-sm font-medium text-ink mb-1">
                  Description
                </label>
                <textarea
                  id="np-description"
                  rows={3}
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 resize-y"
                  placeholder="A brief description of what this project does"
                />
              </div>
              <div>
                <label htmlFor="np-tech" className="block text-sm font-medium text-ink mb-1">
                  Tech Stack (one per line)
                </label>
                <textarea
                  id="np-tech"
                  rows={3}
                  value={newProjectForm.tech}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, tech: e.target.value })}
                  className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 resize-y font-mono text-xs"
                  placeholder="Next.js&#10;TypeScript&#10;Tailwind CSS"
                />
              </div>
              <div>
                <label htmlFor="np-repo" className="block text-sm font-medium text-ink mb-1">
                  Repo URL
                </label>
                <input
                  id="np-repo"
                  type="url"
                  value={newProjectForm.repoUrl}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, repoUrl: e.target.value })}
                  className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  placeholder="https://github.com/you/project"
                />
              </div>
              <div>
                <label htmlFor="np-demo" className="block text-sm font-medium text-ink mb-1">
                  Demo URL
                </label>
                <input
                  id="np-demo"
                  type="url"
                  value={newProjectForm.demoUrl}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, demoUrl: e.target.value })}
                  className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  placeholder="https://my-project.vercel.app"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewProjectModal(false)}
                  className="rounded-full border border-card-border bg-card px-4 py-2 text-sm text-ink-soft transition-colors hover:text-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newProjectPending || !newProjectForm.title.trim()}
                  className="rounded-full bg-accent-btn px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover disabled:opacity-50"
                >
                  {newProjectPending ? "Creating…" : "Create & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          title="Save (Ctrl/Cmd+S)"
          className="rounded-full bg-accent-btn px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : isNew ? "Create" : "Save changes"}
        </button>
        {/* #21: Save and continue editing — saves without navigating away. */}
        {!isNew && (
          <button
            type="submit"
            disabled={pending}
            onClick={() => { stayOnPage.current = true; }}
            className="rounded-full border border-card-border bg-card px-5 py-2.5 text-sm text-ink-soft transition-colors hover:text-accent disabled:opacity-50"
          >
            Save & continue
          </button>
        )}
        <a
          href={`/admin/${collection}`}
          onClick={handleCancel}
          className="rounded-full border border-card-border bg-card px-6 py-2.5 text-sm text-ink-soft transition-colors hover:text-accent"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
