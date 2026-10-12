import { sumYen, yen, type Yen } from "@/lib/invoice/money";
import {
  refundAmount,
  type InvoiceOrderRecord,
  type InvoiceRefund,
  type InvoiceSettlement,
} from "@/lib/invoice/order";

/**
 * 共通データモデルの精算状況。
 *
 * 注文履歴のお支払いサマリー（`accountOrderSettlement`）と同じ規則で決める。
 * 違いは 1 点だけ。同じ ID の決済記録が内容違いで重複していたら、どちらを
 * 信じるか決められないので `unknown` にする（注文履歴は先に来た方を使う）。
 */

const PAID_FINANCIAL_STATUSES = new Set([
  "PAID",
  "PARTIALLY_PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
]);

function sameContent(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 同じ ID の記録を 1 件にする。内容が食い違っていたら `null` */
function uniqueById<T>(items: readonly T[], idOf: (item: T) => string): T[] | null {
  const byId = new Map<string, T>();

  for (const item of items) {
    const existing = byId.get(idOf(item));

    if (existing === undefined) {
      byId.set(idOf(item), item);
    } else if (!sameContent(existing, item)) {
      return null;
    }
  }

  return [...byId.values()];
}

export function uniquePayments(record: InvoiceOrderRecord) {
  return uniqueById(record.payments, (payment) => payment.transactionId);
}

/** 同じ返金の重複を除いた返金の一覧。内容が食い違う重複があれば `null` */
export function uniqueRefunds(record: InvoiceOrderRecord): InvoiceRefund[] | null {
  return uniqueById(record.refunds, (refund) => refund.refundId);
}

function isSale(kind: string) {
  return kind === "sale" || kind === "capture";
}

export function invoiceSettlement(record: InvoiceOrderRecord): InvoiceSettlement {
  const payments = uniquePayments(record);

  if (!payments) {
    return { kind: "unknown" };
  }

  let paid = 0;
  let refunded = 0;
  let refundPending = 0;
  let refundFailed = false;
  let hasRefundTransaction = false;
  let manualPayment = false;

  for (const payment of payments) {
    if (isSale(payment.kind)) {
      if (payment.status === "success") {
        paid += payment.amount;
        manualPayment ||= payment.manual;
      }
      continue;
    }

    if (payment.kind !== "refund") {
      continue;
    }

    hasRefundTransaction = true;

    switch (payment.status) {
      case "success":
        refunded += payment.amount;
        manualPayment ||= payment.manual;
        break;
      case "pending":
        refundPending += payment.amount;
        break;
      case "failure":
        refundFailed = true;
        break;
      case "unknown":
        return { kind: "unknown" };
    }
  }

  const totalRefunded = record.shopifyStatus.totalRefunded ?? 0;
  const cancelled = record.cancellation !== null;
  const financialStatus = record.shopifyStatus.financialStatus?.trim().toUpperCase() ?? "";

  if (!cancelled && !hasRefundTransaction && totalRefunded === 0) {
    return {
      kind: "active",
      awaitingPayment: financialStatus !== "PAID",
      paid: yen(paid),
    };
  }

  if (cancelled && paid === 0 && !hasRefundTransaction && totalRefunded === 0) {
    return PAID_FINANCIAL_STATUSES.has(financialStatus)
      ? { kind: "unknown" }
      : { kind: "cancelledUnpaid" };
  }

  if (paid === 0 || refunded > paid) {
    return { kind: "unknown" };
  }

  return {
    kind: "settled",
    cancelled,
    paid: yen(paid),
    refunded: yen(refunded),
    refundPending: yen(refundPending),
    refundFailed,
    net: yen(paid - refunded),
    manualPayment,
  };
}

/**
 * 当初のお支払い（売上・売上確定の決済）。返金の決済は見ないので、返金の状況が
 * 分からなくても当初の入金は確かめられる。
 *
 * - `paid`：成功した決済があり、どれも決済日が分かる
 * - `unpaid`：成功した決済が無い（銀行振込の入金待ちなど）
 * - `unknown`：決済の記録が重複・矛盾している、状態や決済日が分からない、
 *   または決済が無いのに Shopify が支払い済みとしている
 */
export type OriginalPayment =
  | { status: "paid"; amount: Yen; receivedAt: string; manual: boolean }
  | { status: "unpaid" }
  | { status: "unknown" };

export function originalPayment(record: InvoiceOrderRecord): OriginalPayment {
  const payments = uniquePayments(record);

  if (!payments) {
    return { status: "unknown" };
  }

  const sales = payments.filter((payment) => isSale(payment.kind));
  const succeeded = sales.filter((payment) => payment.status === "success");

  if (sales.some((payment) => payment.status === "unknown")) {
    return { status: "unknown" };
  }
  if (succeeded.length === 0) {
    const financialStatus = record.shopifyStatus.financialStatus?.trim().toUpperCase() ?? "";
    return PAID_FINANCIAL_STATUSES.has(financialStatus) ? { status: "unknown" } : { status: "unpaid" };
  }

  const dates = succeeded.map((payment) => payment.processedAt);

  if (dates.some((date) => !date || Number.isNaN(Date.parse(date)))) {
    return { status: "unknown" };
  }

  return {
    status: "paid",
    amount: sumYen(succeeded.map((payment) => payment.amount)),
    receivedAt: [...(dates as string[])].sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) as string,
    manual: succeeded.some((payment) => payment.manual),
  };
}

/**
 * お客様に見せる返金の状況。金額にかかわらず、返還請求書を出せない返金でも表示する。
 * お金の動いた返金が無ければ `null`（入金前のキャンセルの返金の販売記録は数えない）。
 *
 * `needsReview` は、返金の決済・返金の記録・Shopify の返金合計が食い違う、状態の
 * 分からない決済がある、自動では扱わない返金がある、のどれか。
 */
export type RefundSummary = {
  refunded: Yen;
  pending: Yen;
  failed: boolean;
  needsReview: boolean;
};

export function refundSummary(record: InvoiceOrderRecord): RefundSummary | null {
  const payments = uniquePayments(record);
  const refunds = uniqueRefunds(record);
  const refundPayments = (payments ?? record.payments).filter((payment) => payment.kind === "refund");
  const totalRefunded = record.shopifyStatus.totalRefunded;
  const recorded = (refunds ?? record.refunds).some((refund) => refund.refundedAmount);

  if (
    payments &&
    refundPayments.length === 0 &&
    totalRefunded === 0 &&
    !recorded &&
    record.refundIssues.length === 0
  ) {
    return null;
  }

  const sumOf = (status: string) =>
    sumYen(refundPayments.filter((payment) => payment.status === status).map((payment) => payment.amount));
  const refunded = sumOf("success");

  return {
    refunded,
    pending: sumOf("pending"),
    failed: refundPayments.some((payment) => payment.status === "failure"),
    needsReview:
      !payments ||
      !refunds ||
      record.refundIssues.length > 0 ||
      refundPayments.some((payment) => payment.status === "unknown") ||
      totalRefunded !== refunded ||
      refunds.some((refund) => invoiceRefundStatus(record, refund) === "unknown"),
  };
}

/** 入金が確認できている（Shopify の記録上）か。手動決済は当店の登録による */
export function settlementIsPaid(settlement: InvoiceSettlement) {
  return (
    (settlement.kind === "active" && !settlement.awaitingPayment && settlement.paid > 0) ||
    settlement.kind === "settled"
  );
}

/**
 * 返金 1 件の状態。
 *
 * - `completed`：お金の返金が完了し、返金の記録・決済の記録・販売記録の金額がすべて合う
 * - `processing`：手続き中の返金の決済がある
 * - `failed`：失敗した返金の決済がある
 * - `noPayment`：お金の動いていない返金（入金前のキャンセルで Shopify が作る返金の販売記録）
 * - `unknown`：上のどれとも確定できない
 *
 * Customer Account API の返金の記録は、どの決済で返したかを持たない。そのため返金ごとの
 * 決済は確かめられず、注文全体で「成功した返金の決済の合計」「返金の記録の合計」
 * 「Shopify の返金合計」の 3 つが一致するときだけ完了とする。実際の返金のデータでは
 * まだ確かめていない（部分返金・全額返金・複数回の返金とも未検証）。
 */
export type InvoiceRefundStatus = "completed" | "processing" | "failed" | "noPayment" | "unknown";

export function invoiceRefundStatus(
  record: InvoiceOrderRecord,
  refund: InvoiceRefund
): InvoiceRefundStatus {
  const payments = uniquePayments(record);
  const refunds = uniqueRefunds(record);

  if (!payments || !refunds) {
    return "unknown";
  }

  const refundTransactions = payments.filter((payment) => payment.kind === "refund");
  const totalRefunded = record.shopifyStatus.totalRefunded;
  const paid = payments.some((payment) => isSale(payment.kind) && payment.status === "success");

  if (refund.refundedAmount === null || refund.refundedAmount === 0) {
    const nothingMoved =
      !paid &&
      refundTransactions.length === 0 &&
      totalRefunded === 0 &&
      refunds.every((candidate) => !candidate.refundedAmount);

    return nothingMoved ? "noPayment" : "unknown";
  }

  if (refundTransactions.some((payment) => payment.status === "unknown")) {
    return "unknown";
  }
  if (refundTransactions.some((payment) => payment.status === "failure")) {
    return "failed";
  }
  if (refundTransactions.some((payment) => payment.status === "pending")) {
    return "processing";
  }

  const succeeded = sumYen(refundTransactions.map((payment) => payment.amount));
  const recorded = sumYen(refunds.map((candidate) => candidate.refundedAmount ?? yen(0)));

  if (succeeded !== recorded || totalRefunded !== succeeded) {
    return "unknown";
  }

  return refund.refundedAmount === refundAmount(refund) ? "completed" : "unknown";
}
