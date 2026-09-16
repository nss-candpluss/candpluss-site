import { describe, expect, it } from "vitest";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  loginHintFromEmail,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";

describe("会員画面の置き場所", () => {
  // 公開ページの購入を止めている間はテスト領域だけに置く
  it("テスト領域を指す", () => {
    expect(ACCOUNT_BASE_PATH).toBe("/shopify-test/account");
    expect(ACCOUNT_LOGIN_PATH).toBe("/shopify-test/account/login");
  });
});

describe("safeAccountReturnTo", () => {
  it("allows same-origin relative paths", () => {
    expect(safeAccountReturnTo("/shopify-test/cart")).toBe("/shopify-test/cart");
  });

  it("rejects protocol-relative and missing values", () => {
    expect(safeAccountReturnTo("//evil.example")).toBe(ACCOUNT_BASE_PATH);
    expect(safeAccountReturnTo("https://evil.example")).toBe(ACCOUNT_BASE_PATH);
    expect(safeAccountReturnTo(undefined)).toBe(ACCOUNT_BASE_PATH);
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
