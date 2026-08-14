/**
 * admin/login/page.tsx — plan D7/S11
 * Single-admin login. Submits Credentials to NextAuth; on success
 * redirects to /admin. Uses the redirect server action so the
 * session cookie is set before navigating.
 */
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false, // we handle navigation ourselves
    });

    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    // Preserve callbackUrl (e.g. deep link into a CMS page) if provided.
    const callback = searchParams.get("callbackUrl");
    router.push(callback && callback.startsWith("/admin") ? callback : "/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="rounded-card border border-card-border bg-card p-8 shadow-card">
        <p className="font-mono text-xs text-accent">~/admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Mission Control</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to manage the site.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Suspense wrapper: useSearchParams needs it (Next 15+). */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
