/**
 * api/contact/route.ts — Phase 13 contact inbox (server, public).
 * The site's contact form POSTs here; the message lands in the CMS
 * "Message" collection (admin reads it, flips `read`, deletes).
 *
 * Safety + grace:
 *  - Honeypot: a hidden "company" field — bots fill it, humans never
 *    see it. A filled honeypot gets a polite 200 and NO storage.
 *  - Rate limit: in-memory per-IP (5 msgs / 10 min). A portfolio's
 *    traffic is tiny; this just stops casual spam. Vercel keeps the
 *    module alive per lambda — good enough, documented, no deps.
 *  - No MongoDB configured → 503, so the client falls back to mailto
 *    (the site never depends on this endpoint being up).
 */
import { NextResponse } from "next/server";
import { connectDb, dbConfigured } from "@/lib/db";
import { getMessageModel } from "@/models";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* --- per-IP rate limit: Map<ip, number[]> of timestamps ----------- */
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function ipOf(request: Request): string {
  // x-forwarded-for is proxy-APPENDED left→right (client, proxy1, …). The
  // rightmost entry is the one the closest trusted proxy added; the
  // leftmost is client-controlled and spoofable. Taking the LAST entry
  // means a spammer can't reset the counter by sending their own header.
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "local";
}

/** Opportunistic prune so the Map can't grow forever (scanner traffic
 *  sends endless spoofed IPs — each needs an entry). Runs only when
 *  the map is large, and only drops fully-expired windows. */
function pruneHits(now: number) {
  if (hits.size < 10_000) return;
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  pruneHits(now);
  return false;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: pretend success, store nothing.
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 254);
  const subject = String(body.subject ?? "").trim().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 2000);

  const invalid: string[] = [];
  if (name.length < 2) invalid.push("name");
  if (!EMAIL_RE.test(email)) invalid.push("email");
  if (subject.length < 3) invalid.push("subject");
  if (message.length < 10) invalid.push("message");
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid fields: ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  const ip = ipOf(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "You're sending messages too quickly — try again in a few minutes." },
      { status: 429 }
    );
  }

  // No Mongo → tell the client to fall back to mailto (503).
  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "Contact backend is unavailable — the form will open your mail app instead." },
      { status: 503 }
    );
  }

  const mongoose = await connectDb();
  if (!mongoose) {
    return NextResponse.json(
      { error: "Contact backend is unavailable — the form will open your mail app instead." },
      { status: 503 }
    );
  }

  try {
    await getMessageModel().create({ name, email, subject, message, read: false });
  } catch {
    return NextResponse.json(
      { error: "Could not save your message — the form will open your mail app instead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
