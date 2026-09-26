// ponytail: in-memory fixed window; fine for a single Render instance. Move to Redis/KV if the API scales out.
const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns seconds to wait if `key` is over `max` requests per `windowMs`, otherwise null. */
export function rateLimit(key: string, max = 120, windowMs = 60_000, now = Date.now()): number | null {
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  entry.count++;
  return entry.count > max ? Math.ceil((entry.resetAt - now) / 1000) : null;
}
