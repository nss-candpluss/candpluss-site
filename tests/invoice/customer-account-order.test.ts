import { describe, expect, it } from "vitest";

import { INVOICE_RULES_VERSION, PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import {
  INVOICE_ORDER_FIELDS,
  invoiceOrderFromCustomerAccount,
  type CustomerAccountInvoiceOrder,
  type CustomerAccountSale,
} from "@/lib/invoice/customer-account-order";
import { customerReceiptFromAccountOrder } from "@/lib/invoice/customer-receipt";
import { emptyLedger } from "@/lib/invoice/documents";
import { planOrderDocuments } from "@/lib/invoice/eligibility";
import { InvoiceMoneyError } from "@/lib/invoice/money";
import { reconcileOrder } from "@/lib/invoice/reconcile";
import { invoiceRefundStatus, invoiceSettlement } from "@/lib/invoice/settlement";

import {
  agreement,
  CAPTURED_AT,
  cardSale,
  fulfillment,
  ITEMS,
  money,
  order,
  order1054,
  order1056,
  order1057,
  order1058,
  paidShipped1057,
  productSale,
  shippingSale,
  tax,
} from "./account-fixtures";
import { enabledPolicy, issuer, RULES_VERSION } from "./fixtures";

/**
 * Customer Account API（2026-10）の注文を、書類の元データにする変換。
 * 「実データ」と書いたものは `account-fixtures.ts` の実際の注文の形を写したもの。
 */

const config = PROVISIONAL_INVOICE_TAX_CONFIG;

const convert = (input: CustomerAccountInvoiceOrder) =>
  invoiceOrderFromCustomerAccount(input, { capturedAt: CAPTURED_AT, priceBasis: "taxIncluded" });

const codes = (input: CustomerAccountInvoiceOrder) => convert(input).dataIssues.map((issue) => issue.code);
const refundCodes = (input: CustomerAccountInvoiceOrder) => convert(input).refundIssues.map((issue) => issue.code);

function plan(input: CustomerAccountInvoiceOrder) {
  const record = convert(input);
  return planOrderDocuments({
    record,
    ledger: emptyLedger(record.sale.orderId),
    issuer,
    taxConfig: config,
    transactionDateBasis: "shippedAt",
    policy: enabledPolicy,
    rulesVersion: RULES_VERSION,
  });
}

describe("読み込む項目", () => {
  it("氏名・住所・連絡先・カード情報の項目は読まない", () => {
    for (const field of ["customer", "email", "phone", "billingAddress", "shippingAddress", "firstName", "lastName", "paymentDetails", "last4"]) {
      expect(INVOICE_ORDER_FIELDS).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it("販売記録・返金・決済・出荷の項目を読む", () => {
    for (const field of ["agreements", "RefundAgreement", "ProductSale", "taxes", "refunds", "transactions", "fulfillments", "hasNextPage"]) {
      expect(INVOICE_ORDER_FIELDS).toContain(field);
    }
  });
});

describe("実データ：#1054（入金済み・出荷済み）", () => {
  it("注文時の販売記録からご注文内容を作り、送料無料は送料に載せない", () => {
    const record = convert(order1054);

    expect(record.dataIssues).toEqual([]);
    expect(record.source).toBe("customerAccountApi");
    expect(record.capturedAt).toBe(CAPTURED_AT);
    expect(record.sale.lines).toEqual([
      { lineId: ITEMS.groundSheet.id, description: "グランドシート", quantity: 1, unitPrice: 17710, discount: 0, ratePercent: 10 },
    ]);
    expect(record.sale.shipping).toBeNull();
    expect(record.sale.shopifyReference).toEqual({ total: 17710, tax: 1610, rates: [{ ratePercent: 10, amount: 17710, tax: 1610 }] });
  });

  it("Shopify の税額と一致し、取消済みの出荷は使わず有効な出荷の日を取引年月日にする", () => {
    const result = plan(order1054);

    expect(reconcileOrder(convert(order1054), config).sale.status).toBe("match");
    expect(result.invoice.decision).toBe("issuable");
    expect(result.invoice.draft).toMatchObject({
      kind: "invoice",
      orderName: "#1054",
      transactionDate: "2026-10-09",
      receipt: { receivedAmount: 17710, receivedDate: "2026-10-01", manualPayment: false },
      taxSummary: { total: 17710, tax: 1610 },
      shipping: null,
    });
    expect(result.returns).toEqual([]);
  });
});

describe("実データ：入金前にキャンセルした注文（#1056〜#1058）", () => {
  const cases: [CustomerAccountInvoiceOrder, number, number][] = [
    [order1056, 1250, 114],
    [order1057, 5880, 535],
    [order1058, 5770, 525],
  ];

  for (const [input, total, taxAmount] of cases) {
    it(`${input.name}：注文時の販売記録の税額（${taxAmount} 円）と当店の計算が一致する`, () => {
      const record = convert(input);
      const reconciliation = reconcileOrder(record, config);

      expect(record.dataIssues).toEqual([]);
      expect(record.sale.shopifyReference).toMatchObject({ total, tax: taxAmount });
      expect(reconciliation.sale.status).toBe("match");
    });

    it(`${input.name}：返金の販売記録はあるが、お金は動いていないので書類を作らない`, () => {
      const record = convert(input);
      const result = plan(input);

      expect(record.refunds).toHaveLength(1);
      expect(record.refunds[0].refundedAmount).toBeNull();
      expect(record.payments.map((item) => [item.kind, item.status, item.manual])).toEqual([
        ["sale", "pending", true],
        ["void", "success", true],
      ]);
      expect(invoiceSettlement(record)).toEqual({ kind: "cancelledUnpaid" });
      expect(invoiceRefundStatus(record, record.refunds[0])).toBe("noPayment");
      expect(result.invoice.decision).toBe("noTransaction");
      expect(result.returns).toEqual([]);
    });
  }

  it("#1056：送料は送料として 10% で持ち、キャンセルの販売記録の送料の戻しも読む", () => {
    const record = convert(order1056);

    expect(record.sale.shipping).toEqual({ title: "通常配送", price: 700, discount: 0, ratePercent: 10 });
    expect(record.refunds[0]).toMatchObject({
      refundId: "gid://shopify/Refund/1",
      createdAt: "2026-10-03T01:00:00Z",
      lines: [{ lineId: ITEMS.peg.id, quantity: 1, amount: 550, ratePercent: 10 }],
      shipping: [{ amount: 700, ratePercent: 10 }],
      shopifyReference: { total: 1250, tax: 114 },
    });
  });

  it("#1057：商品行の税額は Shopify の割り振り（2,400 円の行が 219 円）でも、税率ごとの合計で一致する", () => {
    const record = convert(order1057);

    expect(record.sale.lines.map((item) => [item.description, item.quantity, item.unitPrice])).toEqual([
      ["三角自在金具 6個セット", 2, 1740],
      ["ガイロープ", 1, 2400],
    ]);
    expect(record.sale.shipping).toBeNull();
    expect(reconcileOrder(record, config).sale.status).toBe("match");
  });
});

/** ここから下はテストデータのみ（実際の Shopify のデータでは未確認の形） */
describe("テストデータのみ：お金の返金", () => {
  function refundedOrder(refunds: { id: string; amount: number; sales: CustomerAccountSale[]; transactions?: { amount: number; status: string }[] }[]) {
    const totalRefunded = refunds.reduce((sum, item) => sum + item.amount, 0);
    const base = order1054;

    return order({
      ...base,
      financialStatus: totalRefunded >= 17710 ? "REFUNDED" : "PARTIALLY_REFUNDED",
      totalRefunded: money(totalRefunded),
      agreements: {
        nodes: [
          ...base.agreements.nodes,
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
        cardSale(17710),
        ...refunds.flatMap((item, index) =>
          (item.transactions ?? [{ amount: item.amount, status: "SUCCESS" }]).map((transaction, part) => ({
            ...cardSale(transaction.amount),
            id: `gid://shopify/OrderTransaction/r${index}-${part}`,
            kind: "REFUND",
            status: transaction.status,
            transactionParentId: "gid://shopify/OrderTransaction/1",
          }))
        ),
      ],
    });
  }

  const fullRefund = () =>
    refundedOrder([
      {
        id: "gid://shopify/Refund/10",
        amount: 17710,
        sales: [productSale("gid://shopify/Sale/r1", ITEMS.groundSheet, -1, -17710, -1610)],
      },
    ]);

  it("全額返金：返金の記録・決済・販売記録がそろえば返還請求書を作れる", () => {
    const record = convert(fullRefund());
    const result = plan(fullRefund());

    expect(record.refunds[0]).toMatchObject({ refundedAmount: 17710, lines: [{ quantity: 1, amount: 17710 }] });
    expect(invoiceRefundStatus(record, record.refunds[0])).toBe("completed");
    expect(result.invoice.decision).toBe("issuable");
    expect(result.returns.map((item) => [item.decision, item.draft?.taxSummary.tax])).toEqual([["issuable", 1610]]);
  });

  it("返金の決済が手続き中・失敗なら返還請求書は作らないが、当初の領収書は作れる", () => {
    const withStatus = (status: string) =>
      refundedOrder([
        {
          id: "gid://shopify/Refund/10",
          amount: 17710,
          sales: [productSale("gid://shopify/Sale/r1", ITEMS.groundSheet, -1, -17710, -1610)],
          transactions: [{ amount: 17710, status }],
        },
      ]);

    for (const status of ["PENDING", "FAILURE", "ERROR"]) {
      const result = plan(withStatus(status));
      expect(result.returns.map((item) => item.decision)).toEqual(["notIssuable"]);
      expect(result.invoice.decision).toBe("issuable");
      expect(result.invoice.draft?.taxSummary).toMatchObject({ total: 17710, tax: 1610 });
    }
    expect(codes(withStatus("PENDING"))).toEqual([]);
  });

  it("返金の販売記録の無い返金があれば、返還請求書は推測で作らない。当初の領収書は作れる", () => {
    const input = { ...fullRefund(), agreements: order1054.agreements };

    expect(codes(input)).toEqual([]);
    expect(refundCodes(input)).toEqual(["refundWithoutAgreement"]);
    expect(plan(input).invoice.decision).toBe("issuable");
    expect(plan(input).returns).toEqual([]);
  });

  it("返金の販売記録に返金でない記録が混ざっていれば、返還請求書を止める", () => {
    const input = refundedOrder([
      {
        id: "gid://shopify/Refund/10",
        amount: 17710,
        sales: [productSale("gid://shopify/Sale/r1", ITEMS.groundSheet, 1, 17710, 1610)],
      },
    ]);

    expect(refundCodes(input)).toContain("unexpectedRefundSale");
    expect(plan(input).returns.map((item) => item.decision)).toEqual(["notIssuable"]);
    expect(plan(input).invoice.decision).toBe("issuable");
  });

  it("返金 ID の無い返金の販売記録は、返還請求書の側で止める", () => {
    const input = order({
      ...order1054,
      agreements: {
        nodes: [
          ...order1054.agreements.nodes,
          agreement("gid://shopify/SalesAgreement/r", "REFUND", [productSale("gid://shopify/Sale/r1", ITEMS.groundSheet, -1, -17710, -1610)]),
        ],
      },
    });

    expect(codes(input)).toEqual([]);
    expect(refundCodes(input)).toEqual(["refundAgreementWithoutRefund"]);
  });
});

describe("テストデータのみ：送料あり・一部返金", () => {
  it("送料ありの入金済み・出荷済みの注文：送料を 10% の行として載せ、Shopify の税額（635 円）と一致する", () => {
    const result = plan(paidShipped1057());

    expect(result.invoice.decision).toBe("issuable");
    expect(result.invoice.draft).toMatchObject({
      transactionDate: "2026-10-05",
      shipping: { title: "通常配送", price: 1100, amount: 1100, ratePercent: 10 },
      taxSummary: { total: 6980, tax: 635 },
      receipt: { receivedAmount: 6980 },
    });
  });

  it("一部返金（1 点・税 158 円）：返還請求書を作り、当初の領収書は返金前の内容のまま", () => {
    const result = plan(
      paidShipped1057([
        { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
      ])
    );

    expect(result.invoice.decision).toBe("issuable");
    expect(result.invoice.draft?.taxSummary).toMatchObject({ total: 6980, tax: 635 });
    expect(result.returns.map((item) => [item.decision, item.draft?.taxSummary.total, item.draft?.taxSummary.tax])).toEqual([
      ["issuable", 1740, 158],
    ]);
  });

  it("一部返金の税額が Shopify の割り振り（219 円）と当店の計算（218 円）で違えば、返還請求書だけを止める", () => {
    const result = plan(
      paidShipped1057([
        { id: "gid://shopify/Refund/20", amount: 2400, sales: [productSale("gid://shopify/Sale/r1", ITEMS.rope, -1, -2400, -219)] },
      ])
    );

    expect(result.returns[0].reconciliation).toBe("mismatch");
    expect(result.returns[0].decision).toBe("notIssuable");
    expect(result.invoice.decision).toBe("issuable");
  });
});

describe("テストデータのみ：自動では扱わない注文", () => {
  const base1054Sales = () => order1054.agreements.nodes[0].sales.nodes;
  const withOrderSales = (sales: CustomerAccountSale[], overrides: Partial<CustomerAccountInvoiceOrder> = {}) =>
    order({ ...order1054, agreements: { nodes: [agreement("gid://shopify/SalesAgreement/1", "ORDER", sales)] }, ...overrides });

  it("注文編集があれば、当初の内容が確定できないので領収書も止める", () => {
    expect(codes({ ...order1054, edited: true })).toEqual(["orderEdited"]);
    expect(plan({ ...order1054, edited: true }).invoice.decision).toBe("notIssuable");
  });

  it("注文編集・返品の販売記録・扱っていない種類の販売記録があれば止める", () => {
    expect(codes({ ...order1054, edited: true })).toEqual(["orderEdited"]);
    expect(
      codes(
        order({
          ...order1054,
          agreements: { nodes: [...order1054.agreements.nodes, agreement("gid://shopify/SalesAgreement/2", "ORDER_EDIT", [])] },
        })
      )
    ).toEqual(["orderEdited"]);
    const withOthers = order({
      ...order1054,
      agreements: {
        nodes: [
          ...order1054.agreements.nodes,
          agreement("gid://shopify/SalesAgreement/2", "RETURN", [], { __typename: "ReturnAgreement" }),
          agreement("gid://shopify/SalesAgreement/3", "UNKNOWN", [], { __typename: "SalesAgreement" }),
        ],
      },
    });
    expect(codes(withOthers)).toEqual(["unknownAgreement"]);
    // 返品は返金の側の事柄として、返還請求書だけを止める
    expect(refundCodes(withOthers)).toEqual(["returnAgreement"]);
  });

  it("注文時の販売記録が無い・2 件ある注文は止める", () => {
    expect(codes(order({ ...order1054, agreements: { nodes: [] } }))).toEqual(["orderAgreement"]);
    expect(
      codes(order({ ...order1054, agreements: { nodes: [...order1054.agreements.nodes, ...order1054.agreements.nodes] } }))
    ).toEqual(["orderAgreement"]);
  });

  it("扱っていない税率（5%・0%）・税の明細が複数・消費税の無い商品は、10% として扱わず止める", () => {
    const sheet = (overrides: Partial<CustomerAccountSale>) =>
      withOrderSales([productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610, overrides)]);

    expect(codes(sheet({ taxes: [tax(1610, 5)] }))).toEqual(["unsupportedTaxRate"]);
    expect(codes(sheet({ taxes: [tax(0, 0)], totalTaxAmount: money(0) }))).toEqual(["unsupportedTaxRate"]);
    expect(codes(sheet({ taxes: [tax(1000), tax(610)] }))).toEqual(["multipleTaxLines"]);
    expect(codes(sheet({ taxes: [], totalTaxAmount: money(0) }))).toEqual(["untaxedSale"]);
    expect(codes(sheet({ taxes: [{ amount: money(1610), taxLine: { ratePercentage: 10, channelLiable: true } }] }))).toEqual([
      "channelLiableTax",
    ]);

    const result = plan(sheet({ taxes: [tax(1610, 5)] }));
    expect(result.invoice.decision).toBe("notIssuable");
    expect(result.invoice.draft).toBeNull();
  });

  it("販売記録の税額と税の明細の合計が合わなければ止める", () => {
    const input = withOrderSales([productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610, { taxes: [tax(1600)] })]);

    expect(codes(input)).toEqual(["saleTaxMismatch"]);
    expect(plan(input).invoice.decision).toBe("notIssuable");
  });

  it("入金額と請求の合計が合わなければ止める（差を補正しない）", () => {
    const result = plan({ ...order1054, transactions: [cardSale(17000)] });

    expect(codes({ ...order1054, transactions: [cardSale(17000)] })).toEqual([]);
    expect(result.invoice.reviewRequired.map((reason) => reason.code)).toEqual(["receiptAmountMismatch"]);
    expect(result.invoice.decision).toBe("notIssuable");
  });

  it("決済の記録が無い・出荷の記録が無い注文は、推測で領収書を作らない", () => {
    expect(plan({ ...order1054, transactions: [] }).invoice.reviewRequired.map((reason) => reason.code)).toEqual([
      "paymentUnknown",
    ]);
    expect(plan({ ...order1054, fulfillments: { nodes: [] } }).invoice.taxFacts.reasons.map((reason) => reason.code)).toEqual([
      "notShipped",
    ]);
  });

  it("課税されていない送料（金額のある送料で税の明細が無い）は止める", () => {
    const input = withOrderSales([...base1054Sales().slice(0, 1), shippingSale("gid://shopify/Sale/2", 700, null)]);

    expect(codes(input)).toEqual(["untaxedSale"]);
  });

  it("ギフトカード・チップなど扱っていない販売記録や支払い方法は止める", () => {
    const giftCard: CustomerAccountSale = { ...shippingSale("gid://shopify/Sale/9", 3000, null), __typename: "GiftCardSale", lineType: "GIFT_CARD" };

    expect(codes(withOrderSales([...base1054Sales(), giftCard]))).toEqual(["unsupportedSale"]);
    expect(codes({ ...order1054, transactions: [{ ...cardSale(17710), type: "GIFT_CARD" }] })).toEqual(["unsupportedPayment"]);
    expect(codes({ ...order1054, transactions: [{ ...cardSale(17710), type: "STORE_CREDIT" }] })).toEqual(["unsupportedPayment"]);
  });

  it("販売記録・出荷を読み切れていなければ止める", () => {
    expect(codes({ ...order1054, agreements: { ...order1054.agreements, pageInfo: { hasNextPage: true } } })).toEqual(["truncated"]);
  });

  it("円以外の通貨・1 円未満の金額は読み込みで止める", () => {
    expect(() => convert({ ...order1054, currencyCode: "USD" })).toThrow(InvoiceMoneyError);
    expect(() =>
      convert(withOrderSales([productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610, { totalAmount: { amount: "17710.5" } })]))
    ).toThrow(InvoiceMoneyError);
  });
});

describe("テストデータのみ：割引・8%（実際の Shopify のデータでは未確認）", () => {
  const withOrderSales = (sales: CustomerAccountSale[]) =>
    order({ ...order1054, agreements: { nodes: [agreement("gid://shopify/SalesAgreement/1", "ORDER", sales)] } });

  it("割引は販売記録の割引後の金額と、割引額（税込）で持つ", () => {
    const record = convert(
      withOrderSales([
        productSale("gid://shopify/Sale/1", ITEMS.rope, 1, 2160, 196, { totalDiscountAmountAfterTaxes: money(240) }),
      ])
    );

    expect(record.dataIssues).toEqual([]);
    expect(record.sale.lines[0]).toMatchObject({ unitPrice: 2400, discount: 240 });
    expect(reconcileOrder(record, config).sale.status).toBe("match");
  });

  it("割引のある注文の書類は、割引後の金額で税率ごとに集計する", () => {
    const input = order({
      ...withOrderSales([
        productSale("gid://shopify/Sale/1", ITEMS.rope, 1, 2160, 196, { totalDiscountAmountAfterTaxes: money(240) }),
      ]),
      transactions: [cardSale(2160)],
      fulfillments: {
        nodes: [fulfillment("gid://shopify/Fulfillment/1", "SUCCESS", "2026-10-05T01:00:00Z", [{ id: ITEMS.rope.id, quantity: 1 }])],
      },
    });
    const result = plan(input);

    expect(result.invoice.decision).toBe("issuable");
    expect(result.invoice.draft?.lines[0]).toMatchObject({ unitPrice: 2400, discount: 240, amount: 2160 });
    expect(result.invoice.draft?.taxSummary).toMatchObject({ total: 2160, tax: 196 });
  });

  it("単価×数量−割引が販売記録の金額と合わなければ止める（差を補正しない）", () => {
    const input = withOrderSales([
      productSale("gid://shopify/Sale/1", ITEMS.rope, 1, 2160, 196, { totalDiscountAmountAfterTaxes: money(0) }),
    ]);

    expect(codes(input)).toEqual(["lineAmountMismatch"]);
  });

  it("8% の商品は 8% で持ち、送料は送料の税率のまま持つ", () => {
    const food = { id: "gid://shopify/LineItem/9", name: "コーヒー豆", price: 1080 };
    const record = convert(
      withOrderSales([
        productSale("gid://shopify/Sale/1", food, 1, 1080, 80, { taxes: [tax(80, 8)] }),
        shippingSale("gid://shopify/Sale/2", 700, 64),
      ])
    );

    expect(record.dataIssues).toEqual([]);
    expect(record.sale.lines[0].ratePercent).toBe(8);
    expect(record.sale.shipping?.ratePercent).toBe(10);
    expect(record.sale.shopifyReference?.rates).toEqual([
      { ratePercent: 10, amount: 700, tax: 64 },
      { ratePercent: 8, amount: 1080, tax: 80 },
    ]);
    expect(reconcileOrder(record, config).sale.status).toBe("match");
  });
});

describe("商品名の表記", () => {
  it("色・サイズのある商品は、既存の明細書と同じく「商品名　色・サイズ」にする（テストデータのみ）", () => {
    const input = order({
      ...order1054,
      agreements: {
        nodes: [
          agreement("gid://shopify/SalesAgreement/1", "ORDER", [
            productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610, {
              lineItem: { ...ITEMS.groundSheet, name: "グランドシート - Olive", variantTitle: "Olive", price: money(17710) },
            }),
          ]),
        ],
      },
    });

    expect(convert(input).sale.lines[0].description).toBe("グランドシート　Olive");
  });
});

describe("会員ページに渡す書類と返金の状況（customerReceiptFromAccountOrder）", () => {
  const context = {
    capturedAt: CAPTURED_AT,
    issuer,
    rulesVersion: INVOICE_RULES_VERSION,
    taxConfig: config,
    transactionDateBasis: "shippedAt" as const,
    policy: enabledPolicy,
  };
  const evaluated = (input: CustomerAccountInvoiceOrder, overrides: Partial<typeof context> = {}) => {
    const result = customerReceiptFromAccountOrder(input, { ...context, ...overrides });
    if (result.status !== "evaluated") throw new Error(`判定できませんでした: ${result.status}`);
    return result;
  };
  const reasonCodes = (availability: { status: string; reasons?: { code: string }[] }) =>
    availability.reasons?.map((reason) => reason.code) ?? [];

  it("実データ #1054：書類の内容全体を固定する（決まりの版を変えずに内容が変わらないことの確認）", () => {
    expect(evaluated(order1054)).toEqual({
      status: "evaluated",
      invoice: {
        status: "issuable",
        document: {
          kind: "invoice",
          documentId: "invoice:gid://shopify/Order/1",
          orderId: "gid://shopify/Order/1",
          orderName: "#1054",
          issuer: { name: "株式会社NSS", brandName: "C AND+S", registrationNumber: "T5290001041852" },
          rulesVersion: "provisional-2026-10",
          taxConfig: { priceBasis: "taxIncluded", rounding: "halfUp" },
          taxSummary: {
            rates: [{ ratePercent: 10, totalIncludingTax: 17710, totalExcludingTax: 16100, tax: 1610 }],
            total: 17710,
            tax: 1610,
          },
          corrects: null,
          receipt: { receivedAmount: 17710, receivedDate: "2026-10-01", manualPayment: false },
          transactionDate: "2026-10-09",
          lines: [
            {
              lineId: ITEMS.groundSheet.id,
              description: "グランドシート",
              quantity: 1,
              unitPrice: 17710,
              discount: 0,
              amount: 17710,
              ratePercent: 10,
              reducedRate: false,
            },
          ],
          shipping: null,
        },
      },
      refunds: null,
      returnInvoices: [],
    });
  });

  it("取得日時が違っても、同じ記録からは同じ内容になる", () => {
    expect(evaluated(order1054)).toEqual(evaluated(order1054, { capturedAt: "2027-01-01T00:00:00+09:00" }));
  });

  it("実データ #1056〜#1058：入金前のキャンセルは書類を作らず、返金の状況も出さない", () => {
    for (const input of [order1056, order1057, order1058]) {
      expect(evaluated(input)).toEqual({ status: "evaluated", invoice: { status: "noTransaction" }, refunds: null, returnInvoices: [] });
    }
  });

  it("仮の運用（会員ページからの発行は停止中）では発行しない", () => {
    const result = evaluated(order1054, { policy: { memberPageIssueEnabled: false, returnInvoiceEnabled: false } });

    expect(result.invoice).toEqual({ status: "unavailable", reasons: [expect.objectContaining({ code: "memberPageDisabled" })] });
  });

  it("テストデータのみ：一部返金済みの注文は、領収書・返金の状況・返還請求書を別々に返す", () => {
    const result = evaluated(
      paidShipped1057([
        { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
      ])
    );

    expect(result.invoice.status).toBe("issuable");
    expect(result.refunds).toEqual({ refunded: 1740, pending: 0, failed: false, needsReview: false });
    expect(result.returnInvoices).toMatchObject([
      { status: "issuable", refundId: "gid://shopify/Refund/20", returnedAmount: 1740 },
    ]);
  });

  it("テストデータのみ：返還請求書を止めている運用でも、返金の状況と返還の金額は示す", () => {
    const result = evaluated(
      paidShipped1057([
        { id: "gid://shopify/Refund/20", amount: 1740, sales: [productSale("gid://shopify/Sale/r1", ITEMS.fitting, -1, -1740, -158)] },
      ]),
      { policy: { memberPageIssueEnabled: true, returnInvoiceEnabled: false } }
    );

    expect(result.invoice.status).toBe("issuable");
    expect(result.refunds?.refunded).toBe(1740);
    expect(result.returnInvoices[0]).toMatchObject({ status: "unavailable", returnedAmount: 1740 });
    expect(reasonCodes(result.returnInvoices[0])).toEqual(["returnInvoiceDisabled"]);
  });

  it("テストデータのみ：全額返金（17,710 円）は、全額を返還の金額にする", () => {
    const input = order({
      ...order1054,
      financialStatus: "REFUNDED",
      totalRefunded: money(17710),
      agreements: {
        nodes: [
          ...order1054.agreements.nodes,
          agreement("gid://shopify/SalesAgreement/r", "REFUND", [productSale("gid://shopify/Sale/r1", ITEMS.groundSheet, -1, -17710, -1610)], {
            happenedAt: "2026-10-12T01:00:00Z",
            refund: { id: "gid://shopify/Refund/10" },
          }),
        ],
      },
      refunds: [{ id: "gid://shopify/Refund/10", createdAt: "2026-10-12T01:00:00Z", totalRefunded: money(17710) }],
      transactions: [
        cardSale(17710),
        { ...cardSale(17710), id: "gid://shopify/OrderTransaction/2", kind: "REFUND", transactionParentId: "gid://shopify/OrderTransaction/1" },
      ],
    });
    const result = evaluated(input);

    expect(result.invoice.status).toBe("issuable");
    expect(result.refunds).toEqual({ refunded: 17710, pending: 0, failed: false, needsReview: false });
    expect(result.returnInvoices).toMatchObject([{ status: "issuable", returnedAmount: 17710 }]);
  });

  it("扱っていない税率・Shopify の税額と合わない注文は、理由を付けて発行しない", () => {
    const sales = (overrides: Partial<CustomerAccountSale>) =>
      order({
        ...order1054,
        agreements: {
          nodes: [agreement("gid://shopify/SalesAgreement/1", "ORDER", [productSale("gid://shopify/Sale/1", ITEMS.groundSheet, 1, 17710, 1610, overrides)])],
        },
      });

    const unsupported = evaluated(sales({ taxes: [tax(1610, 5)] }));
    const mismatch = evaluated(sales({ taxes: [tax(1611)], totalTaxAmount: money(1611) }));

    expect(unsupported.invoice.status).toBe("unavailable");
    expect(reasonCodes(unsupported.invoice)).toContain("unsupportedTaxRate");
    expect(reasonCodes(mismatch.invoice)).toEqual(["reconcile:mismatch"]);
  });

  it("円以外の通貨など読み込めないデータは、例外にせず invalidData を返す", () => {
    expect(customerReceiptFromAccountOrder({ ...order1054, currencyCode: "USD" }, context)).toMatchObject({
      status: "invalidData",
      reasons: [{ code: "invalidData" }],
    });
  });
});
