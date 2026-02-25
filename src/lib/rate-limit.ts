// Simple in-memory rate limiter with TTL cleanup

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup stale entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, entry] of store) {
        if (now >= entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000);
  // Allow Node to exit even if interval is active
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

export function rateLimit(opts: {
  /** Unique name for this limiter (e.g. "register", "login") */
  name: string;
  /** Max number of requests in the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}): {
  check: (key: string) => { allowed: boolean; remaining: number };
  peek: (key: string) => { remaining: number };
} {
  if (!stores.has(opts.name)) {
    stores.set(opts.name, new Map());
  }
  const store = stores.get(opts.name)!;
  ensureCleanup();

  return {
    check(key: string) {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { allowed: true, remaining: opts.max - 1 };
      }

      entry.count++;
      if (entry.count > opts.max) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: opts.max - entry.count };
    },
    peek(key: string) {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || now >= entry.resetAt) {
        return { remaining: opts.max };
      }
      return { remaining: Math.max(0, opts.max - entry.count) };
    },
  };
}
