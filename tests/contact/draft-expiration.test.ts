import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CONTACT_DRAFT_TTL_MS,
  parseExpiringDraft,
  serializeExpiringDraft,
} from "@/lib/contact/draft-expiration";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function normalizeName(value: unknown): { name: string } | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  ) {
    return { name: value.name };
  }

  return null;
}

describe("contact draft expiration", () => {
  it("keeps a draft for 24 hours", () => {
    expect(CONTACT_DRAFT_TTL_MS).toBe(24 * 60 * 60 * 1_000);
    const raw = serializeExpiringDraft({ name: "山田" }, 1_000);

    expect(
      parseExpiringDraft(raw, normalizeName, 1_000 + CONTACT_DRAFT_TTL_MS - 1)
    ).toEqual({ name: "山田" });
  });

  it("rejects expired, malformed, and legacy drafts", () => {
    const raw = serializeExpiringDraft({ name: "山田" }, 1_000);

    expect(
      parseExpiringDraft(raw, normalizeName, 1_000 + CONTACT_DRAFT_TTL_MS)
    ).toBeNull();
    expect(parseExpiringDraft("invalid-json", normalizeName)).toBeNull();
    expect(
      parseExpiringDraft(JSON.stringify({ name: "legacy" }), normalizeName)
    ).toBeNull();
  });

  it("expires both forms and Support attachments when the session ends", () => {
    for (const path of [
      "lib/contact/form-storage.ts",
      "lib/support-contact/form-storage.ts",
    ]) {
      const storageSource = source(path);

      expect(storageSource).toContain("window.sessionStorage");
      expect(storageSource).toContain("serializeExpiringDraft");
      expect(storageSource).toContain("parseExpiringDraft");
    }

    const attachmentStoreSource = source(
      "lib/support-contact/attachment-store.ts"
    );
    expect(attachmentStoreSource).toContain(
      "expiresAt: Date.now() + CONTACT_DRAFT_TTL_MS"
    );
    expect(attachmentStoreSource).toContain(
      "stored.expiresAt <= Date.now()"
    );
    expect(attachmentStoreSource).toContain("ATTACHMENT_SESSION_KEY");
    expect(attachmentStoreSource).toContain(
      "stored.sessionId !== sessionId"
    );
  });
});
