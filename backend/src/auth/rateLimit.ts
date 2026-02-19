const bucket = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export const allowMagicLinkStart = (key: string, now = Date.now()): boolean => {
  const item = bucket.get(key);
  if (!item || now - item.windowStart > WINDOW_MS) {
    bucket.set(key, { count: 1, windowStart: now });
    return true;
  }

  item.count += 1;
  return item.count <= MAX_REQUESTS;
};

export const resetRateLimits = (): void => {
  bucket.clear();
};
