/**
 * LoadingMessages.tsx (client) — cycles through a list of short,
 * on-brand phrases while something loads. Turns "waiting" into a
 * tiny moment of charm (Google/MNC touch), and never lies: every
 * phrase describes what is actually happening.
 */
"use client";

import { useEffect, useState } from "react";

export default function LoadingMessages({
  messages,
  interval = 1500,
}: {
  messages: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), interval);
    return () => clearInterval(t);
  }, [messages.length, interval]);

  return (
    <span key={index} className="animate-fade-up inline-block" aria-live="polite">
      {messages[index] ?? messages[0]}
    </span>
  );
}
