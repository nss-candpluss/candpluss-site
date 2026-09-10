import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readContactTicketNumber,
  writeContactTicketNumber,
} from "@/lib/contact/ticket-storage";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const storage = new Map<string, string>();

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("contact ticket storage", () => {
  it("stores Contact and Support ticket numbers separately", () => {
    const contactTicket = "CTS-20260910-7K9M2P4R8T6W";
    const supportTicket = "SPR-20260910-8K9M2P4R7T6W";

    writeContactTicketNumber("contact", contactTicket);
    writeContactTicketNumber("support", supportTicket);

    expect(readContactTicketNumber("contact")).toBe(contactTicket);
    expect(readContactTicketNumber("support")).toBe(supportTicket);
  });

  it("does not display malformed or mismatched ticket numbers", () => {
    writeContactTicketNumber("contact", "SPR-20260910-7K9M2P4R8T6W");
    writeContactTicketNumber("support", "<script>alert(1)</script>");

    expect(readContactTicketNumber("contact")).toBeNull();
    expect(readContactTicketNumber("support")).toBeNull();
  });

  it("writes API results but does not render ticket numbers on thanks pages", () => {
    expect(source("sections/contact/ContactConfirm.tsx")).toContain(
      'writeContactTicketNumber("contact", result.ticketNumber)'
    );
    expect(source("sections/support/SupportContactConfirm.tsx")).toContain(
      'writeContactTicketNumber("support", result.ticketNumber)'
    );
    expect(source("sections/contact/ContactThanks.tsx")).not.toContain(
      "ContactTicketNumber"
    );
    expect(source("sections/support/SupportContactThanks.tsx")).not.toContain(
      "ContactTicketNumber"
    );
  });
});
