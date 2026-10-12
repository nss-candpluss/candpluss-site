import { PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import { emptyLedger, type InvoiceIssuer } from "@/lib/invoice/documents";
import type { InvoiceIssueContext, InvoiceIssuePolicy } from "@/lib/invoice/eligibility";
import { yen } from "@/lib/invoice/money";
import type {
  InvoiceFulfillment,
  InvoiceOrderLine,
  InvoiceOrderRecord,
  InvoicePaymentTransaction,
  InvoiceRefund,
  InvoiceShipping,
} from "@/lib/invoice/order";

/** テストデータ。Shopify の実際の API の値とは照合していない */

export const ORDER_ID = "gid://shopify/Order/9001";

export const issuer: InvoiceIssuer = {
  name: "株式会社NSS",
  brandName: "C AND+S",
  registrationNumber: "T5290001041852",
};

/** テスト用に会員ページからの発行を許可した運用。本番の運用（停止中）とは別 */
export const enabledPolicy: InvoiceIssuePolicy = {
  memberPageIssueEnabled: true,
  returnInvoiceEnabled: true,
};

export const RULES_VERSION = "test-rules";

/** 日時。ご注文・決済・出荷・取得・閲覧をすべて別の日にしてある */
export const at = {
  ordered: "2026-10-01T10:00:00+09:00",
  paid: "2026-10-02T11:00:00+09:00",
  // 日本時間では 10 月 4 日
  shipped: "2026-10-03T15:30:00Z",
  captured: "2026-10-05T08:00:00+09:00",
  issued: "2026-10-06T09:00:00+09:00",
  refunded: "2026-10-08T12:00:00+09:00",
  cancelled: "2026-10-09T12:00:00+09:00",
};

export function line(
  lineId: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<InvoiceOrderLine> = {}
): InvoiceOrderLine {
  return {
    lineId,
    description: lineId,
    quantity,
    unitPrice: yen(unitPrice),
    discount: yen(0),
    ratePercent: 10,
    ...overrides,
  };
}

export function shipping(price: number, overrides: Partial<InvoiceShipping> = {}): InvoiceShipping {
  return {
    title: "通常配送",
    price: yen(price),
    discount: yen(0),
    ratePercent: 10,
    ...overrides,
  };
}

export function payment(
  transactionId: string,
  kind: InvoicePaymentTransaction["kind"],
  amount: number,
  overrides: Partial<InvoicePaymentTransaction> = {}
): InvoicePaymentTransaction {
  return {
    transactionId,
    parentTransactionId: null,
    kind,
    status: "success",
    amount: yen(amount),
    manual: false,
    processedAt: kind === "refund" ? at.refunded : at.paid,
    ...overrides,
  };
}

export function shipment(
  lines: { lineId: string; quantity: number }[],
  overrides: Partial<InvoiceFulfillment> = {}
): InvoiceFulfillment {
  return {
    fulfillmentId: "fulfillment-1",
    status: "success",
    shippedAt: at.shipped,
    lines,
    ...overrides,
  };
}

/** 商品 1 行の返金。`refunded` は Shopify の返金の記録（`Order.refunds`）の返金額 */
export function lineRefund(
  refundId: string,
  lineId: string,
  quantity: number,
  amount: number,
  refunded: number | null = amount,
  overrides: Partial<InvoiceRefund> = {}
): InvoiceRefund {
  return {
    refundId,
    createdAt: at.refunded,
    lines: [{ lineId, quantity, amount: yen(amount), ratePercent: 10 }],
    shipping: [],
    adjustments: [],
    refundedAmount: refunded === null ? null : yen(refunded),
    shopifyReference: null,
    ...overrides,
  };
}

/** #1057 と同じ商品構成（1,740 円 ×2 ＋ 2,400 円 ＝ 5,880 円）の注文。入金済み・未発送 */
export function orderRecord(overrides: Partial<InvoiceOrderRecord> = {}): InvoiceOrderRecord {
  return {
    capturedAt: at.captured,
    source: "testFixture",
    sale: {
      orderId: ORDER_ID,
      orderName: "#9001",
      priceBasis: "taxIncluded",
      processedAt: at.ordered,
      lines: [line("rope", 1740, 2), line("rope-long", 2400, 1)],
      shipping: null,
      shopifyReference: {
        total: yen(5880),
        tax: yen(535),
        rates: [{ ratePercent: 10, amount: yen(5880), tax: yen(535) }],
      },
    },
    payments: [payment("tx-sale", "sale", 5880)],
    fulfillments: [],
    cancellation: null,
    refunds: [],
    shopifyStatus: { financialStatus: "PAID", totalRefunded: yen(0) },
    dataIssues: [],
    refundIssues: [],
    ...overrides,
  };
}

export const shippedAll = [
  shipment([
    { lineId: "rope", quantity: 2 },
    { lineId: "rope-long", quantity: 1 },
  ]),
];

/** 出荷済みの注文。返金があれば、返金の決済・返金合計・照合の値も合わせる */
export function shippedOrder(refunds: InvoiceRefund[] = [], overrides: Partial<InvoiceOrderRecord> = {}) {
  const refunded = refunds.reduce((sum, refund) => sum + (refund.refundedAmount ?? 0), 0);

  return orderRecord({
    fulfillments: shippedAll,
    refunds,
    payments: [
      payment("tx-sale", "sale", 5880),
      ...refunds.map((refund, index) => payment(`tx-refund-${index + 1}`, "refund", refund.refundedAmount ?? 0)),
    ],
    shopifyStatus: {
      financialStatus: refunded === 0 ? "PAID" : refunded === 5880 ? "REFUNDED" : "PARTIALLY_REFUNDED",
      totalRefunded: yen(refunded),
    },
    ...overrides,
  });
}

export function issueContext(
  record: InvoiceOrderRecord,
  overrides: Partial<InvoiceIssueContext> = {}
): InvoiceIssueContext {
  return {
    record,
    ledger: emptyLedger(ORDER_ID),
    issuer,
    taxConfig: PROVISIONAL_INVOICE_TAX_CONFIG,
    transactionDateBasis: "shippedAt",
    policy: enabledPolicy,
    rulesVersion: RULES_VERSION,
    ...overrides,
  };
}
