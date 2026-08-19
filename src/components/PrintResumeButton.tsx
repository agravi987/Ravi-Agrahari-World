/**
 * PrintResumeButton.tsx (client) — P18: surfaces the site's print
 * stylesheet as a feature. One click → print dialog (Save as PDF /
 * print gives a clean résumé page — header, marquee and galaxy are
 * stripped by the @media print rules).
 */
"use client";

import { Printer } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function PrintResumeButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          window.print();
        } catch {
          /* print dialog blocked (rare) — nothing to do */
        }
        showToast("Print preview opened — choose Save as PDF");
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print / save as PDF
    </button>
  );
}
