/**
 * admin/[collection]/[id]/page.tsx — plan D10
 * Edit view: loads the doc by _id and renders the schema-driven
 * form in edit mode (PUT). Singleton collections redirect away.
 */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import CollectionForm from "@/components/admin/CollectionForm";
import { getCollection, publicUrlFor } from "@/lib/collections";

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
        <p className="font-mono text-xs text-accent">~/admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Unknown collection</h1>
        <Link href="/admin" className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Mission Control
        </Link>
      </div>
    );
  }
  if (spec.singleDoc) return null; // redirecting

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/admin/${collection}`} className="font-mono text-xs text-accent hover:underline">
            ~/admin/{collection}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Edit {spec.label}</h1>
          <Link href={`/admin/${collection}`} className="mt-1 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {spec.label}s
          </Link>
        </div>
        {/* Phase 11: see the doc exactly as a visitor does — the CMS →
            site loop is one click, not a guess. */}
        {doc && (() => {
          const url = publicUrlFor(doc, collection);
          if (!url) return null;
          const cls =
            "inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent";
          return url.external ? (
            <a
              href={url.href}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on the live site (new tab)"
              className={cls}
            >
              View on site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : (
            <a href={url.href} title="Open on the live site" className={cls}>
              View on site
            </a>
          );
        })()}
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!error && doc === null && <p className="mt-8 text-sm text-ink-faint">Loading…</p>}

      {!error && doc !== null && (
        <div className="mt-8 rounded-card border border-card-border bg-card p-6 shadow-card">
          <CollectionForm
            // BUGFIX: key by id — without it, navigating from editing
            // post A to post B (client-side link) REUSED the mounted
            // form and its useState initializer never re-ran: the form
            // showed A's values and saving silently overwrote B.
            key={id}
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
