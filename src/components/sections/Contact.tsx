/**
 * Contact.tsx (client) — plan S8/D4
 * Copy-email one-click (clipboard + toast) + a mailto: pre-filled
 * form (zero backend, zero cost — plan D4) + social links.
 */
"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/ui/BrandIcon";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import Section from "@/components/ui/Section";
import { showToast } from "@/components/ui/Toast";

interface ContactProps {
  email: string;
  socialLinks: { label: string; url: string }[];
  /** P25: availability line (CMS) — recruiter-first, hidden when empty. */
  availability?: string;
  /** Phase 17: "based in" line (CMS) — hidden when empty (zero-data). */
  location?: string;
}

/**
 * Brand links use simple-icons (plan §4.1: simple-icons = brands,
 * lucide = UI). Keyed by normalized label; unmapped labels just
 * render without an icon.
 */
const SOCIAL_BRANDS: Record<string, BrandIconName> = {
  github: "github",
  x: "x",
  twitter: "x",
  // Phase 17 (#11): quick-message links get real brand marks too.
  telegram: "telegram",
  whatsapp: "whatsapp",
  // linkedin intentionally absent: simple-icons 16 dropped the icon
};

/** Brand-colored hover for the social pills (color pass) — same
 *  language as the hero/footer: GitHub/X go near-ink, LinkedIn sky,
 *  Telegram sky-blue, WhatsApp green. */
const BRAND_HOVER: Record<string, string> = {
  github: "hover:border-ink/40 hover:text-ink",
  x: "hover:border-ink/40 hover:text-ink",
  twitter: "hover:border-ink/40 hover:text-ink",
  linkedin: "hover:border-topic-cloud/50 hover:text-topic-cloud-deep",
  telegram: "hover:border-topic-cloud/50 hover:text-topic-cloud-deep",
  whatsapp: "hover:border-emerald-500/50 hover:text-emerald-600",
};

/** P14: one-click purpose presets — pick a reason and the form
 *  pre-fills. Removes the blank-page friction of "what do I say?". */
const PURPOSE_PRESETS = [
  {
    label: "🤝 Collaboration",
    subject: "Let's collaborate",
    opener: "Hi! I'd love to collaborate on ",
  },
  {
    label: "💼 Hiring / Internship",
    subject: "Hiring / Internship inquiry",
    opener: "Hi! I'm reaching out about an opportunity at ",
  },
  {
    label: "💬 Just saying hi",
    subject: "Hi!",
    opener: "Hi! Just wanted to say hi — ",
  },
] as const;

export default function Contact({
  email,
  socialLinks,
  availability,
  location,
}: ContactProps) {
  const [copied, setCopied] = useState(false);
  // Phase 17 (#15): the draft survives accidental navigation — restored
  // from localStorage on mount, cleared after a clean send.
  const [name, setName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  // Phase 17 (#15): lazy mount — a 250ms idle delay keeps the heavy
  // restore out of the LCP path; hydration then fills the fields.
  const [draftReady, setDraftReady] = useState(false);
  const [attempted, setAttempted] = useState(false);
  // Phase 13: inbox send states + a honeypot (bots fill it, we ignore it).
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Real-time validity — the same rules /api/contact enforces.
  const valid = {
    name: name.trim().length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.trim()),
    subject: subject.trim().length >= 3,
    message: message.trim().length >= 10,
  };
  // Error text appears only AFTER a failed submit attempt — typing never
  // nags, but an invalid send is explained in place.
  const nameError = attempted && !valid.name;
  const emailError = attempted && !valid.email;
  const subjectError = attempted && !valid.subject;
  const messageError = attempted && !valid.message;
  const MESSAGE_MAX = 500; // P26: keeps the mailto body sane

  /** First field that needs attention — used to focus after a bad submit. */
  const firstInvalid =
    !valid.name ? "name" : !valid.email ? "email" : !valid.subject ? "subject" : !valid.message ? "message" : null;

  // Phase 17 (#15): restore the saved draft after mount (guarded — no
  // SSR mismatch, and only once). Draft key namespaced to the form so
  // a future second form doesn't collide.
  useEffect(() => {
    const t = setTimeout(() => setDraftReady(true), 250);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!draftReady || draftHydrated) return;
    // The restore runs inside requestAnimationFrame — an async callback,
    // so these setStates stay outside the synchronous-effect lint rule.
    const raf = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem("contact-draft");
        if (raw) {
          const d = JSON.parse(raw) as {
            name?: string;
            email?: string;
            subject?: string;
            message?: string;
          };
          if (typeof d.name === "string") setName(d.name);
          if (typeof d.email === "string") setEmailInput(d.email);
          if (typeof d.subject === "string") setSubject(d.subject);
          if (typeof d.message === "string") setMessage(d.message);
        }
      } catch {
        /* corrupt draft — start clean */
      }
      setDraftHydrated(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [draftReady, draftHydrated]);

  // Phase 17 (#15): autosave the draft on every change (only after the
  // restore ran, so we don't overwrite the saved draft with empties).
  useEffect(() => {
    if (!draftHydrated) return;
    try {
      localStorage.setItem(
        "contact-draft",
        JSON.stringify({ name, email: emailInput, subject, message })
      );
    } catch {
      /* storage unavailable (private mode) — in-memory only */
    }
  }, [name, emailInput, subject, message, draftHydrated]);

  function resetForm() {
    setName("");
    setEmailInput("");
    setSubject("");
    setMessage("");
    setAttempted(false);
    setSendError(null);
    setSent(false);
    // Phase 17 (#15): a clean send clears the saved draft too.
    try {
      localStorage.removeItem("contact-draft");
    } catch {
      /* storage unavailable */
    }
  }

  /** Purpose chip → pre-fill subject (and an opener if message is empty),
   *  then move focus into the subject field — a two-step gesture chain
   *  (P16): pick a reason → cursor is already where the typing happens. */
  function applyPreset(subject: string, opener: string) {
    setSubject((s) => s || subject);
    setMessage((m) => (m.trim() ? m : opener));
    showToast("Draft started — finish it and send");
    requestAnimationFrame(() => document.getElementById("subject")?.focus());
  }

  /** P26: the preset whose subject is currently in the field reads as active. */
  const activePreset = PURPOSE_PRESETS.find((p) => p.subject === subject);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // P9: real toast feedback (replaces relying on the inline line only).
      showToast("Email copied to clipboard");
    } catch {
      // Clipboard unavailable (older browsers) — the mailto form still works.
    }
  }

  return (
    <Section
      id="contact"
      index="06"
      eyebrow="contact"
      title="Let's connect"
      description="Open to internships, collabs, or just talking cloud & AI."
      tone="mars"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left: a quiet panel — availability, one-click email, socials */}
        <div className="rounded-card border border-card-border bg-paper-deep/40 p-6 shadow-card sm:p-7">
          {/* P25: availability pill — the same CMS line as the hero */}
          {availability && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              {availability}
            </p>
          )}

          {/* Phase 17 (#13): "based in" line from the CMS — hidden when
              empty (zero-data rule). */}
          {location && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <span aria-hidden="true">📍</span>
              based in {location}
            </p>
          )}

          <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
            Prefer email?
          </h3>
          <p className="mt-1.5 text-sm text-ink-soft">
            One click copies it — no forms, no friction.
          </p>

          <button
            type="button"
            onClick={copyEmail}
            className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-card border border-card-border bg-card px-5 py-3 font-medium text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {copied ? (
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 text-accent" aria-hidden="true" />
            )}
            <span className="truncate font-mono text-sm">{email}</span>
          </button>
          <p className="mt-2 text-xs text-ink-faint" aria-live="polite">
            {copied
              ? "Copied to clipboard ✓"
              : "Click to copy — one click, no friction (plan §4.2)"}
          </p>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Elsewhere
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {socialLinks.map((link) => {
                const brand =
                  SOCIAL_BRANDS[link.label.toLowerCase().replace(/\W/g, "")];
                const brandHover =
                  BRAND_HOVER[link.label.toLowerCase().replace(/\W/g, "")];
                return (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink-soft shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      brandHover ?? "hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    {brand && (
                      <BrandIcon
                        name={brand}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    )}
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <p className="mt-6 border-t border-card-border pt-4 font-mono text-[10px] text-ink-faint">
            replies within 24h · zero trackers
          </p>
        </div>

        {/* Right: send-to-inbox form (Phase 13) — mailto fallback only
            when the backend is unavailable. A success card replaces the
            form after a clean send. */}
        {sent ? (
          <div
            className="rounded-card border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-card"
            role="status"
          >
            <span
              aria-hidden="true"
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-2xl"
            >
              ✓
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink">
              Message sent
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              It&apos;s in my inbox{emailInput.trim() ? ` — I'll reply to ${emailInput.trim()}` : ""}.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="mt-5 rounded-full border border-card-border bg-card px-5 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
            >
              Send another message
            </button>
          </div>
        ) : (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            // Real validation: explain what's wrong, move focus to the
            // first invalid field, and don't send anything.
            if (!valid.name || !valid.email || !valid.subject || !valid.message) {
              showToast("A couple of fields still need your words");
              document.getElementById(firstInvalid ?? "name")?.focus();
              return;
            }
            // Phase 13: POST to the inbox first. Only when the backend is
            // unavailable do we fall back to the mailto: app — the site
            // keeps working on a fresh clone with no MongoDB.
            void (async () => {
              setSending(true);
              setSendError(null);
              try {
                const res = await fetch("/api/contact", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, email: emailInput, subject, message, company }),
                });
                if (res.ok) {
                  setSent(true);
                  showToast("Message sent — it's in my inbox");
                  return;
                }
                const j = await res.json().catch(() => null);
                // Rate-limited: respect it, don't bounce to mailto.
                if (res.status === 429) {
                  setSendError(
                    j?.error ?? "You're sending too quickly — try again in a few minutes."
                  );
                  return;
                }
                // Backend offline (no Mongo) or any other failure → mailto.
                showToast("Form offline — opening your mail app instead");
                const params = new URLSearchParams({
                  subject,
                  body: `${message}\n\n— ${name} (${emailInput})`,
                });
                window.location.href = `mailto:${email}?${params.toString()}`;
              } catch {
                // Network error — the mailto fallback still delivers.
                showToast("Form offline — opening your mail app instead");
                const params = new URLSearchParams({
                  subject,
                  body: `${message}\n\n— ${name} (${emailInput})`,
                });
                window.location.href = `mailto:${email}?${params.toString()}`;
              } finally {
                setSending(false);
              }
            })();
          }}
          // Ctrl/Cmd+Enter submits from anywhere in the form (desktop nicety)
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className="space-y-4"
        >
          {/* P14 presets, P26: the applied preset highlights itself */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="What's this about?"
          >
            {PURPOSE_PRESETS.map((p) => {
              const active = activePreset?.subject === p.subject;
              return (
                <button
                  key={p.subject}
                  type="button"
                  onClick={() => applyPreset(p.subject, p.opener)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? "border-accent/40 bg-accent-soft text-accent"
                      : "border-card-border bg-paper/60 text-ink-soft hover:border-accent/40 hover:bg-card hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {/* Phase 13: who's writing — needed to reply from the inbox */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                aria-invalid={nameError}
                aria-describedby={nameError ? "name-error" : undefined}
                className={`w-full rounded-card border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:outline-none focus:ring-4 ${
                  nameError
                    ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10"
                    : "border-card-border focus:border-accent focus:ring-accent/10"
                }`}
                placeholder="Ada Lovelace"
              />
              {nameError && (
                <p
                  id="name-error"
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  Name needs at least 2 characters.
                </p>
              )}
            </div>
            <div className="relative">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`w-full rounded-card border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:outline-none focus:ring-4 ${
                  emailError
                    ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10"
                    : "border-card-border focus:border-accent focus:ring-accent/10"
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  That email doesn&apos;t look right.
                </p>
              )}
            </div>
          </div>
          <div className="relative">
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              autoComplete="off"
              enterKeyHint="next"
              aria-invalid={subjectError}
              aria-describedby={subjectError ? "subject-error" : undefined}
              className={`w-full rounded-card border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:outline-none focus:ring-4 ${
                subjectError
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10"
                  : "border-card-border focus:border-accent focus:ring-accent/10"
              }`}
              placeholder="Let's talk about…"
            />
            {subjectError && (
              <p
                id="subject-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
              >
                Subject needs at least 3 characters.
              </p>
            )}
            {valid.subject && (
              <Check
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="relative">
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
              required
              maxLength={MESSAGE_MAX}
              autoComplete="off"
              enterKeyHint="send"
              aria-invalid={messageError}
              aria-describedby={
                messageError ? "message-error message-counter" : "message-counter"
              }
              className={`w-full resize-none rounded-card border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-shadow focus:outline-none focus:ring-4 ${
                messageError
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10"
                  : "border-card-border focus:border-accent focus:ring-accent/10"
              }`}
              // Phase 13 copy: messages land in the inbox now — the old
              // "nothing stored" text predates the Mongo inbox.
              placeholder="Your message lands in my inbox."
            />
            {messageError && (
              <p
                id="message-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
              >
                Message needs at least 10 characters.
              </p>
            )}
            {valid.message && (
              <Check
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Magnetic strength={0.15} className="w-full sm:w-auto">
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {sending ? "Sending…" : "Send message"}
              </Button>
            </Magnetic>
            {/* P26 counter, P27: id wired to the textarea via aria-describedby */}
            <span className="flex items-center gap-3">
              <span
                id="message-counter"
                aria-live="polite"
                className="font-mono text-[10px] text-ink-faint"
              >
                {message.length}/{MESSAGE_MAX}
              </span>
              <span
                aria-hidden="true"
                className="hidden font-mono text-[10px] text-ink-faint md:inline"
              >
                Ctrl<span className="text-ink-faint">+</span>Enter to send
              </span>
            </span>
          </div>
          {/* Phase 13: submission error (rate limit etc.) — inline, honest */}
          {sendError && (
            <p
              role="alert"
              className="rounded-card border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-400"
            >
              {sendError}
            </p>
          )}

          {/* Phase 13: honest note — inbox-first, mail-app fallback */}
          <p className="text-xs text-ink-faint">
            Your message lands in my inbox — no account, no spam. If the form
            is ever offline it falls back to your mail app instead.
          </p>

          {/* Honeypot: hidden from humans, bots fill it — the API ignores
              filled submissions (keeps the inbox clean). */}
          <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
            <label htmlFor="company">Company (leave empty)</label>
            <input
              id="company"
              name="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Phase 9: live mailto preview — exactly what your mail app
              will receive, updating as you type (visible only once the
              draft has something in it). */}
          {(subject.trim() || message.trim()) && (
            <div
              aria-live="polite"
              className="rounded-card border border-dashed border-card-border bg-paper-deep/40 px-4 py-3"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                {sent ? "sent" : "message preview"}
              </p>
              <dl className="mt-1.5 space-y-1 font-mono text-[11px] text-ink-soft">
                {(name.trim() || emailInput.trim()) && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-ink-faint">from</dt>
                    <dd className="truncate">
                      {name.trim()}
                      {name.trim() && emailInput.trim() ? " · " : ""}
                      {emailInput.trim()}
                    </dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-faint">to</dt>
                  <dd className="truncate">{email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-faint">subject</dt>
                  <dd className="truncate">{subject.trim() || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-faint">body</dt>
                  <dd className="truncate">{message.trim() || "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </form>
        )}
      </div>
    </Section>
  );
}
