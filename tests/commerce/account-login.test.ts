import { describe, expect, it } from "vitest";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  loginHintFromEmail,
  resolveCustomerAccountCallbackUrl,
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

describe("resolveCustomerAccountCallbackUrl", () => {
  const productionCallback = "https://candpluss.camp/account/authorize";

  it("keeps the production callback on the public origin", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "https://candpluss.camp/account/login/start"
      )
    ).toBe(productionCallback);
  });

  it("returns to localhost so local login cookies stay on the same origin", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "http://localhost:3000/shopify-test/account"
      )
    ).toBe("http://localhost:3000/account/authorize");
  });

  it("returns to the ngrok origin so tunnel login can complete", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "https://mosaic-lubricate-salute.ngrok-free.dev/shopify-test/account"
      )
    ).toBe(
      "https://mosaic-lubricate-salute.ngrok-free.dev/account/authorize"
    );
  });

  it("prefers forwarded host when ngrok keeps request.url on localhost", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "http://localhost:3000/account/login/start",
        new Headers({
          "x-forwarded-host": "mosaic-lubricate-salute.ngrok-free.dev",
          "x-forwarded-proto": "https",
        })
      )
    ).toBe(
      "https://mosaic-lubricate-salute.ngrok-free.dev/account/authorize"
    );
  });
});
