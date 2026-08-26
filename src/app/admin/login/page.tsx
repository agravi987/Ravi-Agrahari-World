/**
 * admin/login/page.tsx — plan D7/S11
 * Single-admin login. Submits Credentials to NextAuth; on success
 * redirects to /admin. Uses the redirect server action so the
 * session cookie is set before navigating.
 */
"use client";

import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/** Phase 11: password field with a show/hide toggle (Eye/EyeOff) —
 *  plus a caps-lock warning (tiny QoL: failed logins from CAPS are
 *  indistinguishable from wrong passwords and burn limiter attempts). */
function PasswordInput() {
  const [show, setShow] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  return (
    <div className="relative">
      <input
        id="password"
        name="password"
        type={show ? "text" : "password"}
        required
        autoComplete="current-password"
        onKeyUp={(e) => setCapsOn(e.getModifierState("CapsLock"))}
        onBlur={() => setCapsOn(false)}
        className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-deep hover:text-ink"
      >
        {show ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      {capsOn && (
        <p role="status" className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          Caps Lock is on.
        </p>
      )}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Opt-in "remember email": pre-fills the field on this machine only.
  // Never stores the password — just spares typing on a private machine.
  const [rememberEmail, setRememberEmail] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Deferred one tick — sync localStorage reads stay out of hydration.
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem("admin-login-email");
        if (saved) {
          setRememberEmail(true);
          if (emailRef.current && !emailRef.current.value) emailRef.current.value = saved;
        }
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    try {
      if (rememberEmail) localStorage.setItem("admin-login-email", String(form.get("email") ?? ""));
      else localStorage.removeItem("admin-login-email");
    } catch {
      /* storage unavailable */
    }
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false, // we handle navigation ourselves
    });

    setPending(false);
    if (res?.error) {
      // The limiter's lockout carries a distinct code — show it honestly
      // instead of "invalid credentials" while the account is just
      // cooling down for 30s.
      setError(
        res?.code === "account_locked"
          ? "Too many attempts — this email is locked for 30 seconds. Try again shortly."
          : "Invalid email or password."
      );
      return;
    }
    // Preserve callbackUrl (e.g. deep link into a CMS page) if provided.
    const callback = searchParams.get("callbackUrl");
    router.push(callback && callback.startsWith("/admin") ? callback : "/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      {/* P20: aurora behind the login card — same calm topic-colored drift
          as the hero, transform-only (compositor), reduced-motion frozen. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-[10%] top-[15%] h-64 w-64 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--color-topic-cloud) 18%, transparent)" }}
        />
        <div
          className="absolute bottom-[10%] right-[8%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--color-topic-ai) 16%, transparent)" }}
        />
      </div>

      <div className="w-full max-w-sm">
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
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              className="w-full rounded-card border border-card-border bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>
          {/* Opt-in convenience — email only, never the password. */}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            Remember my email on this device
          </label>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            {/* Phase 11: show/hide toggle — verify you typed it right
                without a password manager dance. */}
            <PasswordInput />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent-btn px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-btn-hover disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        </div>

        {/* P20: escape hatch back to the public site */}
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-ink-faint transition-colors hover:text-accent"
          >
            ← Back to the site
          </Link>
        </p>
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
