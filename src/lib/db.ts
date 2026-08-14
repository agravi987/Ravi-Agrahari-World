/**
 * db.ts — cached MongoDB connection singleton (plan S11d)
 * Serverless-safe pattern: reuse one connection across lambdas
 * (globalThis) and across Next dev hot-reloads (global.mongoose).
 * Without this, Vercel cold-starts would exhaust the free tier's
 * connection limit.
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Global cache survives dev hot-reloads (Next.js clears module scope
// but keeps globalThis). Explicit type keeps TS honest about the cache.
declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cache = (globalThis.mongooseCache ??= { conn: null, promise: null });

/**
 * Returns the shared mongoose connection, connecting on first call.
 * Returns null when MONGODB_URI is absent (callers fall back to
 * seed data — plan D6/D1). Never throws for missing env.
 */
export async function connectDb(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) return null; // seed fallback mode (D6)
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
      .then((m) => m)
      .catch((err) => {
        // Don't cache a dead promise — allow the next call to retry.
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/** True when the app is configured to read content from MongoDB. */
export function dbConfigured(): boolean {
  return Boolean(MONGODB_URI);
}
