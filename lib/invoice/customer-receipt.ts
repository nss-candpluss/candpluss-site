import {
  emptyLedger,
  invoiceStatementBreakdown,
  InvoiceDocumentError,
  type InvoiceDocument,
  type InvoiceIssuer,
  type ReturnInvoiceDocument,
  type SimplifiedInvoiceDocument,
} from "@/lib/invoice/documents";
import {
  invoiceOrderFromCustomerAccount,
  type CustomerAccountInvoiceOrder,
} from "@/lib/invoice/customer-account-order";
import {
  moneyRefunds,
  planOrderDocuments,
  type InvoiceIssueEvaluation,
  type InvoiceIssuePolicy,
  type TransactionDateBasis,
} from "@/lib/invoice/eligibility";
import { InvoiceMoneyError, type Yen } from "@/lib/invoice/money";
import {
  issueReason,
  refundAmount,
  type InvoiceIssueReason,
  type InvoiceOrderRecord,
} from "@/lib/invoice/order";
import { refundSummary, type RefundSummary } from "@/lib/invoice/settlement";
import type { InvoiceTaxConfig } from "@/lib/invoice/tax";

/**
 * 会員ページでお客様に渡す書類と、返金の状況。
 *
 * - `invoice`：領収書 兼 適格簡易請求書。当初のご注文内容・お支払い・出荷だけで決まり、
 *   後の返金の状況では止めない
 * - `refunds`：返金の状況（返金済み・返金待ち・返金の失敗・要確認）。返還請求書を
 *   出せない返金でも、お客様に示す
 * - `returnInvoices`：お金の動いた返金ごとの適格返還請求書
 *
 * 理由（`reasons`）は当店の確認用で、そのままお客様に見せる文言ではない。
 * `invalidData` は、販売記録を書類の形に変換できなかった（円以外・金額の矛盾など）。
 */
export type DocumentAvailability<D extends InvoiceDocument> =
  | { status: "issuable"; document: D }
  | { status: "noTransaction" }
  | { status: "unavailable"; reasons: InvoiceIssueReason[] };

export type ReturnInvoiceAvailability = DocumentAvailability<ReturnInvoiceDocument> & {
  refundId: string;
  /** 返還等の金額（税込）。販売記録から読めなければ `null` */
  returnedAmount: Yen | null;
};

export type CustomerReceiptResult =
  | {
      status: "evaluated";
      invoice: DocumentAvailability<SimplifiedInvoiceDocument>;
      refunds: RefundSummary | null;
      returnInvoices: ReturnInvoiceAvailability[];
    }
  | { status: "invalidData"; reasons: InvoiceIssueReason[] };

export type CustomerReceiptContext = {
  /** Shopify から注文を取得した日時。書類には載せない */
  capturedAt: string;
  issuer: InvoiceIssuer;
  rulesVersion: string;
  taxConfig: InvoiceTaxConfig;
  transactionDateBasis: TransactionDateBasis;
  policy: InvoiceIssuePolicy;
};

function reasonsOf(evaluation: InvoiceIssueEvaluation<InvoiceDocument>) {
  return [
    ...evaluation.taxFacts.reasons,
    ...evaluation.legal.missing,
    ...evaluation.policy.reasons,
    ...evaluation.reviewRequired,
    ...(evaluation.reconciliation === "match"
      ? []
      : [issueReason(`reconcile:${evaluation.reconciliation}`, "Shopify の販売記録の金額・税額と一致しません")]),
  ];
}

function invoiceAvailability(
  evaluation: InvoiceIssueEvaluation<SimplifiedInvoiceDocument>,
  record: InvoiceOrderRecord
): DocumentAvailability<SimplifiedInvoiceDocument> {
  const result = availability(evaluation);

  if (result.status !== "issuable") {
    return result;
  }

  // 集計欄の内訳を Shopify の税額の割り振りから作れない注文は出さない（`invoiceStatementBreakdown`）
  const { reasons } = invoiceStatementBreakdown(record.sale, result.document.taxSummary);

  return reasons.length > 0 ? { status: "unavailable", reasons } : result;
}

function availability<D extends InvoiceDocument>(
  evaluation: InvoiceIssueEvaluation<D>
): DocumentAvailability<D> {
  if (evaluation.decision === "issuable" && evaluation.draft) {
    return { status: "issuable", document: evaluation.draft };
  }
  if (evaluation.decision === "noTransaction") {
    return { status: "noTransaction" };
  }
  return { status: "unavailable", reasons: reasonsOf(evaluation) };
}

export function customerReceiptFromAccountOrder(
  order: CustomerAccountInvoiceOrder,
  context: CustomerReceiptContext
): CustomerReceiptResult {
  try {
    const record = invoiceOrderFromCustomerAccount(order, {
      capturedAt: context.capturedAt,
      priceBasis: context.taxConfig.priceBasis,
    });
    // 発行した書類の保存方法が決まるまでは、保存済みの書類と突き合わせず、毎回組み立てる
    const plan = planOrderDocuments({
      record,
      ledger: emptyLedger(record.sale.orderId),
      issuer: context.issuer,
      rulesVersion: context.rulesVersion,
      taxConfig: context.taxConfig,
      transactionDateBasis: context.transactionDateBasis,
      policy: context.policy,
    });
    const refunds = moneyRefunds(record);

    return {
      status: "evaluated",
      invoice: invoiceAvailability(plan.invoice, record),
      refunds: refundSummary(record),
      returnInvoices: plan.returns.map((evaluation, index) => {
        const refund = refunds[index];
        let returnedAmount: Yen | null = null;
        try {
          returnedAmount = refundAmount(refund);
        } catch (error) {
          if (!(error instanceof InvoiceMoneyError)) {
            throw error;
          }
        }

        return {
          ...availability(evaluation),
          refundId: refund.refundId,
          returnedAmount,
        };
      }),
    };
  } catch (error) {
    if (error instanceof InvoiceMoneyError || error instanceof InvoiceDocumentError) {
      return { status: "invalidData", reasons: [issueReason("invalidData", error.message)] };
    }
    throw error;
  }
}
