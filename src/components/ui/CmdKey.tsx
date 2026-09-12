/**
 * CmdKey.tsx (client) — the ⌘K / Ctrl K chip (P7).
 * The macOS canvas key is "⌘K"; Windows/Linux users actually press
 * Ctrl+K. Since the footer and header hint text is server-rendered,
 * this chip renders a platform-appropriate label AFTER mount without
 * ever hydrating a mismatch: first paint shows "⌘K" (SSR-safe), an
 * rAF effect swaps to "Ctrl K" on non-Mac platforms.
 */
"use client";

import { useEffect, useState } from "react";
import Kbd from "./Kbd";

export default function CmdKey() {
  const [label, setLabel] = useState("⌘K");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (typeof navigator !== "undefined" && !/mac/i.test(navigator.platform)) {
        setLabel("Ctrl K");
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return <Kbd>{label}</Kbd>;
}