// ponytail: in-memory fixed window; fine for a single Render instance. Move to Redis/KV if the API scales out.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns seconds to wait if `key` is over the limit, otherwise null. */
export function rateLimit(key: string, now = Date.now()): number | null {
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS ? Math.ceil((entry.resetAt - now) / 1000) : null;
}
