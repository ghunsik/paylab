type TokenBucketOptions = {
  capacity: number;
  refillPerSecond: number;
};

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillPerMillisecond: number;
  private tokens: number;
  private lastRefillAt: number;

  constructor(options: TokenBucketOptions, now = Date.now()) {
    if (options.capacity <= 0 || options.refillPerSecond <= 0) {
      throw new RangeError("Token bucket values must be positive.");
    }

    this.capacity = options.capacity;
    this.refillPerMillisecond = options.refillPerSecond / 1_000;
    this.tokens = options.capacity;
    this.lastRefillAt = now;
  }

  tryConsume(now = Date.now()): boolean {
    const elapsed = Math.max(0, now - this.lastRefillAt);
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillPerMillisecond,
    );
    this.lastRefillAt = Math.max(this.lastRefillAt, now);

    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }

  retryAfterSeconds(): number {
    if (this.tokens >= 1) return 0;
    return Math.max(1, Math.ceil((1 - this.tokens) / this.refillPerMillisecond / 1_000));
  }
}

// Isolate-wide, best-effort protection without IP addresses, cookies, or user identifiers.
export const analyticsRateLimiter = new TokenBucket({
  capacity: 120,
  refillPerSecond: 2,
});
