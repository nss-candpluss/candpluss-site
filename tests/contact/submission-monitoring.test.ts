import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { logContactSubmissionEvent } from "@/lib/contact/submission-monitoring";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("contact submission monitoring", () => {
  it("logs structured events without email addresses", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logContactSubmissionEvent("error", {
      event: "admin_mail_failed",
      formKind: "support",
      ticketNumber: "SPR-20260910-7K9M2P4R8T6W",
      recipientEmail: "admin@candpluss.camp",
      attachmentCount: 2,
      error: new Error("Delivery to customer@example.com failed"),
    });

    expect(log).toHaveBeenCalledWith(
      "[contact-monitor] Submission event",
      expect.objectContaining({
        event: "admin_mail_failed",
        formKind: "support",
        recipientDomain: "candpluss.camp",
        attachmentCount: 2,
        error: expect.stringContaining("[redacted-email]"),
      })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer@example.com"
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "admin@candpluss.camp"
    );
  });

  it("records accepted and failed delivery events in both APIs", () => {
    for (const routePath of [
      "app/api/contact/route.ts",
      "app/api/support-contact/route.ts",
    ]) {
      const routeSource = source(routePath);

      expect(routeSource).toContain('event: "admin_mail_failed"');
      expect(routeSource).toContain('event: "submission_accepted"');
      expect(routeSource).toContain("logContactSubmissionEvent");
    }
  });
});
