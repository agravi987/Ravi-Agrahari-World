/**
 * Contact.tsx (client) — plan S8/D4
 * Copy-email one-click (clipboard + toast) + a mailto: pre-filled
 * form (zero backend, zero cost — plan D4) + social links.
 */
"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/ui/BrandIcon";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

interface ContactProps {
  email: string;
  socialLinks: { label: string; url: string }[];
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
  // linkedin intentionally absent: simple-icons 16 dropped the icon
};

export default function Contact({ email, socialLinks }: ContactProps) {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (older browsers) — the mailto form still works.
    }
  }

  return (
    <Section
      id="contact"
      eyebrow="contact"
      title="Let's connect"
      description="Open to internships, collabs, or just talking cloud & AI."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: email + socials */}
        <div>
          <button
            type="button"
            onClick={copyEmail}
            className="group inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-5 py-3 font-medium text-ink shadow-card transition-colors hover:border-accent/40"
          >
            {copied ? (
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 text-accent" aria-hidden="true" />
            )}
            <span className="font-mono text-sm">{email}</span>
          </button>
          <p className="mt-2 text-xs text-ink-faint" aria-live="polite">
            {copied ? "Copied to clipboard ✓" : "Click to copy — one click, no friction (plan §4.2)"}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {socialLinks.map((link) => {
              const brand = SOCIAL_BRANDS[link.label.toLowerCase().replace(/\W/g, "")];
              return (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-accent"
                >
                  {brand && <BrandIcon name={brand} className="h-4 w-4" aria-hidden="true" />}
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right: mailto: pre-filled form (plan D4 — no backend) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams({
              subject,
              body: message,
            });
            window.location.href = `mailto:${email}?${params.toString()}`;
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-card border border-card-border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="Let's talk about…"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full resize-none rounded-card border border-card-border bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              placeholder="Your message — opens in your mail app, nothing stored."
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Send via email
          </Button>
        </form>
      </div>
    </Section>
  );
}
