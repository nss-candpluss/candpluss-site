import { createHmac } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMIT_TIMEOUT_MS = 3000;

export const CONTACT_RATE_LIMITS = {
  window: "10 m",
  ipRequests: 5,
  emailRequests: 3,
} as const;

export const CONTACT_RATE_LIMIT_MESSAGE =
  "送信回数が上限に達しました。10分ほど時間をおいて再度お試しください。";

type RateLimitResponse = {
  success: boolean;
  reset: number;
  reason?: "timeout" | "cacheBlock" | "denyList";
};

export type ContactRateLimiter = {
  limit(identifier: string): Promise<RateLimitResponse>;
};

export type ContactRateLimitDependencies = {
  hashSecret: string;
  ipLimiter: ContactRateLimiter;
  emailLimiter: ContactRateLimiter;
};

type ContactRateLimitInput = {
  ipAddress: string | null;
  email: string;
};

export type ContactRateLimitResult =
  | {
      allowed: true;
      retryAfterSeconds: null;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
      limitedBy: "ip" | "email" | "both";
    };

let cachedDependencies: ContactRateLimitDependencies | null | undefined;

function createProductionDependencies(): ContactRateLimitDependencies | null {
  if (cachedDependencies !== undefined) {
    return cachedDependencies;
  }

  const url = (
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  )?.trim();
  const token = (
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  )?.trim();
  const hashSecret = process.env.CONTACT_RATE_LIMIT_HASH_SECRET?.trim();

  if (!url || !token || !hashSecret) {
    const missingVariables = [
      !url ? "UPSTASH_REDIS_REST_URL or KV_REST_API_URL" : null,
      !token ? "UPSTASH_REDIS_REST_TOKEN or KV_REST_API_TOKEN" : null,
      !hashSecret ? "CONTACT_RATE_LIMIT_HASH_SECRET" : null,
    ].filter((value): value is string => value !== null);

    console.error("[contact-rate-limit] Configuration unavailable", {
      event: "rate_limit_unconfigured",
      missingVariables,
    });
    cachedDependencies = null;
    return cachedDependencies;
  }

  const redis = new Redis({
    url,
    token,
    enableTelemetry: false,
  });

  cachedDependencies = {
    hashSecret,
    ipLimiter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        CONTACT_RATE_LIMITS.ipRequests,
        CONTACT_RATE_LIMITS.window
      ),
      analytics: false,
      prefix: "candpluss:contact-rate-limit:ip",
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    emailLimiter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        CONTACT_RATE_LIMITS.emailRequests,
        CONTACT_RATE_LIMITS.window
      ),
      analytics: false,
      prefix: "candpluss:contact-rate-limit:email",
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
  };

  return cachedDependencies;
}

function hashIdentifier(
  type: "ip" | "email",
  value: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`${type}:${value}`)
    .digest("hex");
}

function calculateRetryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

function logUnavailable(scope: "ip" | "email", error?: unknown): void {
  console.error("[contact-rate-limit] Check unavailable", {
    event: "rate_limit_unavailable",
    scope,
    ...(error
      ? { errorType: error instanceof Error ? error.name : typeof error }
      : {}),
  });
}

export async function checkContactRateLimit(
  input: ContactRateLimitInput,
  dependencies: ContactRateLimitDependencies | null = createProductionDependencies()
): Promise<ContactRateLimitResult> {
  if (!dependencies) {
    return { allowed: true, retryAfterSeconds: null };
  }

  const checks: Array<{
    scope: "ip" | "email";
    promise: Promise<RateLimitResponse>;
  }> = [];

  if (input.ipAddress) {
    checks.push({
      scope: "ip",
      promise: dependencies.ipLimiter.limit(
        hashIdentifier("ip", input.ipAddress.trim(), dependencies.hashSecret)
      ),
    });
  }

  checks.push({
    scope: "email",
    promise: dependencies.emailLimiter.limit(
      hashIdentifier(
        "email",
        input.email.trim().toLowerCase(),
        dependencies.hashSecret
      )
    ),
  });

  const settledChecks = await Promise.allSettled(
    checks.map(({ promise }) => promise)
  );
  const limitedScopes: Array<{
    scope: "ip" | "email";
    reset: number;
  }> = [];

  settledChecks.forEach((result, index) => {
    const scope = checks[index]?.scope;

    if (!scope) {
      return;
    }

    if (result.status === "rejected") {
      logUnavailable(scope, result.reason);
      return;
    }

    if (result.value.reason === "timeout") {
      logUnavailable(scope);
    }

    if (!result.value.success) {
      limitedScopes.push({ scope, reset: result.value.reset });
    }
  });

  if (limitedScopes.length === 0) {
    return { allowed: true, retryAfterSeconds: null };
  }

  const retryAfterSeconds = Math.max(
    ...limitedScopes.map(({ reset }) => calculateRetryAfterSeconds(reset))
  );
  const limitedBy =
    limitedScopes.length === 2 ? "both" : limitedScopes[0]?.scope ?? "email";

  return {
    allowed: false,
    retryAfterSeconds,
    limitedBy,
  };
}
