/**
 * Rate limiting utility for API endpoints
 * Prevents brute force attacks and abuse
 */

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given key (e.g., email, IP address)
 * @param key Unique identifier (email, IP, etc.)
 * @param maxAttempts Maximum attempts allowed
 * @param windowMs Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First attempt for this key
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (now > entry.resetTime) {
    // Window has expired, reset
    rateLimitStore.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  // Still in window
  if (entry.attempts < maxAttempts) {
    entry.attempts++;
    return true;
  }

  return false;
}

/**
 * Get remaining attempts for a key
 */
export function getRemainingAttempts(
  key: string,
  maxAttempts: number = 5
): number {
  const entry = rateLimitStore.get(key);
  if (!entry || Date.now() > entry.resetTime) {
    return maxAttempts;
  }
  return Math.max(0, maxAttempts - entry.attempts);
}

/**
 * Get reset time for a key (in seconds)
 */
export function getResetTime(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return 0;
  }
  const remaining = entry.resetTime - Date.now();
  return Math.ceil(remaining / 1000);
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
