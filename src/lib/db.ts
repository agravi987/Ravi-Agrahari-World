/**
 * db.ts — cached MongoDB connection singleton (plan S11d)
 * Serverless-safe pattern: reuse one connection across lambdas
 * (globalThis) and across Next dev hot-reloads (global.mongoose).
 * Without this, Vercel cold-starts would exhaust the free tier's
 * connection limit.
 */
import mongoose from "mongoose";

/** Read MONGODB_URI at call time, not module load.
 *  The old `const MONGODB_URI = process.env.MONGODB_URI` captured
 *  the value once at import; if the env var was set after the first
 *  import (e.g. .env loaded late, test setup), connectDb() saw
 *  undefined forever. */
function getUri(): string | undefined {
  return process.env.MONGODB_URI;
}

// Global cache survives dev hot-reloads (Next.js clears module scope
// but keeps globalThis). Explicit type keeps TS honest about the cache.
declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cache = (globalThis.mongooseCache ??= { conn: null, promise: null });

// Cooldown after a failed connect: once Mongo has proven unreachable, fall
// back to seed data without retrying for a while. Without this, every single
// request pays the full serverSelection timeout again (dev: no-DB stays fast).
let failedAt = 0;
const RETRY_AFTER_MS = 30_000;

/**
 * Returns the shared mongoose connection, connecting on first call.
 * Returns null when MONGODB_URI is absent (callers fall back to
 * seed data — plan D6/D1). Never throws for missing env.
 */
export async function connectDb(): Promise<typeof mongoose | null> {
  const uri = getUri();
  if (!uri) return null; // seed fallback mode (D6)
  if (cache.conn) return cache.conn;
  if (Date.now() - failedAt < RETRY_AFTER_MS) return null; // down → seed now
  if (!cache.promise) {
    cache.promise = mongoose
      // bufferCommands: false — when Mongo is down (no DB running),
      // model calls reject immediately instead of silently buffering
      // 10s per operation (this was adding ~15s of dead time to every
      // request without a database). Fallbacks (seed data) kick in fast.
      .connect(uri, {
        serverSelectionTimeoutMS: 4000,
        bufferCommands: false,
      })
      .catch((err) => {
        // Don't cache a dead promise — allow the next call to retry.
        cache.promise = null;
        failedAt = Date.now();
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/** True when the app is configured to read content from MongoDB. */
export function dbConfigured(): boolean {
  return Boolean(getUri());
}
