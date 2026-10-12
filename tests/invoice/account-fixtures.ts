import {
  type CustomerAccountAgreement,
  type CustomerAccountInvoiceOrder,
  type CustomerAccountSale,
} from "@/lib/invoice/customer-account-order";

/**
 * Customer Account API（2026-10）の形の注文。
 *
 * 「実データ」の注文は、本番の Customer Account API で取得した #1054・#1056・#1057・#1058 の
 * 販売記録の形と金額・税額を写したもの。ID・日時は作り直し、氏名・住所・連絡先などは含めない。
 * #1058 の商品行ごとの税額の割り振りと各日時は、合計（525 円）に合わせて作った値。
 */

export const CAPTURED_AT = "2026-10-11T09:00:00+09:00";
export const money = (amount: number) => ({ amount: `${amount}.0`, currencyCode: "JPY" });

export function tax(amount: number, ratePercentage: number | null = 10) {
  return { amount: money(amount), taxLine: { ratePercentage, channelLiable: false } };
}

export function productSale(
  id: string,
  lineItem: { id: string; name: string; price: number },
  quantity: number,
  amount: number,
  taxAmount: number,
  overrides: Partial<CustomerAccountSale> = {}
): CustomerAccountSale {
  const sign = amount < 0 ? -1 : 1;
  return {
    __typename: "ProductSale",
    id,
    actionType: sign < 0 ? "RETURN" : "ORDER",
    lineType: "PRODUCT",
    quantity,
    totalAmount: money(amount),
    totalTaxAmount: money(taxAmount),
    totalDiscountAmountAfterTaxes: money(0),
    taxes: [tax(taxAmount)],
    lineItem: { id: lineItem.id, name: lineItem.name, price: money(lineItem.price) },
    ...overrides,
  };
}

export function shippingSale(id: string, amount: number, taxAmount: number | null, overrides: Partial<CustomerAccountSale> = {}): CustomerAccountSale {
  return {
    __typename: "ShippingLineSale",
    id,
    actionType: amount < 0 ? "RETURN" : "ORDER",
    lineType: "SHIPPING",
    quantity: null,
    totalAmount: money(amount),
    totalTaxAmount: money(taxAmount ?? 0),
    totalDiscountAmountAfterTaxes: money(0),
    taxes: taxAmount === null ? [] : [tax(taxAmount)],
    lineItem: null,
    ...overrides,
  };
}

export function agreement(
  id: string,
  reason: string,
  sales: CustomerAccountSale[],
  overrides: Partial<CustomerAccountAgreement> = {}
): CustomerAccountAgreement {
  return {
    __typename: reason === "REFUND" ? "RefundAgreement" : reason === "ORDER_EDIT" ? "OrderEditAgreement" : "OrderAgreement",
    id,
    happenedAt: "2026-10-01T01:00:00Z",
    reason,
    sales: { pageInfo: { hasNextPage: false }, nodes: sales },
    ...overrides,
  };
}

export const ITEMS = {
  groundSheet: { id: "gid://shopify/LineItem/1", name: "グランドシート", price: 17710 },
  peg: { id: "gid://shopify/LineItem/2", name: "ZIG STAKE 20cm", price: 550 },
  fitting: { id: "gid://shopify/LineItem/3", name: "三角自在金具 6個セット", price: 1740 },
  rope: { id: "gid://shopify/LineItem/4", name: "ガイロープ", price: 2400 },
};

export function order(overrides: Partial<CustomerAccountInvoiceOrder>): CustomerAccountInvoiceOrder {
  return {
    id: "gid://shopify/Order/1",
    name: "#TEST",
    processedAt: "2026-10-01T01:00:00Z",
    currencyCode: "JPY",
    cancelledAt: null,
    cancelReason: null,
    edited: false,
    financialStatus: "PAID",
    totalRefunded: money(0),
    shippingLine: { title: "通常配送" },
    agreements: { pageInfo: { hasNextPage: false }, nodes: [] },
    refunds: [],
    transactions: [],
    fulfillments: { pageInfo: { hasNextPage: false }, nodes: [] },
    ...overrides,
  };
}

export function cardSale(amount: number) {
  return {
    id: "gid://shopify/OrderTransaction/1",
    kind: "SALE",
    status: "SUCCESS",
    type: "CARD",
    createdAt: "2026-10-01T01:00:05Z",
    processedAt: "2026-10-01T01:00:05Z",
    transactionParentId: null,
    transactionAmount: { presentmentMoney: money(amount) },
  };
}

export function bankDepositVoided(amount: number) {
  return [
    {
      id: "gid://shopify/OrderTransaction/1",
      kind: "SALE",
      status: "PENDING",
      type: "BANK_DEPOSIT",
      createdAt: "2026-10-01T01:00:05Z",
      processedAt: "2026-10-01T01:00:05Z",
      transactionParentId: null,
      transactionAmount: { presentmentMoney: money(amount) },
    },
    {
      id: "gid://shopify/OrderTransaction/2",
      kind: "VOID",
      status: "SUCCESS",
      type: "BANK_DEPOSIT",
      createdAt: "2026-10-03T01:00:00Z",
      processedAt: "2026-10-03T01:00:00Z",
      transactionParentId: "gid://shopify/OrderTransaction/1",
      transactionAmount: { presentmentMoney: money(amount) },
    },
  ];
}

export function fulfillment(id: string, status: string, createdAt: string, lines: { id: string; quantity: number }[]) {
  return {
    id,
    status,
    createdAt,
    fulfillmentLineItems: {
      pageInfo: { hasNextPage: false },
      nodes: lines.map((part) => ({ quantity: part.quantity, lineItem: { id: part.id } })),
    },
  };
}

/** #1054：グランドシート 17,710 円・送料無料（税の明細なし）・カード決済・取消済みの出荷と有効な出荷 */
export const order1054 = order({
  name: "#1054",
  agreements: {
    nodes: [
      agreement("gid://shopify/SalesAgreement/1", "ORDER", [
        productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610),
        shippingSale("gid://shopify/Sale/2", 0, null),
      ]),
    ],
  },
  transactions: [cardSale(17710)],
  fulfillments: {
    nodes: [
      fulfillment("gid://shopify/Fulfillment/1", "CANCELLED", "2026-10-08T01:00:00Z", [{ id: ITEMS.groundSheet.id, quantity: 1 }]),
      // 日本時間 2026/10/09 19:18
      fulfillment("gid://shopify/Fulfillment/2", "SUCCESS", "2026-10-09T10:18:00Z", [{ id: ITEMS.groundSheet.id, quantity: 1 }]),
    ],
  },
});

/** 入金前にキャンセルした注文。キャンセルで返金の販売記録が作られるが、返金の記録（refunds）は無い */
export function cancelledUnpaid(name: string, sales: CustomerAccountSale[], returns: CustomerAccountSale[], total: number) {
  return order({
    name,
    cancelledAt: "2026-10-03T01:00:00Z",
    cancelReason: "CUSTOMER",
    financialStatus: "VOIDED",
    agreements: {
      nodes: [
        agreement("gid://shopify/SalesAgreement/1", "ORDER", sales),
        agreement("gid://shopify/SalesAgreement/2", "REFUND", returns, {
          happenedAt: "2026-10-03T01:00:00Z",
          refund: { id: "gid://shopify/Refund/1" },
        }),
      ],
    },
    transactions: bankDepositVoided(total),
  });
}

/** #1056：ZIG STAKE 550 円（税 50）＋ 送料 700 円（税 64）＝ 1,250 円・税 114 円 */
export const order1056 = cancelledUnpaid(
  "#1056",
  [productSale("gid://shopify/Sale/1", ITEMS.peg, 1, 550, 50), shippingSale("gid://shopify/Sale/2", 700, 64)],
  [productSale("gid://shopify/Sale/3", ITEMS.peg, -1, -550, -50), shippingSale("gid://shopify/Sale/4", -700, -64)],
  1250
);

/** #1057：三角自在金具 1,740 円 ×2（税 316）＋ ガイロープ 2,400 円（税 219）＝ 5,880 円・税 535 円 */
export const order1057 = cancelledUnpaid(
  "#1057",
  [
    productSale("gid://shopify/Sale/1", ITEMS.fitting, 2, 3480, 316),
    productSale("gid://shopify/Sale/2", ITEMS.rope, 1, 2400, 219),
    shippingSale("gid://shopify/Sale/3", 0, 0),
  ],
  [
    productSale("gid://shopify/Sale/4", ITEMS.fitting, -2, -3480, -316),
    productSale("gid://shopify/Sale/5", ITEMS.rope, -1, -2400, -219),
  ],
  5880
);

/** #1058：ZIG STAKE 550 円 ＋ 三角自在金具 1,740 円 ×3 ＝ 5,770 円・税 525 円（送料は 10%・0 円） */
export const order1058 = cancelledUnpaid(
  "#1058",
  [
    productSale("gid://shopify/Sale/1", ITEMS.peg, 1, 550, 50),
    productSale("gid://shopify/Sale/2", ITEMS.fitting, 3, 5220, 475),
    shippingSale("gid://shopify/Sale/3", 0, 0),
  ],
  [
    productSale("gid://shopify/Sale/4", ITEMS.peg, -1, -550, -50),
    productSale("gid://shopify/Sale/5", ITEMS.fitting, -3, -5220, -475),
  ],
  5770
);

/** #1057 と同じ商品構成を、カードで入金済み・出荷済みにした注文（テストデータ） */
export function paidShipped1057(refunds: { id: string; amount: number; sales: CustomerAccountSale[] }[] = []) {
  const totalRefunded = refunds.reduce((sum, item) => sum + item.amount, 0);

  return order({
    name: "#TEST-1057",
    financialStatus: totalRefunded > 0 ? "PARTIALLY_REFUNDED" : "PAID",
    totalRefunded: money(totalRefunded),
    agreements: {
      nodes: [
        agreement("gid://shopify/SalesAgreement/1", "ORDER", [
          productSale("gid://shopify/Sale/1", ITEMS.fitting, 2, 3480, 316),
          productSale("gid://shopify/Sale/2", ITEMS.rope, 1, 2400, 219),
          shippingSale("gid://shopify/Sale/3", 1100, 100),
        ]),
        ...refunds.map((item, index) =>
          agreement(`gid://shopify/SalesAgreement/r${index}`, "REFUND", item.sales, {
            happenedAt: "2026-10-12T01:00:00Z",
            refund: { id: item.id },
          })
        ),
      ],
    },
    refunds: refunds.map((item) => ({ id: item.id, createdAt: "2026-10-12T01:00:00Z", totalRefunded: money(item.amount) })),
    transactions: [
      cardSale(6980),
      ...refunds.map((item, index) => ({
        ...cardSale(item.amount),
        id: `gid://shopify/OrderTransaction/r${index}`,
        kind: "REFUND",
        transactionParentId: "gid://shopify/OrderTransaction/1",
      })),
    ],
    fulfillments: {
      nodes: [
        fulfillment("gid://shopify/Fulfillment/1", "SUCCESS", "2026-10-05T01:00:00Z", [
          { id: ITEMS.fitting.id, quantity: 2 },
          { id: ITEMS.rope.id, quantity: 1 },
        ]),
      ],
    },
  });
}
