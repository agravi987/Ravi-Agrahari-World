/**
 * admin/[collection]/page.tsx — plan D10 / ui-ux-design.md P0
 * List view for a collection (table + edit/delete). The singleton
 * siteConfig collection renders its edit form directly instead.
 * All writes go through /api/admin/* and revalidate the live site.
 */
"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CollectionForm from "@/components/admin/CollectionForm";
import { getCollection } from "@/lib/collections";

type Doc = Record<string, unknown> & { _id?: string };

/** Renders a cell value for the list table (arrays → count, booleans → yes/no). */
function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

export default function CollectionListPage() {
  const params = useParams<{ collection: string }>();
  const router = useRouter();
  const collection = params.collection;
  const spec = getCollection(collection);

  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [singleDoc, setSingleDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [collection, spec?.singleDoc]);

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
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-xs text-accent">~/admin/{collection}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{spec.label}</h1>
        <p className="mt-1 text-sm text-ink-soft">{spec.description}</p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {!error && docs === null && singleDoc === null && (
          <p className="mt-6 text-sm text-ink-faint">Loading…</p>
        )}
        {!error && (
          <div className="mt-8 rounded-card border border-card-border bg-card p-6 shadow-card">
            <CollectionForm
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
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error || "Delete failed");
      return;
    }
    setDocs((prev) => (prev ?? []).filter((d) => String(d._id) !== id));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-accent">~/admin/{collection}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{spec.label}s</h1>
          <p className="mt-1 text-sm text-ink-soft">{spec.description}</p>
        </div>
        <a
          href={`/admin/${collection}/new`}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New {spec.label}
        </a>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && docs === null && <p className="mt-8 text-sm text-ink-faint">Loading…</p>}

      {!error && docs !== null && docs.length === 0 && (
        <div className="mt-8 rounded-card border border-dashed border-card-border bg-card/50 p-10 text-center">
          <p className="text-sm text-ink-soft">No {spec.label.toLowerCase()}s yet.</p>
          <a href={`/admin/${collection}/new`} className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
            Create the first one →
          </a>
        </div>
      )}

      {!error && docs !== null && docs.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-card border border-card-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-card-border bg-paper-deep/50">
              <tr>
                {spec.listColumns.map((col) => (
                  <th key={col} scope="col" className="px-4 py-3 font-mono text-xs font-medium text-ink-faint">
                    {col}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-right font-mono text-xs font-medium text-ink-faint">
                  actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {docs.map((doc) => {
                const id = String(doc._id ?? "");
                return (
                  <tr key={id} className="transition-colors hover:bg-paper/60">
                    {spec.listColumns.map((col) => (
                      <td key={col} className="px-4 py-3 text-ink">
                        {formatCell(doc[col])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
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
