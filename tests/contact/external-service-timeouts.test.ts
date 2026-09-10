import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Resend } from "resend";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sendResendEmailWithTimeout } from "@/lib/contact/resend-mail";
import { verifyTurnstileToken } from "@/lib/contact/turnstile-verify";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("external service timeouts", () => {
  it("aborts Turnstile verification when Cloudflare does not respond", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let requestSignal: AbortSignal | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined;

        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    await expect(verifyTurnstileToken("token", null, 1)).resolves.toBe(false);
    expect(requestSignal?.aborted).toBe(true);
    expect(log).toHaveBeenCalled();
  });

  it("passes an abort signal and idempotency key to Resend", async () => {
    const send = vi.fn(
      async (
        _email: unknown,
        options: { idempotencyKey?: string; signal?: AbortSignal }
      ) => ({
        data: { id: "email-id" },
        error: null,
        headers: {},
        options,
      })
    );
    const resend = { emails: { send } } as unknown as Resend;

    await sendResendEmailWithTimeout(
      resend,
      {
        from: "info@candpluss.camp",
        to: "customer@example.com",
        subject: "Test",
        text: "Test",
      },
      "CTS-20260910-TEST:admin",
      100
    );

    expect(send).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        idempotencyKey: "CTS-20260910-TEST:admin",
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("uses the Resend timeout helper in both form APIs", () => {
    for (const routePath of [
      "app/api/contact/route.ts",
      "app/api/support-contact/route.ts",
    ]) {
      const routeSource = source(routePath);

      expect(routeSource).toContain("sendResendEmailWithTimeout");
      expect(routeSource).not.toContain("resend.emails.send({");
    }
  });
});
