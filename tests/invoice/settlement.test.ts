import { describe, expect, it } from "vitest";

import { yen } from "@/lib/invoice/money";
import {
  invoiceRefundStatus,
  invoiceSettlement,
  settlementIsPaid,
  uniqueRefunds,
} from "@/lib/invoice/settlement";

import { at, lineRefund, orderRecord, payment, shippedOrder } from "./fixtures";

/** テストデータのみ（Shopify API 未検証） */
describe("共通データモデルの精算状況", () => {
  it("未入金とキャンセルを混同しない", () => {
    const unpaid = orderRecord({
      payments: [payment("tx-sale", "sale", 5880, { status: "pending", manual: true })],
      shopifyStatus: { financialStatus: "PENDING", totalRefunded: yen(0) },
    });
    const cancelledUnpaid = orderRecord({
      payments: [],
      cancellation: { cancelledAt: at.cancelled, reason: "customer" },
      shopifyStatus: { financialStatus: "VOIDED", totalRefunded: yen(0) },
    });

    expect(invoiceSettlement(unpaid)).toEqual({ kind: "active", awaitingPayment: true, paid: 0 });
    expect(invoiceSettlement(cancelledUnpaid)).toEqual({ kind: "cancelledUnpaid" });
    expect(settlementIsPaid(invoiceSettlement(unpaid))).toBe(false);
    expect(settlementIsPaid(invoiceSettlement(cancelledUnpaid))).toBe(false);
  });

  it("キャンセル済みなのに Shopify が支払い済みとしているときは決めない", () => {
    const record = orderRecord({
      payments: [],
      cancellation: { cancelledAt: at.cancelled, reason: null },
      shopifyStatus: { financialStatus: "PAID", totalRefunded: yen(0) },
    });

    expect(invoiceSettlement(record)).toEqual({ kind: "unknown" });
  });

  it("入金済みの注文", () => {
    const settlement = invoiceSettlement(orderRecord());

    expect(settlement).toEqual({ kind: "active", awaitingPayment: false, paid: 5880 });
    expect(settlementIsPaid(settlement)).toBe(true);
  });

  it("返金が完了した注文", () => {
    const record = shippedOrder([lineRefund("refund-1", "rope", 1, 1740)]);

    expect(invoiceSettlement(record)).toMatchObject({ kind: "settled", refunded: 1740, net: 4140 });
    expect(invoiceRefundStatus(record, record.refunds[0])).toBe("completed");
  });

  it("複数回の返金は、決済・返金の記録・返金合計の 3 つがそろって合うときだけ完了にする", () => {
    const record = shippedOrder([
      lineRefund("refund-1", "rope", 1, 1740),
      lineRefund("refund-2", "rope-long", 1, 2400),
    ]);

    expect(record.refunds.map((refund) => invoiceRefundStatus(record, refund))).toEqual([
      "completed",
      "completed",
    ]);

    const totalDiffers = { ...record, shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(1740) } };
    expect(invoiceRefundStatus(totalDiffers, record.refunds[0])).toBe("unknown");
  });

  it("手続き中の返金の決済があれば、どの返金の決済か分からないので、どの返金も完了にしない", () => {
    const record = orderRecord({
      payments: [
        payment("tx-sale", "sale", 5880),
        payment("tx-r1", "refund", 1740),
        payment("tx-r2", "refund", 2400, { status: "pending" }),
      ],
      refunds: [lineRefund("refund-1", "rope", 1, 1740), lineRefund("refund-2", "rope-long", 1, 2400)],
      shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(1740) },
    });

    expect(invoiceSettlement(record)).toMatchObject({ kind: "settled", refunded: 1740, refundPending: 2400 });
    expect(invoiceRefundStatus(record, record.refunds[0])).toBe("processing");
    expect(invoiceRefundStatus(record, record.refunds[1])).toBe("processing");
  });

  it("失敗した返金・決済の見つからない返金・金額の合わない返金は完了にしない", () => {
    const failed = orderRecord({
      payments: [payment("tx-sale", "sale", 5880), payment("tx-r1", "refund", 1740, { status: "failure" })],
      refunds: [lineRefund("r1", "rope", 1, 1740)],
      shopifyStatus: { financialStatus: "PAID", totalRefunded: yen(0) },
    });
    const noTransaction = orderRecord({
      refunds: [lineRefund("r2", "rope", 1, 1740)],
      shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(1740) },
    });
    // 返金の記録の返金額（1,000 円）と、販売記録の返金の内訳（1,740 円）が合わない
    const amountDiffers = shippedOrder([lineRefund("r3", "rope", 1, 1740, 1000)]);

    expect(invoiceRefundStatus(failed, failed.refunds[0])).toBe("failed");
    expect(invoiceRefundStatus(noTransaction, noTransaction.refunds[0])).toBe("unknown");
    expect(invoiceRefundStatus(amountDiffers, amountDiffers.refunds[0])).toBe("unknown");
  });

  it("入金前のキャンセルで作られた返金の販売記録は、お金の返金と区別する（#1056〜#1058 と同じ形）", () => {
    const record = orderRecord({
      payments: [
        payment("tx-sale", "sale", 5880, { status: "pending", manual: true }),
        payment("tx-void", "void", 5880, { parentTransactionId: "tx-sale", manual: true }),
      ],
      cancellation: { cancelledAt: at.cancelled, reason: "customer" },
      refunds: [lineRefund("refund-cancel", "rope", 2, 3480, null)],
      shopifyStatus: { financialStatus: "VOIDED", totalRefunded: yen(0) },
    });

    expect(invoiceSettlement(record)).toEqual({ kind: "cancelledUnpaid" });
    expect(invoiceRefundStatus(record, record.refunds[0])).toBe("noPayment");
  });

  it("返金の記録が無くても、入金済みの注文なら「お金が動いていない」と決めつけない", () => {
    const record = orderRecord({ refunds: [lineRefund("r0", "rope", 1, 1740, null)] });

    expect(invoiceRefundStatus(record, record.refunds[0])).toBe("unknown");
  });

  it("同じ返金・同じ決済の記録を重複して数えない", () => {
    const refund = lineRefund("refund-1", "rope", 1, 1740);
    const record = orderRecord({
      payments: [
        payment("tx-sale", "sale", 5880),
        payment("tx-sale", "sale", 5880),
        payment("tx-r1", "refund", 1740),
        payment("tx-r1", "refund", 1740),
      ],
      refunds: [refund, refund],
      shopifyStatus: { financialStatus: "PARTIALLY_REFUNDED", totalRefunded: yen(1740) },
    });

    expect(uniqueRefunds(record)).toHaveLength(1);
    expect(invoiceSettlement(record)).toMatchObject({ kind: "settled", paid: 5880, refunded: 1740 });
    expect(invoiceRefundStatus(record, refund)).toBe("completed");
  });

  it("同じ ID で内容が違う記録は確定しない", () => {
    const conflictingPayments = orderRecord({
      payments: [payment("tx-sale", "sale", 5880), payment("tx-sale", "sale", 5000)],
    });
    const conflictingRefunds = shippedOrder([
      lineRefund("refund-1", "rope", 1, 1740),
      lineRefund("refund-1", "rope", 1, 1000),
    ]);

    expect(invoiceSettlement(conflictingPayments)).toEqual({ kind: "unknown" });
    expect(uniqueRefunds(conflictingRefunds)).toBeNull();
    expect(invoiceRefundStatus(conflictingRefunds, conflictingRefunds.refunds[0])).toBe("unknown");
  });
});
