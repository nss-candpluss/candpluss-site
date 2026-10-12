import { describe, expect, it } from "vitest";

import { effectiveDocuments, InvoiceDocumentError, orderStatementDocuments } from "@/lib/invoice/documents";
import { planOrderDocuments } from "@/lib/invoice/eligibility";
import { yen } from "@/lib/invoice/money";
import {
  InvoiceRecordError,
  ledgerFromRecords,
  MemoryInvoiceDocumentStore,
  searchDocumentRecords,
} from "@/lib/invoice/repository";

import { issueContext, lineRefund, ORDER_ID, orderRecord, shippedAll, shippedOrder } from "./fixtures";

/** テストデータのみ。実際の DB・Shopify には接続していない */

const RECORDED = {
  invoice: "2026-10-06T09:00:01+09:00",
  returnInvoice: "2026-10-08T13:05:00+09:00",
};

const refund = lineRefund("refund-1", "rope", 1, 1740, 1740, {
  shopifyReference: { total: yen(1740), tax: yen(158), rates: [{ ratePercent: 10, amount: yen(1740), tax: yen(158) }] },
});

function issuedInvoice() {
  const draft = planOrderDocuments(issueContext(orderRecord({ fulfillments: shippedAll }))).invoice.draft;
  if (!draft) throw new Error("書類の案がありません");
  return draft;
}

function issuedReturn() {
  const plan = planOrderDocuments(issueContext(shippedOrder([refund])));
  const draft = plan.returns[0]?.draft;
  if (!draft) throw new Error("返還請求書の案がありません");
  return draft;
}

describe("発行した書類の保存（メモリ上の保存先）", () => {
  it("発行した書類を、検索に使う値と一緒に保存する", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const { record, duplicate } = await store.append({ recordedAt: RECORDED.invoice, document: issuedInvoice() });

    expect(duplicate).toBe(false);
    expect(record.searchKeys).toEqual({
      orderId: ORDER_ID,
      orderName: "#9001",
      documentId: `invoice:${ORDER_ID}`,
      kind: "invoice",
      transactionDate: "2026-10-04",
      amount: 5880,
    });
  });

  it("保存した内容をそのまま再表示でき、保存後に元の書類を変えても影響しない", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const document = issuedInvoice();
    await store.append({ recordedAt: RECORDED.invoice, document });

    const [saved] = await store.list({ orderId: ORDER_ID });
    expect(saved.document).toEqual(document);
    expect(saved.document).not.toBe(document);
    expect(Object.isFrozen(saved.document)).toBe(true);
    expect(() => {
      (saved.document.taxSummary as { tax: number }).tax = 0;
    }).toThrow(TypeError);
  });

  it("同じ書類の保存し直しは重複として扱い、内容の違う同じ ID の書類は保存しない", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const document = issuedInvoice();
    await store.append({ recordedAt: RECORDED.invoice, document });

    expect((await store.append({ recordedAt: "2026-10-07T00:00:00+09:00", document })).duplicate).toBe(true);
    await expect(
      store.append({ recordedAt: RECORDED.invoice, document: { ...document, rulesVersion: "other-rules" } })
    ).rejects.toThrow(InvoiceRecordError);
    expect(await store.list()).toHaveLength(1);
  });

  it("元の書類と返金の返還請求書を別々に保存し、関連づけたまま読み出せる", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const invoice = issuedInvoice();
    await store.append({ recordedAt: RECORDED.invoice, document: invoice });
    await store.append({ recordedAt: RECORDED.returnInvoice, document: issuedReturn() });

    const ledger = ledgerFromRecords(ORDER_ID, await store.list({ orderId: ORDER_ID }));
    const [first, second] = orderStatementDocuments(ledger);

    expect(first.kind).toBe("invoice");
    expect(second).toMatchObject({ kind: "returnInvoice", relatedInvoiceId: invoice.documentId, refundId: "refund-1" });
    expect(first.taxSummary.total).toBe(5880);
  });

  it("訂正は元の書類を残したまま保存し、訂正の履歴をたどれる", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const original = issuedInvoice();
    const corrected = planOrderDocuments(
      issueContext(orderRecord({ fulfillments: shippedAll }), { rulesVersion: "corrected-rules" })
    ).invoice.draft!;
    const correction = {
      ...corrected,
      documentId: `${original.documentId}:correction:1`,
      corrects: { documentId: original.documentId, sequence: 1, reason: "記載の誤り" },
    };

    await store.append({ recordedAt: RECORDED.invoice, document: original });
    await store.append({ recordedAt: "2026-10-07T09:00:01+09:00", document: correction });

    const ledger = ledgerFromRecords(ORDER_ID, await store.list());
    expect(ledger.documents.map((document) => document.documentId)).toEqual([
      original.documentId,
      correction.documentId,
    ]);
    expect(effectiveDocuments(ledger).map((document) => document.documentId)).toEqual([correction.documentId]);
  });

  it("訂正でない 2 枚目の領収書や、台帳に無い書類の訂正は保存しない", async () => {
    const store = new MemoryInvoiceDocumentStore();
    const original = issuedInvoice();
    await store.append({ recordedAt: RECORDED.invoice, document: original });

    await expect(
      store.append({
        recordedAt: RECORDED.invoice,
        document: { ...original, documentId: `${original.documentId}:other` },
      })
    ).rejects.toThrow(InvoiceDocumentError);
    await expect(
      store.append({
        recordedAt: RECORDED.invoice,
        document: {
          ...original,
          documentId: "invoice:none:correction:1",
          corrects: { documentId: "invoice:none", sequence: 1, reason: "誤り" },
        },
      })
    ).rejects.toThrow(InvoiceDocumentError);
  });

  it("記録日時の読めない記録は保存しない", async () => {
    const store = new MemoryInvoiceDocumentStore();

    await expect(store.append({ recordedAt: "不明", document: issuedInvoice() })).rejects.toThrow(InvoiceRecordError);
  });
});

describe("保存した書類の検索", () => {
  it("取引年月日・金額の範囲と注文番号で探せる", async () => {
    const store = new MemoryInvoiceDocumentStore();
    await store.append({ recordedAt: RECORDED.invoice, document: issuedInvoice() });
    await store.append({ recordedAt: RECORDED.returnInvoice, document: issuedReturn() });
    const records = await store.list();

    const kinds = (query: Parameters<typeof searchDocumentRecords>[1]) =>
      searchDocumentRecords(records, query).map((record) => record.searchKeys.kind);

    expect(kinds({ transactionDateFrom: "2026-10-01", transactionDateTo: "2026-10-05" })).toEqual(["invoice"]);
    expect(kinds({ transactionDateFrom: "2026-10-08" })).toEqual(["returnInvoice"]);
    expect(kinds({ amountMin: 2000 })).toEqual(["invoice"]);
    expect(kinds({ amountMax: 2000 })).toEqual(["returnInvoice"]);
    expect(kinds({ orderName: "#9001", amountMin: 1000, amountMax: 6000 })).toEqual(["invoice", "returnInvoice"]);
    expect(kinds({ orderName: "#0000" })).toEqual([]);
  });
});
