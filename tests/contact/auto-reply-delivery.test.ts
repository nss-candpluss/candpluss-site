import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deliverAutoReplyAfterAcceptance,
  type ContactTextEmail,
} from "@/lib/contact/auto-reply-delivery";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function createOptions(
  sendMail: (email: ContactTextEmail) => Promise<{ error?: unknown | null }>
) {
  return {
    formKind: "contact" as const,
    ticketNumber: "CTS-20260910-7K9M2P4R8T6W",
    recipientEmail: "customer@example.com",
    adminEmail: "admin@candpluss.camp",
    fromEmail: "C AND+S <info@candpluss.camp>",
    replyToEmail: "info@candpluss.camp",
    autoReplyMail: {
      subject: "お問い合わせを受け付けました",
      text: "自動返信本文",
    },
    sendMail,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deliverAutoReplyAfterAcceptance", () => {
  it("sends only the auto reply when delivery succeeds", async () => {
    const sent: ContactTextEmail[] = [];
    const result = await deliverAutoReplyAfterAcceptance(
      createOptions(async (email) => {
        sent.push(email);
        return { error: null };
      })
    );

    expect(result).toEqual({ autoReplySent: true, alertSent: false });
    expect(sent).toEqual([
      expect.objectContaining({
        to: "customer@example.com",
        subject: "お問い合わせを受け付けました",
      }),
    ]);
  });

  it("keeps the acceptance successful and alerts the admin when auto reply fails", async () => {
    const sent: ContactTextEmail[] = [];
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await deliverAutoReplyAfterAcceptance(
      createOptions(async (email) => {
        sent.push(email);
        return sent.length === 1
          ? {
              error: {
                message: "customer@example.com was rejected",
              },
            }
          : { error: null };
      })
    );

    expect(result).toEqual({ autoReplySent: false, alertSent: true });
    expect(sent).toHaveLength(2);
    expect(sent[1]).toMatchObject({
      to: "admin@candpluss.camp",
      replyTo: "info@candpluss.camp",
    });
    expect(sent[1]?.subject).toContain("CTS-20260910-7K9M2P4R8T6W");
    expect(sent[1]?.text).toContain("customer@example.com");
    expect(log).toHaveBeenCalledWith(
      "[contact-monitor] Submission event",
      expect.objectContaining({
        event: "auto_reply_failed",
        recipientDomain: "example.com",
        error: expect.stringContaining("[redacted-email]"),
      })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer@example.com"
    );
  });

  it("logs alert failure without throwing or retrying", async () => {
    let attempt = 0;
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await deliverAutoReplyAfterAcceptance(
      createOptions(async () => {
        attempt += 1;

        if (attempt === 1) {
          throw new Error("auto reply unavailable");
        }

        return { error: new Error("alert unavailable") };
      })
    );

    expect(result).toEqual({ autoReplySent: false, alertSent: false });
    expect(attempt).toBe(2);
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenLastCalledWith(
      "[contact-monitor] Submission event",
      expect.objectContaining({
        event: "auto_reply_alert_failed",
      })
    );
  });

  it("uses partial-success delivery in both API routes", () => {
    for (const routePath of [
      "app/api/contact/route.ts",
      "app/api/support-contact/route.ts",
    ]) {
      const routeSource = source(routePath);

      expect(routeSource).toContain("deliverAutoReplyAfterAcceptance");
      expect(routeSource).not.toContain("Auto reply mail failed");
      expect(routeSource.indexOf("Admin mail failed")).toBeLessThan(
        routeSource.indexOf("deliverAutoReplyAfterAcceptance({")
      );
      expect(routeSource.indexOf("deliverAutoReplyAfterAcceptance({")).toBeLessThan(
        routeSource.lastIndexOf("ok: true")
      );
    }
  });
});
