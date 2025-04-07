import type { VercelRequest, VercelResponse } from '@vercel/node';

const rateLimit = new Map<string, { timestamp: number; count: number }>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 5;

export function checkRateLimit(req: VercelRequest): { limited: boolean; resetTime?: number } {
  const ip = req.headers['x-forwarded-for'] as string || 'unknown';
  const now = Date.now();
  const windowData = rateLimit.get(ip);

  if (!windowData) {
    rateLimit.set(ip, { timestamp: now, count: 1 });
    return { limited: false };
  }

  const windowStart = windowData.timestamp;
  const windowEnd = windowStart + WINDOW_MS;

  if (now > windowEnd) {
    // Reset window
    rateLimit.set(ip, { timestamp: now, count: 1 });
    return { limited: false };
  }

  if (windowData.count >= MAX_REQUESTS) {
    return { limited: true, resetTime: windowEnd };
  }

  windowData.count++;
  rateLimit.set(ip, windowData);
  return { limited: false };
}

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimit.entries()) {
    if (now - data.timestamp > WINDOW_MS) {
      rateLimit.delete(ip);
    }
  }
}, WINDOW_MS); 