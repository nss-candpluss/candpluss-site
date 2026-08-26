import { describe, expect, it } from "vitest";

import { shopifyCheckoutUrl } from "@/lib/commerce/checkout-url";

describe("shopifyCheckoutUrl", () => {
  it("returns the checkout URL unchanged when the customer is logged out", () => {
    expect(
      shopifyCheckoutUrl("https://example.myshopify.com/checkouts/1", false)
    ).toBe("https://example.myshopify.com/checkouts/1");
  });

  it("adds silent SSO for logged-in customers", () => {
    expect(
      shopifyCheckoutUrl("https://example.myshopify.com/checkouts/1", true)
    ).toBe("https://example.myshopify.com/checkouts/1?sso=silent");
  });
});
