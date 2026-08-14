/**
 * admin/[collection]/[id]/page.tsx — plan D10
 * Edit view: loads the doc by _id and renders the schema-driven
 * form in edit mode (PUT). Singleton collections redirect away.
 */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CollectionForm from "@/components/admin/CollectionForm";
import { getCollection } from "@/lib/collections";

type Doc = Record<string, unknown> & { _id?: string };

export default function EditCollectionPage() {
  const params = useParams<{ collection: string; id: string }>();
  const router = useRouter();
  const { collection, id } = params;
  const spec = getCollection(collection);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Singleton collections are edited on their list page, not by id.
  useEffect(() => {
    if (spec?.singleDoc) router.replace(`/admin/${collection}`);
  }, [spec?.singleDoc, collection, router]);

  useEffect(() => {
    if (spec?.singleDoc) return;
    let cancelled = false;
    fetch(`/api/admin/${collection}/${id}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        return json;
      })
      .then((json) => {
        if (!cancelled) setDoc((json.data as Doc) ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [collection, id, spec?.singleDoc]);

  if (!spec) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Unknown collection</h1>
      </div>
    );
  }
  if (spec.singleDoc) return null; // redirecting

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs text-accent">~/admin/{collection}/{id.slice(0, 8)}</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit {spec.label}</h1>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!error && doc === null && <p className="mt-8 text-sm text-ink-faint">Loading…</p>}

      {!error && doc !== null && (
        <div className="mt-8 rounded-card border border-card-border bg-card p-6 shadow-card">
          <CollectionForm
            spec={spec}
            collection={collection}
            initialData={doc}
            id={id}
            isNew={false}
          />
        </div>
      )}
    </div>
  );
}
