/**
 * TerminalEasterEgg.tsx (client) — plan §4 "small, hidden, delightful"
 * Ctrl+Shift+K (or Cmd+Shift+K — plain ⌘K belongs to the palette since
 * P7) opens a fake terminal overlay. Commands: help, whoami, ls, open
 * <section>, pwd, date, clear, exit. The `ls` listing doubles as a
 * clickable menu (P21). Purely cosmetic — no backend, no data; the
 * name comes from the content layer, never hardcoded. Escape closes.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { scrollToSection } from "@/lib/scrollTo";

interface Line {
  text: string;
  kind?: "out" | "err";
}

const HELP = `available commands:
  help       show this help
  whoami     who's flying this ship
  ls         list sections of the mission (clickable)
  open <sec> jump to a section — e.g. 'open galaxy'
  pwd        print working directory
  date       mission time
  clear      clear the screen
  exit       close the terminal`;

/** Section → destination: anchor on home or a full page (P21). */
const SECTIONS: { name: string; href: string }[] = [
  { name: "hero", href: "#hero" },
  { name: "skills", href: "#skills" },
  { name: "galaxy", href: "/detailed-galaxy" },
  { name: "projects", href: "#projects" },
  { name: "experience", href: "#experience" },
  { name: "certifications", href: "#certifications" },
  { name: "blog", href: "/blog" },
  { name: "contact", href: "#contact" },
];

const BANNER = "orbital@mission-control:~$ type 'help' to begin";

export default function TerminalEasterEgg({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Mirror of `open` for the global keydown listener (registered once)
  // so it can read the latest value without re-subscribing (P0 fix).
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Ctrl+Shift+K / Cmd+Shift+K toggles the terminal (plain Ctrl+K is
  // the command palette's shortcut since P7). State resets happen in
  // the handler (an event callback), not in an effect — avoids
  // setState-in-effect cascading renders (lint rule).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) {
          setOpen(false);
        } else {
          setLines([{ text: BANNER }]);
          setInput("");
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus management: opening moves focus into the input; closing
  // returns it to wherever the keyboard user was before (a11y dialog
  // contract — without this, focus is lost to <body> on close).
  const lastFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      inputRef.current?.focus();
    } else if (lastFocused.current) {
      lastFocused.current.focus();
      lastFocused.current = null;
    }
  }, [open]);

  // Close on Escape while the terminal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the newest output in view.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  function go(href: string) {
    setOpen(false);
    // Same-document anchors keep SPA behavior; full pages use the router.
    // P23: anchors must work from ANY page — if the section isn't on
    // this page, navigate home with the hash (Next scrolls after render).
    if (href.startsWith("#")) {
      // Reduced-motion-aware scroll (shared helper) + P23 any-page
      // fallback: no section on this page → navigate home with hash.
      if (!scrollToSection(href.slice(1))) router.push(`/${href}`);
    } else {
      router.push(href);
    }
  }

  function run(raw: string) {
    const trimmed = raw.trim();
    const cmd = trimmed.toLowerCase();
    const output: Line[] = [];
    switch (cmd) {
      case "help":
        output.push({ text: HELP });
        break;
      case "whoami":
        output.push({ text: `${name} — Cloud, DevOps & AI explorer. Learning in public.` });
        break;
      case "ls":
        output.push({ text: SECTIONS.map((s) => `~/${s.name}`).join("   ") });
        break;
      case "open": {
        // `open` with no arg lists the destinations; `open galaxy` navigates.
        output.push({ text: SECTIONS.map((s) => `~/${s.name}`).join("   ") });
        break;
      }
      default: {
        // open <section>
        const m = cmd.match(/^open\s+([\w-]+)$/);
        const hit = m ? SECTIONS.find((s) => s.name === m[1]) : undefined;
        if (m && !hit) {
          output.push({ text: `no such section: ${m[1]} — try 'ls'`, kind: "err" });
        } else if (hit) {
          setLines((prev) => [...prev, { text: `$ ${trimmed}` }]);
          setInput("");
          go(hit.href);
          return;
        } else {
          output.push({ text: `command not found: ${cmd} — try 'help'`, kind: "err" });
        }
      }
    }
    setLines((prev) => [...prev, { text: `$ ${trimmed}` }, ...output]);
    setInput("");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Hidden terminal — press Escape to close"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-card border border-card-border bg-card shadow-orbital"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-card-border bg-paper-deep px-4 py-2">
          <p className="font-mono text-xs text-ink-soft">~/terminal — Ctrl+Shift+K to toggle</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close terminal"
            className="rounded-full px-2 py-0.5 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        {/* Output */}
        <div
          ref={bodyRef}
          className="max-h-72 overflow-y-auto bg-ink px-4 py-3 font-mono text-xs leading-relaxed text-emerald-300"
        >
          {lines.map((line, i) => (
            <p
              key={i}
              className={line.kind === "err" ? "text-red-400" : "text-emerald-300"}
            >
              {line.text}
            </p>
          ))}
          {/* P21: the `ls` listing doubles as a clickable menu — each
              entry jumps straight to its destination. */}
          {lines.some((l) => l.text.startsWith("~/")) &&
            !lines[lines.length - 1].text.startsWith("$ open") && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => go(s.href)}
                    className="rounded-full border border-emerald-700/40 px-2 py-0.5 text-emerald-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                  >
                    ~/{s.name}
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Prompt line */}
        <form
          className="flex items-center gap-2 bg-ink px-4 py-3 font-mono text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <span className="shrink-0 text-emerald-400">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Terminal command"
            className="w-full bg-transparent text-emerald-300 placeholder:text-emerald-700 focus:outline-none"
            placeholder="type a command…"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
