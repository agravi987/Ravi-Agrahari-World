/**
 * admin/[collection]/new/page.tsx — plan D10
 * Create view: the schema-driven form with empty values.
 * Singleton collections (siteConfig) live on their list page, so
 * this route bounces back to it.
 */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CollectionForm from "@/components/admin/CollectionForm";
import { getCollection } from "@/lib/collections";

export default function NewCollectionPage() {
  const params = useParams<{ collection: string }>();
  const router = useRouter();
  const collection = params.collection;
  const spec = getCollection(collection);

  // siteConfig has no "new" — its edit form IS the page.
  useEffect(() => {
    if (spec?.singleDoc) router.replace(`/admin/${collection}`);
  }, [spec?.singleDoc, collection, router]);

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
      <Link href={`/admin/${collection}`} className="font-mono text-xs text-accent hover:underline">
        ~/admin/{collection}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">New {spec.label}</h1>
      <Link href={`/admin/${collection}`} className="mt-1 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-accent">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {spec.label}s
      </Link>
      <p className="mt-1 text-sm text-ink-soft">{spec.description}</p>
      <div className="mt-8 rounded-card border border-card-border bg-card p-6 shadow-card">
        <CollectionForm spec={spec} collection={collection} initialData={null} isNew />
      </div>
    </div>
  );
}
