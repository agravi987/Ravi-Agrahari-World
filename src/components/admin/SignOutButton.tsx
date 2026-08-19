/**
 * SignOutButton.tsx (client) — the only client island on the admin
 * dashboard page (the rest is a server component, P10: it queries
 * live collection counts without shipping them through the client).
 */
"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2 text-sm text-ink-soft transition-colors hover:text-accent"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </button>
  );
}
