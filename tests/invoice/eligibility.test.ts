import { describe, expect, it } from "vitest";

import {
  PROVISIONAL_INVOICE_ISSUE_POLICY,
  PROVISIONAL_INVOICE_TAX_CONFIG,
  PROVISIONAL_TRANSACTION_DATE_BASIS,
} from "@/lib/invoice/config";
import { appendDocument, emptyLedger } from "@/lib/invoice/documents";
import {
  evaluateInvoiceIssue,
  evaluateReturnInvoiceIssue,
  issuePlannedDocuments,
  planOrderDocuments,
  receiptFromPayments,
  resolveTaxFacts,
} from "@/lib/invoice/eligibility";
import { yen } from "@/lib/invoice/money";
import { issueReason, type InvoiceRefund } from "@/lib/invoice/order";
import { originalPayment, refundSummary } from "@/lib/invoice/settlement";

import {
  at,
  issueContext,
  lineRefund,
  ORDER_ID,
  orderRecord,
  payment,
  RULES_VERSION,
  shipment,
  shippedAll,
  shippedOrder,
  shipping,
} from "./fixtures";

/** テストデータのみ（Shopify API 未検証）。取引年月日は仮設定の出荷日基準 */

const codes = (reasons: readonly { code: string }[]) => reasons.map((item) => item.code);

const unpaidPayments = {
  payments: [payment("tx-sale", "sale", 5880, { status: "pending" as const, manual: true })],
  shopifyStatus: { financialStatus: "PENDING", totalRefunded: yen(0) },
};

/** 商品 1 行の返金。Shopify の返金の販売記録の税額（`tax`）も持たせる */
function refundOf(refundId: string, lineId: string, quantity: number, amount: number, tax: number, overrides: Partial<InvoiceRefund> = {}) {
  return lineRefund(refundId, lineId, quantity, amount, amount, {
    shopifyReference: {
      total: yen(amount),
      tax: yen(tax),
      rates: [{ ratePercent: 10, amount: yen(amount), tax: yen(tax) }],
    },
    ...overrides,
  });
}

describe("仮の設定", () => {
  // 本番の動作確認の間だけ、会員ページからの発行を開けている（一時的）。返還請求書は停止のまま
  it("会員ページからの発行は動作確認のため一時的に有効、返還請求書は停止中", () => {
    expect(PROVISIONAL_INVOICE_ISSUE_POLICY).toEqual({
      memberPageIssueEnabled: true,
      returnInvoiceEnabled: false,
    });
    expect(PROVISIONAL_TRANSACTION_DATE_BASIS).toBe("shippedAt");
    expect(PROVISIONAL_INVOICE_TAX_CONFIG).toEqual({ priceBasis: "taxIncluded", rounding: "halfUp" });
  });

  it("動作確認中の運用では、条件のそろった注文を会員ページから発行する（一時的）", () => {
    const evaluation = evaluateInvoiceIssue(
      issueContext(orderRecord({ fulfillments: shippedAll }), { policy: PROVISIONAL_INVOICE_ISSUE_POLICY })
    );

    expect(evaluation.taxFacts.status).toBe("confirmed");
    expect(evaluation.legal.status).toBe("complete");
    expect(evaluation.reconciliation).toBe("match");
    expect(codes(evaluation.policy.reasons)).toEqual([]);
    expect(evaluation.decision).toBe("issuable");
  });
});

describe("領収書 兼 適格簡易請求書", () => {
  it("入金済み・出荷済み：発行でき、取引日・入金日を混同しない", () => {
    const record = orderRecord({ fulfillments: shippedAll });
    const evaluation = evaluateInvoiceIssue(issueContext(record));

    expect(evaluation.decision).toBe("issuable");
    expect(evaluation.draft).toMatchObject({
      kind: "invoice",
      transactionDate: "2026-10-04",
      rulesVersion: RULES_VERSION,
      receipt: { receivedAmount: 5880, receivedDate: "2026-10-02", manualPayment: false },
      taxSummary: { total: 5880, tax: 535 },
    });
    // ご注文日（10/1）は取引年月日に使っていない
    expect(record.sale.processedAt).toBe(at.ordered);
  });

  it("入金額と請求の合計が合わなければ要確認にする", () => {
    const evaluation = evaluateInvoiceIssue(
      issueContext(orderRecord({ fulfillments: shippedAll, payments: [payment("tx-sale", "sale", 5000)] }))
    );

    expect(codes(evaluation.reviewRequired)).toEqual(["receiptAmountMismatch"]);
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("決済の日時が分からなければ領収書の欄を作らず、当初のお支払いの要確認にする", () => {
    const record = orderRecord({
      fulfillments: shippedAll,
      payments: [payment("tx-sale", "sale", 5880, { processedAt: null })],
    });
    const evaluation = evaluateInvoiceIssue(issueContext(record));

    expect(receiptFromPayments(record)).toBeNull();
    expect(codes(evaluation.reviewRequired)).toEqual(["paymentUnknown"]);
    expect(evaluation.draft).toBeNull();
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("成功した決済が無いのに Shopify が支払い済みとしていれば、未入金と決めつけず要確認にする", () => {
    const record = orderRecord({ fulfillments: shippedAll, payments: [] });
    const evaluation = evaluateInvoiceIssue(issueContext(record));

    expect(originalPayment(record)).toEqual({ status: "unknown" });
    expect(codes(evaluation.reviewRequired)).toEqual(["paymentUnknown"]);
    expect(evaluation.policy.status).toBe("allowed");
    expect(evaluation.decision).toBe("notIssuable");
  });
});

describe("入金・出荷の組み合わせ", () => {
  it("入金済み・未発送：取引年月日（出荷日）が決まらないので発行しない", () => {
    const evaluation = evaluateInvoiceIssue(issueContext(orderRecord()));

    expect(evaluation.taxFacts.status).toBe("unconfirmed");
    expect(codes(evaluation.taxFacts.reasons)).toEqual(["notShipped", "notShipped"]);
    expect(evaluation.draft).toBeNull();
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("ご注文日を取引年月日にする設定でも、セルフ発行は出荷後に限る（基準は未確定）", () => {
    const unshipped = evaluateInvoiceIssue(issueContext(orderRecord(), { transactionDateBasis: "orderedAt" }));
    const shipped = evaluateInvoiceIssue(
      issueContext(orderRecord({ fulfillments: shippedAll }), { transactionDateBasis: "orderedAt" })
    );

    expect(unshipped.taxFacts.status).toBe("confirmed");
    expect(codes(unshipped.policy.reasons)).toEqual(["awaitingShipment"]);
    expect(unshipped.decision).toBe("notIssuable");
    expect(shipped.decision).toBe("issuable");
    expect(shipped.draft?.transactionDate).toBe("2026-10-01");
  });

  it("出荷の記録が取消済みだけなら、出荷前として扱う", () => {
    const evaluation = evaluateInvoiceIssue(
      issueContext(orderRecord({ fulfillments: [{ ...shippedAll[0], status: "cancelled" }] }))
    );

    expect(codes(evaluation.policy.reasons)).toEqual(["awaitingShipment"]);
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("未入金：取引情報と記載事項がそろっても、領収書なので発行しない", () => {
    const evaluation = evaluateInvoiceIssue(issueContext(orderRecord({ ...unpaidPayments, fulfillments: shippedAll })));

    expect(evaluation.taxFacts.status).toBe("confirmed");
    expect(codes(evaluation.policy.reasons)).toEqual(["unpaid"]);
    expect(evaluation.draft).toBeNull();
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("一部だけ出荷した注文・出荷日が複数ある注文は、個別に対応する", () => {
    const partial = evaluateInvoiceIssue(
      issueContext(orderRecord({ fulfillments: [shipment([{ lineId: "rope", quantity: 2 }])] }))
    );
    const split = evaluateInvoiceIssue(
      issueContext(
        orderRecord({
          fulfillments: [
            shipment([{ lineId: "rope", quantity: 2 }]),
            shipment([{ lineId: "rope-long", quantity: 1 }], {
              fulfillmentId: "fulfillment-2",
              shippedAt: "2026-10-05T01:00:00Z",
            }),
          ],
        })
      )
    );

    expect(codes(partial.taxFacts.reasons)).toEqual(["notShipped"]);
    expect(codes(split.taxFacts.reasons)).toEqual(["multipleShipmentDates"]);
    expect(split.decision).toBe("notIssuable");
  });

  it("同じ日の出荷に分かれていれば、その日を取引年月日にする", () => {
    const evaluation = evaluateInvoiceIssue(
      issueContext(
        orderRecord({
          fulfillments: [
            shipment([{ lineId: "rope", quantity: 2 }]),
            shipment([{ lineId: "rope-long", quantity: 1 }], { fulfillmentId: "fulfillment-2", shippedAt: "2026-10-04T05:00:00Z" }),
          ],
        })
      )
    );

    expect(evaluation.decision).toBe("issuable");
    expect(evaluation.draft?.transactionDate).toBe("2026-10-04");
  });

  it("取消済みの出荷は使わない（#1054 と同じ形：取消済みの出荷と有効な出荷がある）", () => {
    const evaluation = evaluateInvoiceIssue(
      issueContext(
        orderRecord({
          fulfillments: [
            { ...shippedAll[0], fulfillmentId: "cancelled", status: "cancelled", shippedAt: "2026-09-30T01:00:00Z" },
            shippedAll[0],
          ],
        })
      )
    );

    expect(evaluation.decision).toBe("issuable");
    expect(evaluation.draft?.transactionDate).toBe("2026-10-04");
  });

  it("出荷数がご注文を超える・ご注文に無い商品の出荷・出荷日の分からない出荷は確定しない", () => {
    const facts = (fulfillments: typeof shippedAll) => codes(resolveTaxFacts(orderRecord({ fulfillments }), "shippedAt").reasons);

    expect(facts([shipment([{ lineId: "rope", quantity: 3 }, { lineId: "rope-long", quantity: 1 }])])).toEqual(["overShipped"]);
    expect(facts([shipment([...shippedAll[0].lines, { lineId: "other", quantity: 1 }])])).toEqual(["unknownFulfillmentLine"]);
    expect(facts([{ ...shippedAll[0], shippedAt: null }])).toEqual(["shippedAtMissing"]);
  });
});

describe("キャンセル", () => {
  it("入金前キャンセル（#1056〜#1058 と同じ形）：取引が成立していないので書類を作らない", () => {
    const record = orderRecord({
      payments: [
        payment("tx-sale", "sale", 5880, { status: "pending", manual: true }),
        payment("tx-void", "void", 5880, { parentTransactionId: "tx-sale", manual: true }),
      ],
      cancellation: { cancelledAt: at.cancelled, reason: "customer" },
      // 入金前のキャンセルでも Shopify は返金の販売記録を作る。返金の記録（Order.refunds）は無い
      refunds: [lineRefund("refund-cancel", "rope", 2, 3480, null)],
      shopifyStatus: { financialStatus: "VOIDED", totalRefunded: yen(0) },
    });
    const plan = planOrderDocuments(issueContext(record));

    expect(plan.invoice.decision).toBe("noTransaction");
    expect(codes(plan.invoice.taxFacts.reasons)).toEqual(["cancelledBeforeShipment"]);
    expect(plan.returns).toEqual([]);
    expect(evaluateReturnInvoiceIssue({ ...issueContext(record), refundId: "refund-cancel" }).decision).toBe(
      "noTransaction"
    );
  });

  it("入金後・出荷前のキャンセルの返金は、返還請求書を作らない", () => {
    const record = orderRecord({
      payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 5880)],
      cancellation: { cancelledAt: at.cancelled, reason: "customer" },
      refunds: [
        refundOf("refund-1", "rope", 2, 3480, 316, {
          lines: [
            { lineId: "rope", quantity: 2, amount: yen(3480), ratePercent: 10 },
            { lineId: "rope-long", quantity: 1, amount: yen(2400), ratePercent: 10 },
          ],
          refundedAmount: yen(5880),
        }),
      ],
      shopifyStatus: { financialStatus: "REFUNDED", totalRefunded: yen(5880) },
    });
    const plan = planOrderDocuments(issueContext(record));

    expect(plan.invoice.decision).toBe("noTransaction");
    expect(plan.returns.map((item) => [item.decision, codes(item.taxFacts.reasons)])).toEqual([
      ["noTransaction", ["refundBeforeShipment"]],
    ]);
  });

  it("出荷後のキャンセル：当初の領収書は出し、返金の返還請求書は個別に対応する", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)], {
      cancellation: { cancelledAt: at.cancelled, reason: "customer" },
    });
    const plan = planOrderDocuments(issueContext(record));

    expect(plan.invoice.decision).toBe("issuable");
    expect(codes(plan.returns[0].reviewRequired)).toEqual(["cancelledAfterShipment"]);
    expect(plan.returns[0].decision).toBe("notIssuable");
  });
});

describe("返金", () => {
  it("返金後に初めて閲覧：領収書は当初の内容、返金は別の返還請求書で、互いに関連づける", () => {
    const plan = planOrderDocuments(issueContext(shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)])));

    expect(plan.invoice.decision).toBe("issuable");
    expect(plan.invoice.draft?.taxSummary).toMatchObject({ total: 5880, tax: 535 });
    expect(plan.returns).toHaveLength(1);
    expect(plan.returns[0].decision).toBe("issuable");
    expect(plan.returns[0].draft).toMatchObject({
      relatedInvoiceId: plan.invoice.draft?.documentId,
      returnDate: "2026-10-08",
      originalTransactionDate: "2026-10-04",
      taxSummary: { total: 1740, tax: 158 },
    });

    const ledger = issuePlannedDocuments(emptyLedger(ORDER_ID), plan);
    expect(ledger.documents.map((document) => document.kind)).toEqual(["invoice", "returnInvoice"]);
  });

  it("発行済みの注文に返金があった：発行済みの領収書は変えず、返還請求書を足す", () => {
    const ledger = issuePlannedDocuments(emptyLedger(ORDER_ID), planOrderDocuments(issueContext(shippedOrder())));
    const issued = ledger.documents[0];
    const plan = planOrderDocuments(
      issueContext(shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)]), { ledger })
    );

    expect(plan.invoice.decision).toBe("alreadyIssued");
    expect(plan.invoice.existing).toBe(issued);
    expect(plan.returns[0].decision).toBe("issuable");
    expect(plan.returns[0].draft?.relatedInvoiceId).toBe(issued.documentId);

    const next = issuePlannedDocuments(ledger, plan);
    expect(next.documents).toHaveLength(2);
    expect(next.documents[0]).toBe(issued);
  });

  it("複数回の返金は、返金ごとに返還請求書を作る", () => {
    const plan = planOrderDocuments(
      issueContext(
        shippedOrder([
          refundOf("refund-1", "rope", 1, 1740, 158),
          refundOf("refund-2", "rope-long", 1, 2400, 218, { createdAt: "2026-10-09T12:00:00+09:00" }),
        ])
      )
    );

    expect(plan.returns.map((item) => [item.decision, item.draft?.taxSummary.tax])).toEqual([
      ["issuable", 158],
      ["issuable", 218],
    ]);
    expect(plan.invoice.decision).toBe("issuable");
  });

  it("返還請求書を止めている運用でも、当初の領収書は止めない", () => {
    const plan = planOrderDocuments(
      issueContext(shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)]), {
        policy: { memberPageIssueEnabled: true, returnInvoiceEnabled: false },
      })
    );

    expect(plan.invoice.reviewRequired).toEqual([]);
    expect(plan.invoice.decision).toBe("issuable");
    expect(codes(plan.returns[0].policy.reasons)).toEqual(["returnInvoiceDisabled"]);
    expect(plan.returns[0].decision).toBe("notIssuable");
  });

  it("返金手続き中・失敗の返金は返還請求書を作らないが、当初の領収書は止めない", () => {
    const withRefundStatus = (status: "pending" | "failure") =>
      orderRecord({
        fulfillments: shippedAll,
        payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 1740, { status })],
        refunds: [refundOf("refund-1", "rope", 1, 1740, 158)],
        shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(status === "failure" ? 0 : 1740) },
      });

    const pending = planOrderDocuments(issueContext(withRefundStatus("pending")));
    const failed = planOrderDocuments(issueContext(withRefundStatus("failure")));

    expect(codes(pending.returns[0].taxFacts.reasons)).toEqual(["refundProcessing"]);
    expect(codes(failed.returns[0].taxFacts.reasons)).toEqual(["refundFailed"]);
    expect(pending.returns[0].decision).toBe("notIssuable");
    expect(failed.returns[0].decision).toBe("notIssuable");
    expect(pending.invoice.decision).toBe("issuable");
    expect(failed.invoice.decision).toBe("issuable");
    expect(failed.invoice.draft?.receipt.receivedAmount).toBe(5880);
  });

  it("返金の決済の合計と返金の記録が合わなければ、推測で返還請求書を作らない", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)], {
      payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 1000)],
    });
    const plan = planOrderDocuments(issueContext(record));

    expect(codes(plan.returns[0].taxFacts.reasons)).toEqual(["refundUnknown"]);
    expect(plan.returns[0].decision).toBe("notIssuable");
  });

  it("部分返金の税額が Shopify の割り振り（219 円）と当店の計算（218 円）で違えば要確認にする", () => {
    const plan = planOrderDocuments(issueContext(shippedOrder([refundOf("refund-1", "rope-long", 1, 2400, 219)])));

    expect(plan.returns[0].reconciliation).toBe("mismatch");
    expect(plan.returns[0].draft?.taxSummary.tax).toBe(218);
    expect(plan.returns[0].decision).toBe("notIssuable");
    expect(plan.invoice.decision).toBe("issuable");
  });

  it("出荷前の返金は、自動では返還請求書にしない", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158, { createdAt: "2026-10-03T10:00:00Z" })]);
    const evaluation = evaluateReturnInvoiceIssue({ ...issueContext(record), refundId: "refund-1" });

    expect(codes(evaluation.taxFacts.reasons)).toEqual(["refundBeforeRecognition"]);
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("同じ返金を重複して計上しない", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)]);
    const duplicated = { ...record, refunds: [...record.refunds, ...record.refunds] };
    const plan = planOrderDocuments(issueContext(duplicated));
    const ledger = issuePlannedDocuments(emptyLedger(ORDER_ID), plan);

    expect(plan.returns).toHaveLength(1);
    expect(ledger.documents.filter((document) => document.kind === "returnInvoice")).toHaveLength(1);

    const again = planOrderDocuments(issueContext(duplicated, { ledger }));
    expect(again.invoice.decision).toBe("alreadyIssued");
    expect(again.returns[0].decision).toBe("alreadyIssued");
    expect(issuePlannedDocuments(ledger, again)).toBe(ledger);
  });

  it("返金の記録が矛盾していれば返還請求書は作らず、返金の状況を要確認にする。当初の領収書は止めない", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)]);
    const conflicting = {
      ...record,
      refunds: [record.refunds[0], { ...record.refunds[0], createdAt: "2026-10-09T00:00:00Z" }],
    };
    const plan = planOrderDocuments(issueContext(conflicting));

    expect(plan.invoice.decision).toBe("issuable");
    expect(plan.returns).toEqual([]);
    expect(refundSummary(conflicting)).toEqual({ refunded: 1740, pending: 0, failed: false, needsReview: true });
  });

  it("返金について自動で扱わない事柄は、返還請求書だけを止める", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)], {
      refundIssues: [issueReason("refundTaxUnknown", "返金の税率が分かりません")],
    });
    const plan = planOrderDocuments(issueContext(record));

    expect(plan.invoice.decision).toBe("issuable");
    expect(codes(plan.returns[0].reviewRequired)).toEqual(["refundTaxUnknown"]);
    expect(plan.returns[0].decision).toBe("notIssuable");
    expect(refundSummary(record)?.needsReview).toBe(true);
  });
});

describe("返金の状況（お客様に示す）", () => {
  it("返金の無い注文・入金前キャンセルの返金の販売記録だけの注文は、返金の状況を出さない", () => {
    expect(refundSummary(shippedOrder())).toBeNull();
    expect(
      refundSummary(
        orderRecord({
          ...unpaidPayments,
          cancellation: { cancelledAt: at.cancelled, reason: "customer" },
          refunds: [lineRefund("refund-cancel", "rope", 2, 3480, null)],
        })
      )
    ).toBeNull();
  });

  it("返金済み・返金待ち・返金の失敗を分けて示す", () => {
    const record = (status: "success" | "pending" | "failure", totalRefunded: number) =>
      orderRecord({
        fulfillments: shippedAll,
        payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 1740, { status })],
        refunds: [refundOf("refund-1", "rope", 1, 1740, 158)],
        shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(totalRefunded) },
      });

    expect(refundSummary(record("success", 1740))).toEqual({ refunded: 1740, pending: 0, failed: false, needsReview: false });
    expect(refundSummary(record("pending", 0))).toEqual({ refunded: 0, pending: 1740, failed: false, needsReview: false });
    expect(refundSummary(record("failure", 0))).toEqual({ refunded: 0, pending: 0, failed: true, needsReview: false });
  });

  it("返金の決済と Shopify の返金合計が合わなければ要確認にする", () => {
    const record = shippedOrder([refundOf("refund-1", "rope", 1, 1740, 158)], {
      shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(2000) },
    });

    expect(refundSummary(record)?.needsReview).toBe(true);
  });
});

describe("データの確認", () => {
  it("変換で見つけた事柄（注文編集・扱っていない税率など）があれば発行しない", () => {
    const record = orderRecord({
      fulfillments: shippedAll,
      dataIssues: [issueReason("orderEdited", "注文が編集されています")],
    });
    const evaluation = evaluateInvoiceIssue(issueContext(record));

    expect(codes(evaluation.taxFacts.reasons)).toEqual(["orderEdited"]);
    expect(evaluation.decision).toBe("notIssuable");
  });

  it("Shopify の税額と合わない・販売記録が取れていなければ発行しない", () => {
    const record = orderRecord({ fulfillments: shippedAll });
    const mismatch = { ...record, sale: { ...record.sale, shopifyReference: { ...record.sale.shopifyReference!, tax: yen(534) } } };
    const missing = { ...record, sale: { ...record.sale, shopifyReference: null } };

    expect(evaluateInvoiceIssue(issueContext(mismatch))).toMatchObject({ reconciliation: "mismatch", decision: "notIssuable" });
    expect(evaluateInvoiceIssue(issueContext(missing))).toMatchObject({ reconciliation: "dataMissing", decision: "notIssuable" });
  });

  it("別途請求の送料が 8% になっていれば要確認として発行しない", () => {
    const record = orderRecord({ fulfillments: shippedAll });
    const facts = resolveTaxFacts(
      { ...record, sale: { ...record.sale, shipping: shipping(700, { ratePercent: 8 }) } },
      "shippedAt"
    );

    expect(codes(facts.reasons)).toEqual(["shippingReducedRate"]);
  });

  it("当初の決済の状態が分からなければ発行しない。返金の決済の状態が分からないだけなら止めない", () => {
    const saleUnknown = orderRecord({
      fulfillments: shippedAll,
      payments: [payment("tx-sale", "sale", 5880, { status: "unknown" })],
    });
    const refundUnknown = orderRecord({
      fulfillments: shippedAll,
      payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 100, { status: "unknown" })],
    });

    expect(codes(evaluateInvoiceIssue(issueContext(saleUnknown)).reviewRequired)).toEqual(["paymentUnknown"]);
    expect(evaluateInvoiceIssue(issueContext(refundUnknown)).decision).toBe("issuable");
    expect(refundSummary(refundUnknown)?.needsReview).toBe(true);
  });

  it("発行済みの書類は、そのまま再表示する（後から組み立て直さない）", () => {
    const record = orderRecord({ fulfillments: shippedAll });
    const issued = evaluateInvoiceIssue(issueContext(record)).draft!;
    const ledger = appendDocument(emptyLedger(ORDER_ID), issued);
    const later = { ...record, dataIssues: [issueReason("orderEdited", "注文が編集されています")] };
    const evaluation = evaluateInvoiceIssue(issueContext(later, { ledger }));

    expect(evaluation.decision).toBe("alreadyIssued");
    expect(evaluation.existing).toBe(issued);
    expect(evaluation.draft).toBeNull();
  });
});
