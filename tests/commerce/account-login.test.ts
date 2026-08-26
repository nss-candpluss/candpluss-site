import { describe, expect, it } from "vitest";

import {
  loginHintFromEmail,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";

describe("safeAccountReturnTo", () => {
  it("allows same-origin relative paths", () => {
    expect(safeAccountReturnTo("/cart")).toBe("/cart");
  });

  it("rejects protocol-relative and missing values", () => {
    expect(safeAccountReturnTo("//evil.example")).toBe("/account");
    expect(safeAccountReturnTo("https://evil.example")).toBe("/account");
    expect(safeAccountReturnTo(undefined)).toBe("/account");
  });
});

describe("loginHintFromEmail", () => {
  it("returns a trimmed email", () => {
    expect(loginHintFromEmail("  member@example.com  ")).toBe(
      "member@example.com"
    );
  });

  it("ignores invalid values", () => {
    expect(loginHintFromEmail("not-an-email")).toBeUndefined();
    expect(loginHintFromEmail("")).toBeUndefined();
  });
});
