import { NextResponse } from "next/server";

// In-memory rate limiting store
// Key format: "userId:action" or "ip:action"
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limiter that tracks requests per user/IP in a sliding window
 * @param identifier - Unique identifier (userId or IP address)
 * @param action - Action type (e.g., "create-game", "edit-game")
 * @param config - Rate limit configuration
 * @returns Response with 429 status if rate limited, null otherwise
 */
export function checkRateLimit(
  identifier: string | null,
  action: string,
  config: RateLimitConfig
): NextResponse | null {
  if (!identifier) {
    // If no identifier, we can't rate limit effectively
    return null;
  }

  const key = `${identifier}:${action}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // No entry or entry expired - create new one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null;
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many ${action} requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      }
    );
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return null;
}

/**
 * Get IP address from request
 */
export function getClientIp(request: Request): string | null {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  CREATE_GAME: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  EDIT_GAME: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  GENERATE_GAME: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
};

