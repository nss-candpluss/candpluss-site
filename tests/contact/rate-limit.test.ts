import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkContactRateLimit,
  CONTACT_RATE_LIMITS,
  type ContactRateLimitDependencies,
  type ContactRateLimiter,
} from "@/lib/contact/rate-limit";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function createLimiter(
  handler: (identifier: string) => {
    success: boolean;
    reset: number;
    reason?: "timeout" | "cacheBlock" | "denyList";
  }
): ContactRateLimiter & { identifiers: string[] } {
  const identifiers: string[] = [];

  return {
    identifiers,
    async limit(identifier) {
      identifiers.push(identifier);
      return handler(identifier);
    },
  };
}

function createDependencies(
  ipLimiter: ContactRateLimiter,
  emailLimiter: ContactRateLimiter
): ContactRateLimitDependencies {
  return {
    hashSecret: "test-secret-with-at-least-32-characters",
    ipLimiter,
    emailLimiter,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("contact API rate limit", () => {
  it("defines the shared 10-minute IP and email limits", () => {
    expect(CONTACT_RATE_LIMITS).toEqual({
      window: "10 m",
      ipRequests: 5,
      emailRequests: 3,
    });
  });

  it("hashes IP and normalized email without exposing either value", async () => {
    const ipLimiter = createLimiter(() => ({
      success: true,
      reset: Date.now() + 60_000,
    }));
    const emailLimiter = createLimiter(() => ({
      success: true,
      reset: Date.now() + 60_000,
    }));
    const dependencies = createDependencies(ipLimiter, emailLimiter);

    await checkContactRateLimit(
      { ipAddress: "203.0.113.10", email: " User@Example.com " },
      dependencies
    );
    await checkContactRateLimit(
      { ipAddress: "203.0.113.10", email: "user@example.com" },
      dependencies
    );

    expect(ipLimiter.identifiers[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(emailLimiter.identifiers[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ipLimiter.identifiers[0]).not.toContain("203.0.113.10");
    expect(emailLimiter.identifiers[0]).not.toContain("example.com");
    expect(ipLimiter.identifiers[0]).toBe(ipLimiter.identifiers[1]);
    expect(emailLimiter.identifiers[0]).toBe(emailLimiter.identifiers[1]);
  });

  it("checks only email when the client IP is unavailable", async () => {
    const ipLimiter = createLimiter(() => ({
      success: true,
      reset: Date.now() + 60_000,
    }));
    const emailLimiter = createLimiter(() => ({
      success: true,
      reset: Date.now() + 60_000,
    }));

    const result = await checkContactRateLimit(
      { ipAddress: null, email: "user@example.com" },
      createDependencies(ipLimiter, emailLimiter)
    );

    expect(result).toEqual({ allowed: true, retryAfterSeconds: null });
    expect(ipLimiter.identifiers).toHaveLength(0);
    expect(emailLimiter.identifiers).toHaveLength(1);
  });

  it("returns the longest retry period when both limits are reached", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    const ipLimiter = createLimiter(() => ({
      success: false,
      reset: 31_000,
    }));
    const emailLimiter = createLimiter(() => ({
      success: false,
      reset: 61_000,
    }));

    const result = await checkContactRateLimit(
      { ipAddress: "203.0.113.10", email: "user@example.com" },
      createDependencies(ipLimiter, emailLimiter)
    );

    expect(result).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
      limitedBy: "both",
    });
  });

  it("fails open and logs no personal data when Upstash is unavailable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ipLimiter: ContactRateLimiter = {
      async limit() {
        throw new Error("Redis unavailable for user@example.com at 203.0.113.10");
      },
    };
    const emailLimiter = createLimiter(() => ({
      success: true,
      reset: Date.now() + 60_000,
      reason: "timeout",
    }));

    const result = await checkContactRateLimit(
      { ipAddress: "203.0.113.10", email: "user@example.com" },
      createDependencies(ipLimiter, emailLimiter)
    );
    const serializedLogs = JSON.stringify(log.mock.calls);

    expect(result).toEqual({ allowed: true, retryAfterSeconds: null });
    expect(log).toHaveBeenCalledTimes(2);
    expect(serializedLogs).not.toContain("user@example.com");
    expect(serializedLogs).not.toContain("203.0.113.10");
  });

  it("applies the shared check after Turnstile and before mail in both routes", () => {
    for (const routePath of [
      "app/api/contact/route.ts",
      "app/api/support-contact/route.ts",
    ]) {
      const routeSource = source(routePath);

      expect(routeSource).toContain("checkContactRateLimit({");
      expect(routeSource).toContain("status: 429");
      expect(routeSource).toContain('"Retry-After"');
      expect(routeSource.indexOf("turnstileVerified")).toBeLessThan(
        routeSource.indexOf("checkContactRateLimit({")
      );
      expect(routeSource.indexOf("checkContactRateLimit({")).toBeLessThan(
        routeSource.indexOf("const envConfig = getContactEnvConfig();")
      );
    }
  });

  it("documents every required rate-limit environment variable", () => {
    const envExample = source(".env.example");

    expect(envExample).toContain("UPSTASH_REDIS_REST_URL=");
    expect(envExample).toContain("UPSTASH_REDIS_REST_TOKEN=");
    expect(envExample).toContain("KV_REST_API_URL=");
    expect(envExample).toContain("KV_REST_API_TOKEN=");
    expect(envExample).toContain("CONTACT_RATE_LIMIT_HASH_SECRET=");
    expect(source("lib/contact/rate-limit.ts")).toContain(
      "process.env.KV_REST_API_URL"
    );
    expect(source("lib/contact/rate-limit.ts")).toContain(
      "process.env.KV_REST_API_TOKEN"
    );
  });
});
