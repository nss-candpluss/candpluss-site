import { afterEach, describe, expect, it, vi } from "vitest";

import { INVOICE_ORDER_FIELDS, type CustomerAccountInvoiceOrder } from "@/lib/invoice/customer-account-order";

const fetchCustomerInvoiceOrder = vi.hoisted(() => vi.fn());

vi.mock("@/lib/shopify/customer-account", () => ({ fetchCustomerInvoiceOrder }));

const { loadCustomerReceipt } = await import("@/lib/invoice/load-customer-receipt");

/** テストデータのみ。Shopify への接続はしない */

const TOKEN = "test-access-token";
const ORDER_ID = "gid://shopify/Order/1";
const money = (amount: number) => ({ amount: `${amount}.0`, currencyCode: "JPY" });

const paidShipped: CustomerAccountInvoiceOrder = {
  id: ORDER_ID,
  name: "#TEST",
  processedAt: "2026-10-01T01:00:00Z",
  currencyCode: "JPY",
  cancelledAt: null,
  cancelReason: null,
  edited: false,
  financialStatus: "PAID",
  totalRefunded: money(0),
  shippingLine: { title: "通常配送" },
  agreements: {
    nodes: [
      {
        __typename: "OrderAgreement",
        id: "gid://shopify/SalesAgreement/1",
        happenedAt: "2026-10-01T01:00:00Z",
        reason: "ORDER",
        sales: {
          nodes: [
            {
              __typename: "ProductSale",
              id: "gid://shopify/Sale/1",
              actionType: "ORDER",
              lineType: "PRODUCT",
              quantity: 1,
              totalAmount: money(2400),
              totalTaxAmount: money(218),
              totalDiscountAmountAfterTaxes: money(0),
              taxes: [{ amount: money(218), taxLine: { ratePercentage: 10, channelLiable: false } }],
              lineItem: { id: "gid://shopify/LineItem/1", name: "ガイロープ", price: money(2400) },
            },
          ],
        },
      },
    ],
  },
  refunds: [],
  transactions: [
    {
      id: "gid://shopify/OrderTransaction/1",
      kind: "SALE",
      status: "SUCCESS",
      type: "CARD",
      createdAt: "2026-10-01T01:00:05Z",
      processedAt: "2026-10-01T01:00:05Z",
      transactionParentId: null,
      transactionAmount: { presentmentMoney: money(2400) },
    },
  ],
  fulfillments: {
    nodes: [
      {
        id: "gid://shopify/Fulfillment/1",
        status: "SUCCESS",
        createdAt: "2026-10-05T01:00:00Z",
        fulfillmentLineItems: { nodes: [{ quantity: 1, lineItem: { id: "gid://shopify/LineItem/1" } }] },
      },
    ],
  },
};

function silenceConsole() {
  return ["log", "info", "warn", "error", "debug"].map((method) =>
    vi.spyOn(console, method as "log").mockImplementation(() => {})
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  fetchCustomerInvoiceOrder.mockReset();
});

describe("Customer Account API からの書類の組み立て（loadCustomerReceipt）", () => {
  it("ログイン中のお客様のトークンと注文 ID で、領収書用の 1 件を取得する", async () => {
    fetchCustomerInvoiceOrder.mockResolvedValue(paidShipped);

    const result = await loadCustomerReceipt(TOKEN, ORDER_ID, () => new Date("2026-10-11T00:00:00Z"));

    expect(fetchCustomerInvoiceOrder).toHaveBeenCalledWith(TOKEN, ORDER_ID);
    expect(result.status).toBe("evaluated");
    if (result.status !== "evaluated") return;
    // 本番の仮の運用は会員ページからの発行を止めているので、発行できる書類は返さない
    expect(result.invoice).toMatchObject({ status: "unavailable" });
    expect(result.invoice.status === "unavailable" && result.invoice.reasons.map((reason) => reason.code)).toEqual([
      "memberPageDisabled",
    ]);
  });

  it("本人の注文でない（Shopify が返さない）注文は notFound", async () => {
    fetchCustomerInvoiceOrder.mockResolvedValue(null);

    expect(await loadCustomerReceipt(TOKEN, "gid://shopify/Order/other")).toEqual({ status: "notFound" });
  });

  it("取得に失敗しても例外を投げず、エラーの内容をログに出さない", async () => {
    const spies = silenceConsole();
    fetchCustomerInvoiceOrder.mockRejectedValue(new Error(`token ${TOKEN} / 宛名 山田太郎`));

    expect(await loadCustomerReceipt(TOKEN, ORDER_ID)).toEqual({ status: "fetchFailed" });
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it("想定外の形のデータでも例外を投げず、ログにも出さない", async () => {
    const spies = silenceConsole();
    fetchCustomerInvoiceOrder.mockResolvedValue({ ...paidShipped, agreements: null });

    expect(await loadCustomerReceipt(TOKEN, ORDER_ID)).toEqual({ status: "failed" });
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it("読み込む項目に、氏名・住所・連絡先・トークンの項目は無い", () => {
    for (const field of ["customer", "email", "phone", "billingAddress", "shippingAddress", "accessToken"]) {
      expect(INVOICE_ORDER_FIELDS).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
