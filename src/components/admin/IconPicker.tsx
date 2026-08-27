/**
 * IconPicker.tsx (client) — icon field with live preview + searchable browse popover.
 *
 * Solves the "I don't know what key to type" problem for skill icons
 * and galaxy planet icons. Shows a live preview of the Lucide icon or
 * emoji as the user types, plus a "Browse" button that opens a grid of
 * curated Lucide icons with search.
 *
 * Two modes:
 *  - "lucide"  — skill.icon: only Lucide icon keys
 *  - "emoji"   — galaxyPlanet.icon: emoji or Lucide key (both valid)
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { icons as lucideIcons, type LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Curated icon set — ~120 icons most relevant for a portfolio site.  */
/*  The full set is searchable via the search input.                   */
/* ------------------------------------------------------------------ */
const CURATED_KEYS = [
  // Cloud & infra
  "Cloud", "CloudCog", "CloudDownload", "Server", "Database", "HardDrive",
  "Container", "Globe", "Globe2", "Network", "Wifi", "Signal",
  // Dev & code
  "Code", "Code2", "Terminal", "Braces", "Brackets", "FileCode",
  "FileCode2", "Hash", "Bug", "TestTube", "TestTube2", "Gauge",
  // AI & data
  "Bot", "Brain", "BrainCircuit", "Sparkles", "Sparkle", "Workflow",
  "Orchestrator", "LineChart", "BarChart3", "PieChart", "Table",
  // DevOps & tools
  "Wrench", "Screwdriver", "Settings", "Settings2", "Cog", "Cog6Tooth",
  "Gears", "Hammer", "Pliers", "Nut", "Bolt", "Tool",
  // Security
  "Shield", "ShieldCheck", "ShieldAlert", "Lock", "LockOpen", "Key",
  "Fingerprint", "Scan",
  // Communication
  "Mail", "MessageSquare", "MessageCircle", "Send", "Bell", "Megaphone",
  "Radio", "Phone", "Video",
  // Files & content
  "FileText", "File", "Folder", "FolderGit2", "BookOpen", "BookMarked",
  "Library", "Newspaper", "Scroll", "StickyNote", "PenTool", "Pencil",
  // Design & media
  "Palette", "Paintbrush", "Image", "Camera", "Film", "Music",
  "Mic", "Headphones", "Monitor", "MonitorSpeaker", "Tv", "Smartphone",
  // Business & people
  "Users", "User", "UserCheck", "Building", "Building2", "Factory",
  "GraduationCap", "Award", "Trophy", "Medal", "Star", "Heart",
  // Navigation & UI
  "ArrowUpRight", "ExternalLink", "Link", "Share2", "Copy", "QrCode",
  "Compass", "Map", "MapPin", "Navigation", "Waypoint",
  // Status & actions
  "Check", "CheckCircle", "XCircle", "AlertTriangle", "Info",
  "Zap", "Flame", "Rocket", "Launch", "Power", "RefreshCw",
  "RotateCw", "Download", "Upload", "RefreshCcw",
  // Misc useful
  "Clock", "Timer", "Calendar", "Layers", "Box", "Cube",
  "Hexagon", "Triangle", "Circle", "Diamond", "Pentagon",
  "Truck", "Package", "ShoppingCart", "CreditCard", "Wallet",
  "PieChart", "Target", "Crosshair", "Focus", "ScanEye",
] as const;

type IconEntry = { name: string; icon: LucideIcon };

/** Build the curated list once (module level). */
const CURATED: IconEntry[] = CURATED_KEYS
  .map((name) => ({ name, icon: (lucideIcons as Record<string, LucideIcon>)[name] }))
  .filter((e) => e.icon != null);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface IconPickerProps {
  value: string;
  onChange: (v: string) => void;
  /** "lucide" = only Lucide keys; "emoji" = emoji or Lucide key. */
  mode?: "lucide" | "emoji";
  inputClasses: string;
  id: string;
}

export default function IconPicker({
  value,
  onChange,
  mode = "lucide",
  inputClasses,
  id,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close popover on outside click.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  /** Try to resolve the current value as a Lucide icon. */
  const LucidePreview = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return (lucideIcons as Record<string, LucideIcon | undefined>)[trimmed] ?? null;
  }, [value]);

  /** Is the current value a valid emoji? (rough check: non-ASCII or emoji Unicode ranges) */
  const isEmoji = mode === "emoji" && value.trim() && /\p{Emoji}/u.test(value.trim());

  /** Filtered icon list for the browse grid. */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!q) return CURATED;
    return CURATED.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.name.replace(/([A-Z])/g, "$1").toLowerCase().includes(q)
    );
  }, [query]);

  const handlePick = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
      setQuery("");
      // Re-focus the input so the user can continue typing.
      inputRef.current?.focus();
    },
    [onChange]
  );

  return (
    <div className="relative">
      <div className="flex items-stretch gap-2">
        {/* Live preview pill */}
        <span
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-card border border-card-border bg-paper-deep text-lg"
          aria-hidden="true"
        >
          {LucidePreview ? (
            <LucidePreview className="h-5 w-5 text-ink" />
          ) : isEmoji ? (
            <span className="text-xl leading-none">{value.trim()}</span>
          ) : (
            <span className="text-xs text-ink-faint">—</span>
          )}
        </span>

        {/* Text input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClasses} flex-1`}
          placeholder={mode === "emoji" ? "☁️ or cloud" : "cloud"}
        />

        {/* Browse button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-card border border-card-border bg-card px-3 text-xs font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
          title="Browse icons"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Browse
        </button>
      </div>

      {/* Browse popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-card border border-card-border bg-card shadow-pop"
          role="dialog"
          aria-label="Browse icons"
        >
          {/* Search header */}
          <div className="flex items-center gap-2 border-b border-card-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons…"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-ink-faint hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Icon grid */}
          <div className="max-h-72 overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-faint">
                No icons match &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
                {filtered.map((entry) => {
                  const Icon = entry.icon;
                  const isActive = value === entry.name;
                  return (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={() => handlePick(entry.name)}
                      title={entry.name}
                      className={`group relative flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                        isActive
                          ? "bg-accent-soft text-accent ring-2 ring-accent/30"
                          : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="w-full truncate text-center text-[9px] leading-tight text-ink-faint group-hover:text-ink-soft">
                        {entry.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-card-border px-3 py-2">
            <p className="text-[10px] text-ink-faint">
              {mode === "emoji"
                ? "Type an emoji or a Lucide icon key. All 1,700+ Lucide icons are supported."
                : "Type any Lucide icon key. Click to select, or keep typing."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
