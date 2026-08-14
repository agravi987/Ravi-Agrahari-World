/**
 * TerminalEasterEgg.tsx (client) — plan §4 "small, hidden, delightful"
 * Ctrl+K (or Cmd+K) opens a fake terminal overlay. Commands: help,
 * whoami, ls, pwd, date, clear, exit. Purely cosmetic — no backend,
 * no data. Escape closes. Mounted once in layout.tsx.
 */
"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  text: string;
  kind?: "out" | "err";
}

const HELP = `available commands:
  help    show this help
  whoami  who's flying this ship
  ls      list sections of the mission
  pwd     print working directory
  date    mission time
  clear   clear the screen
  exit    close the terminal`;

const SECTIONS = [
  "hero",
  "skills",
  "galaxy",
  "projects",
  "experience",
  "certifications",
  "blog",
  "contact",
];

const BANNER = "orbital@mission-control:~$ type 'help' to begin";

export default function TerminalEasterEgg() {
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

  // Ctrl+K / Cmd+K toggles the terminal from anywhere on the page.
  // State resets happen in the handler (an event callback), not in an
  // effect — avoids setState-in-effect cascading renders (lint rule).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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

  // Focus the input when the terminal opens (DOM-only — allowed).
  useEffect(() => {
    if (open) inputRef.current?.focus();
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

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase();
    const output: Line[] = [];
    switch (cmd) {
      case "help":
        output.push({ text: HELP });
        break;
      case "whoami":
        output.push({ text: "Agravi — Cloud, DevOps & AI explorer. Learning in public." });
        break;
      case "ls":
        output.push({ text: SECTIONS.map((s) => `~/${s}`).join("   ") });
        break;
      case "pwd":
        output.push({ text: "/home/agravi/portfolio" });
        break;
      case "date":
        output.push({ text: new Date().toLocaleString() });
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        setOpen(false);
        return;
      case "":
        break;
      default:
        output.push({ text: `command not found: ${cmd} — try 'help'`, kind: "err" });
    }
    setLines((prev) => [...prev, { text: `$ ${cmd}` }, ...output]);
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
          <p className="font-mono text-xs text-ink-soft">~/terminal — Ctrl+K to toggle</p>
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
