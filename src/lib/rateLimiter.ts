interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  timeToReset: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private requests: Map<string, RateLimitInfo>;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.requests = new Map();

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const info = this.requests.get(identifier);

    if (!info || now >= info.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true, timeToReset: 0 };
    }

    if (info.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        timeToReset: info.resetTime - now
      };
    }

    // Increment counter
    info.count++;
    return {
      allowed: true,
      timeToReset: 0
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, info] of this.requests.entries()) {
      if (now >= info.resetTime) {
        this.requests.delete(key);
      }
    }
  }
} 