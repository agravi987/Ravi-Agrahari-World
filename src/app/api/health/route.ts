/**
 * api/health/route.ts — minimal uptime/readiness probe.
 * Public on purpose: /health is a monitoring endpoint, not a security
 * boundary (it exposes no data and no admin surface). Returns JSON
 * with Mongo connectivity so uptime monitors / Vercel crons can tell
 * \"app is up\" apart from \"app is up AND the DB is reachable\". Always
 * 200 when the process is alive — liveness is the primary signal.
 */
import { NextResponse } from "next/server";
import { connectDb, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = dbConfigured();
  let connected = false;
  if (configured) {
    try {
      const mongoose = await connectDb();
      connected = Boolean(mongoose);
    } catch {
      connected = false;
    }
  }
  return NextResponse.json(
    {
      ok: true,
      dbConfigured: configured,
      dbConnected: connected,
      time: new Date().toISOString(),
    },
    { status: 200 }
  );
}
