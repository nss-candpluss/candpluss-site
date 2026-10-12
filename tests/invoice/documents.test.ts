import { describe, expect, it } from "vitest";

import { PROVISIONAL_INVOICE_TAX_CONFIG } from "@/lib/invoice/config";
import {
  appendDocument,
  buildInvoiceDocument,
  buildReturnInvoiceDocument,
  effectiveDocuments,
  emptyLedger,
  INVOICE_DOCUMENT_TITLES,
  InvoiceDocumentError,
  orderStatementDocuments,
  tokyoDate,
} from "@/lib/invoice/documents";
import { legalRequirementIssues } from "@/lib/invoice/eligibility";
import { InvoiceMoneyError, yen } from "@/lib/invoice/money";
import type { InvoiceOrderSale, InvoiceRefund } from "@/lib/invoice/order";

import { issuer, line, lineRefund, ORDER_ID, orderRecord, RULES_VERSION, shipping } from "./fixtures";

/** テストデータのみ（Shopify API 未検証） */

const receipt = { receivedAmount: yen(5880), receivedDate: "2026-10-02", manualPayment: false };

const common = {
  issuer,
  rulesVersion: RULES_VERSION,
  taxConfig: PROVISIONAL_INVOICE_TAX_CONFIG,
};

function invoiceFor(
  sale: InvoiceOrderSale = orderRecord().sale,
  overrides: Partial<Parameters<typeof buildInvoiceDocument>[0]> = {}
) {
  return buildInvoiceDocument({
    ...common,
    sale,
    transactionDate: "2026-10-04",
    receipt,
    ...overrides,
  });
}

function returnFor(
  refund: InvoiceRefund,
  overrides: Partial<Parameters<typeof buildReturnInvoiceDocument>[0]> = {}
) {
  return buildReturnInvoiceDocument({
    ...common,
    sale: orderRecord().sale,
    refund,
    relatedInvoiceId: `invoice:${ORDER_ID}`,
    originalTransactionDate: "2026-10-04",
    ...overrides,
  });
}

describe("領収書 兼 適格簡易請求書の記載内容", () => {
  it("表題は 2 種類だけ。返還請求書は領収書を兼ねない", () => {
    expect(INVOICE_DOCUMENT_TITLES).toEqual({
      invoice: "領収書 兼 適格簡易請求書",
      returnInvoice: "適格返還請求書",
    });
  });

  it("取引年月日と入金日を分けて持ち、閲覧のたびに変わる発行日時・取得日時は持たない", () => {
    const invoice = invoiceFor();

    expect(invoice.transactionDate).toBe("2026-10-04");
    expect(invoice.receipt).toEqual(receipt);
    expect(invoice.rulesVersion).toBe(RULES_VERSION);
    expect(invoice).not.toHaveProperty("issuedAt");
    expect(invoice).not.toHaveProperty("issueDate");
    expect(invoice).not.toHaveProperty("sourceCapturedAt");
  });

  it("同じ記録と同じ決まりの版からは、いつ組み立てても同じ内容になる", () => {
    expect(JSON.stringify(invoiceFor())).toBe(JSON.stringify(invoiceFor()));
    expect(JSON.stringify(returnFor(lineRefund("r", "rope", 1, 1740)))).toBe(
      JSON.stringify(returnFor(lineRefund("r", "rope", 1, 1740)))
    );
  });

  it("宛名は持たない（小売業の適格簡易請求書）", () => {
    expect(invoiceFor()).not.toHaveProperty("recipient");
  });

  it("日本時間の年月日にする", () => {
    expect(tokyoDate("2026-10-03T15:30:00Z")).toBe("2026-10-04");
    expect(tokyoDate("2026-10-03T14:59:59Z")).toBe("2026-10-03");
    expect(() => tokyoDate("不明")).toThrow(InvoiceDocumentError);
  });

  it("税率ごとの金額と消費税額（#1057 と同じ構成で 535 円）", () => {
    const invoice = invoiceFor();

    expect(invoice.taxSummary.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 5880, totalExcludingTax: 5345, tax: 535 },
    ]);
    expect(invoice.lines.map((item) => [item.lineId, item.quantity, item.amount])).toEqual([
      ["rope", 2, 3480],
      ["rope-long", 1, 2400],
    ]);
  });

  it("割引・送料・軽減税率の印を行ごとに持ち、送料は送料の税率で集計する", () => {
    const sale: InvoiceOrderSale = {
      ...orderRecord().sale,
      lines: [
        line("rope", 1740, 1, { discount: yen(240) }),
        line("food", 1080, 1, { ratePercent: 8, description: "コーヒー豆" }),
      ],
      shipping: shipping(700),
    };
    const invoice = invoiceFor(sale);

    expect(invoice.lines[0]).toMatchObject({ unitPrice: 1740, discount: 240, amount: 1500, reducedRate: false });
    expect(invoice.lines[1]).toMatchObject({ amount: 1080, reducedRate: true });
    expect(invoice.shipping).toMatchObject({ title: "通常配送", price: 700, amount: 700, reducedRate: false });
    // 10%：1,500 + 700 = 2,200 → 200、8%：1,080 → 80
    expect(invoice.taxSummary.rates.map((rate) => [rate.ratePercent, rate.totalIncludingTax, rate.tax])).toEqual([
      [10, 2200, 200],
      [8, 1080, 80],
    ]);
  });
});

describe("適格返還請求書の記載内容", () => {
  it("当初の書類とは別の記録で、元の書類・元の取引日・返還日を持つ", () => {
    const invoice = invoiceFor();
    const returned = returnFor(lineRefund("refund-1", "rope", 1, 1740));

    expect(returned.kind).toBe("returnInvoice");
    expect(returned.documentId).not.toBe(invoice.documentId);
    expect(returned.relatedInvoiceId).toBe(invoice.documentId);
    expect(returned.returnDate).toBe("2026-10-08");
    expect(returned.originalTransactionDate).toBe("2026-10-04");
    expect(returned.lines).toEqual([
      { lineId: "rope", description: "rope", quantity: 1, amount: 1740, ratePercent: 10, reducedRate: false },
    ]);
    expect(returned.taxSummary.rates).toEqual([
      { ratePercent: 10, totalIncludingTax: 1740, totalExcludingTax: 1582, tax: 158 },
    ]);
    // 当初の書類は返金前の内容のまま
    expect(invoice.taxSummary.total).toBe(5880);
    expect(invoice.taxSummary.tax).toBe(535);
  });

  it("送料の返金は送料として、送料の税率で持つ", () => {
    const sale = { ...orderRecord().sale, shipping: shipping(700) };
    const returned = returnFor(
      { ...lineRefund("refund-s", "rope", 0, 0), lines: [], shipping: [{ amount: yen(700), ratePercent: 10 }] },
      { sale }
    );

    expect(returned.otherAmounts).toEqual([
      { description: "通常配送", amount: 700, ratePercent: 10, reducedRate: false },
    ]);
    expect(returned.taxSummary.tax).toBe(64);
  });

  it("ご注文の数量・金額・送料を超える返金は止める", () => {
    expect(() => returnFor(lineRefund("r", "rope", 3, 5220))).toThrow(InvoiceMoneyError);
    expect(() => returnFor(lineRefund("r", "rope", 1, 4000))).toThrow(InvoiceMoneyError);
    expect(() => returnFor(lineRefund("r", "unknown", 1, 100))).toThrow(InvoiceDocumentError);
    expect(() =>
      returnFor({ ...lineRefund("r", "rope", 0, 0), lines: [], shipping: [{ amount: yen(700), ratePercent: 10 }] })
    ).toThrow(InvoiceMoneyError);
  });
});

describe("発行済み書類の保持", () => {
  it("組み立てた書類は変更できない", () => {
    const invoice = invoiceFor();

    expect(Object.isFrozen(invoice)).toBe(true);
    expect(() => {
      (invoice.lines[0] as { amount: number }).amount = 1;
    }).toThrow(TypeError);
    expect(() => {
      (invoice.taxSummary as { tax: number }).tax = 0;
    }).toThrow(TypeError);
  });

  it("同じ書類を足し直しても台帳は変わらず、内容の違う同じ ID の書類は足せない", () => {
    const ledger = appendDocument(emptyLedger(ORDER_ID), invoiceFor());

    expect(appendDocument(ledger, invoiceFor())).toBe(ledger);
    expect(() =>
      appendDocument(ledger, invoiceFor(orderRecord().sale, { rulesVersion: "other-rules" }))
    ).toThrow(InvoiceDocumentError);
  });

  it("訂正は元の書類を残したまま足し、今有効な書類は訂正後になる（訂正の履歴）", () => {
    const original = invoiceFor(orderRecord().sale, { transactionDate: "2026-10-03" });
    const corrected = invoiceFor(orderRecord().sale, {
      corrects: { documentId: original.documentId, sequence: 1, reason: "取引年月日の誤り" },
    });
    const ledger = appendDocument(appendDocument(emptyLedger(ORDER_ID), original), corrected);

    expect(corrected.documentId).toBe(`${original.documentId}:correction:1`);
    expect(ledger.documents).toEqual([original, corrected]);
    expect(ledger.documents[0]).toMatchObject({ transactionDate: "2026-10-03" });
    expect(effectiveDocuments(ledger)).toEqual([corrected]);
    expect(legalRequirementIssues(corrected)).toEqual([]);
  });

  it("台帳に無い書類の訂正や、別の注文の書類は足せない", () => {
    expect(() =>
      appendDocument(
        emptyLedger(ORDER_ID),
        invoiceFor(orderRecord().sale, { corrects: { documentId: "invoice:none", sequence: 1, reason: "誤り" } })
      )
    ).toThrow(InvoiceDocumentError);
    expect(() => appendDocument(emptyLedger("gid://shopify/Order/other"), invoiceFor())).toThrow(
      InvoiceDocumentError
    );
  });

  it("訂正でない 2 枚目の領収書や、同じ返金の返還請求書の重複は足せない", () => {
    const refund = lineRefund("refund-1", "rope", 1, 1740);
    const ledger = appendDocument(appendDocument(emptyLedger(ORDER_ID), invoiceFor()), returnFor(refund));
    const later = { rulesVersion: "other-rules" };

    expect(appendDocument(ledger, returnFor(refund))).toBe(ledger);
    expect(() => appendDocument(ledger, returnFor(refund, later))).toThrow(InvoiceDocumentError);
  });

  it("複数回の返金は返金ごとに別の返還請求書にし、1 つの PDF の順に並べられる", () => {
    const first = returnFor(lineRefund("refund-1", "rope", 1, 1740));
    const second = returnFor({
      ...lineRefund("refund-2", "rope-long", 1, 2400),
      createdAt: "2026-10-10T12:00:00+09:00",
    });
    const invoice = invoiceFor();
    const ledger = [second, invoice, first].reduce(appendDocument, emptyLedger(ORDER_ID));

    expect(orderStatementDocuments(ledger).map((document) => document.documentId)).toEqual([
      invoice.documentId,
      first.documentId,
      second.documentId,
    ]);
    expect(first.taxSummary.tax + second.taxSummary.tax).toBe(158 + 218);
  });
});

describe("法定記載事項の不足", () => {
  it("そろっていれば不足なし", () => {
    expect(legalRequirementIssues(invoiceFor())).toEqual([]);
    expect(legalRequirementIssues(returnFor(lineRefund("r", "rope", 1, 1740)))).toEqual([]);
  });

  it("発行事業者名・登録番号の不足を検出する", () => {
    const codes = legalRequirementIssues(
      invoiceFor(orderRecord().sale, { issuer: { name: " ", brandName: null, registrationNumber: "" } })
    ).map((issue) => issue.code);

    expect(codes).toEqual(["issuerName", "registrationNumber"]);
    expect(
      legalRequirementIssues(
        invoiceFor(orderRecord().sale, { issuer: { ...issuer, registrationNumber: "T529000104185" } })
      ).map((issue) => issue.code)
    ).toEqual(["registrationNumber"]);
  });

  it("取引の内容・取引年月日・領収の記載の不足を検出する", () => {
    const sale = { ...orderRecord().sale, lines: [line("rope", 1740, 1, { description: "" })] };

    expect(legalRequirementIssues(invoiceFor(sale, { receipt: { ...receipt, receivedAmount: yen(1740) } })).map((issue) => issue.code)).toEqual([
      "description",
    ]);
    expect(
      legalRequirementIssues(
        invoiceFor({ ...orderRecord().sale, lines: [] }, { transactionDate: "", receipt: { ...receipt, receivedAmount: yen(0), receivedDate: "" } })
      ).map((issue) => issue.code)
    ).toEqual(["contents", "transactionDate", "receiptAmount", "receiptDate"]);
  });

  it("返還請求書の返還日・元の取引日・元の書類の不足を検出する", () => {
    const codes = legalRequirementIssues(
      returnFor({ ...lineRefund("r", "rope", 1, 1740), createdAt: "2026-10-08T12:00:00+09:00" }, {
        originalTransactionDate: "",
        relatedInvoiceId: " ",
      })
    ).map((issue) => issue.code);

    expect(codes).toEqual(["originalTransactionDate", "relatedInvoice"]);
  });
});
