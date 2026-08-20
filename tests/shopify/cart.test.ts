import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCart } from "@/lib/shopify/cart";

describe("Shopify Cart API", () => {
  beforeEach(() => {
    process.env.SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = "private-token";
    process.env.SHOPIFY_STOREFRONT_API_VERSION = "2026-07";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a cart with the selected variant and forwards buyer IP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            cartCreate: {
              cart: {
                id: "gid://shopify/Cart/1",
                checkoutUrl: "https://example.myshopify.com/checkouts/1",
                totalQuantity: 1,
                cost: {
                  subtotalAmount: { amount: "1000", currencyCode: "JPY" },
                  totalAmount: { amount: "1000", currencyCode: "JPY" },
                },
                lines: { nodes: [] },
              },
              userErrors: [],
              warnings: [],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const cart = await createCart(
      "gid://shopify/ProductVariant/1",
      2,
      "203.0.113.10"
    );

    expect(cart.id).toBe("gid://shopify/Cart/1");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.headers).toMatchObject({
      "Shopify-Storefront-Private-Token": "private-token",
      "Shopify-Storefront-Buyer-IP": "203.0.113.10",
    });
    expect(JSON.parse(String(request.body)).variables).toEqual({
      input: {
        lines: [
          {
            merchandiseId: "gid://shopify/ProductVariant/1",
            quantity: 2,
          },
        ],
      },
    });
  });
});
