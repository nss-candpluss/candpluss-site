import {
  appendDocument,
  buildInvoiceDocument,
  buildReturnInvoiceDocument,
  effectiveDocuments,
  invoiceDocumentId,
  tokyoDate,
  type InvoiceDocument,
  type InvoiceDocumentLedger,
  type InvoiceIssuer,
  type InvoiceReceipt,
  type ReturnInvoiceDocument,
  type SimplifiedInvoiceDocument,
} from "@/lib/invoice/documents";
import {
  issueReason,
  type InvoiceIssueReason,
  type InvoiceOrderRecord,
  type InvoiceRefund,
} from "@/lib/invoice/order";
import { reconcileOrder, type ReconcileStatus } from "@/lib/invoice/reconcile";
import {
  invoiceRefundStatus,
  originalPayment,
  uniqueRefunds,
  type InvoiceRefundStatus,
} from "@/lib/invoice/settlement";
import type { InvoiceTaxConfig } from "@/lib/invoice/tax";

/**
 * 書類を発行できるかの判定。次の 4 つを分けて判定し、混ぜない。
 *
 * 1. 取引情報（`taxFacts`）：取引年月日・金額などが確定しているか。
 *    確定していない値は推測で埋めない。
 * 2. 法定記載事項（`legal`）：組み立てた書類に、記載が必要な事項がそろっているか。
 * 3. 当店の運用（`policy`）：会員ページから発行してよいか。
 * 4. Shopify との照合（`reconciliation`）：販売記録の金額・税額と一致しているか。
 *
 * 4 つとも満たし、要確認の事項も無いときだけ発行できる。
 *
 * 領収書 兼 適格簡易請求書は、当初のご注文内容・当初のお支払い・出荷だけで判定し、
 * 後の返金の状況では止めない（返金は返金ごとの適格返還請求書で扱う）。
 * 当初のご注文内容が確定できない（注文編集など）ときは止める。
 *
 * 自動で扱うのは、C AND+S の通常の注文（注文全体を 1 回で出荷する・入金済み）と、
 * 出荷後のお金の返金だけ。分割出荷・出荷後のキャンセル・注文編集・出荷前の返金など
 * の例外は要確認で止め、当店が個別に対応する。
 */

export type { InvoiceIssueReason } from "@/lib/invoice/order";

/**
 * 取引年月日（売上計上）の基準。`orderedAt` はご注文日、`shippedAt` は出荷日。
 * 株式会社NSS の売上計上の方法と合わせる必要があり、未確定。
 */
export type TransactionDateBasis = "orderedAt" | "shippedAt";

export type InvoiceIssuePolicy = {
  /** 会員ページから書類を発行するか */
  memberPageIssueEnabled: boolean;
  /** 適格返還請求書を発行するか。返金の実データで確かめるまでは止める */
  returnInvoiceEnabled: boolean;
};

export type InvoiceTaxFacts =
  | {
      status: "confirmed";
      transactionDate: string;
      /** 売上を計上した日時（ご注文日時か出荷日時）。返金が計上後かの判定に使う */
      recognizedAt: string;
      reasons: [];
    }
  | { status: "unconfirmed"; reasons: InvoiceIssueReason[] }
  /** 課税取引が成立していない（出荷前のキャンセル） */
  | { status: "noTransaction"; reasons: InvoiceIssueReason[] };

export type InvoiceLegalCheck =
  | { status: "complete"; missing: [] }
  | { status: "incomplete"; missing: InvoiceIssueReason[] }
  | { status: "notEvaluated"; missing: [] };

export type InvoicePolicyCheck = {
  status: "allowed" | "blocked";
  reasons: InvoiceIssueReason[];
};

export type InvoiceIssueEvaluation<D extends InvoiceDocument> = {
  decision: "alreadyIssued" | "issuable" | "notIssuable" | "noTransaction";
  /** 発行済みの書類（訂正があれば最後の訂正）。内容はそのまま再表示する */
  existing: D | null;
  /** 取引情報が確定しているときに組み立てた書類の案。発行するまで台帳には入らない */
  draft: D | null;
  taxFacts: InvoiceTaxFacts;
  legal: InvoiceLegalCheck;
  policy: InvoicePolicyCheck;
  reconciliation: ReconcileStatus;
  /** 自動では決めず、当店が確かめる必要がある事項 */
  reviewRequired: InvoiceIssueReason[];
};

export type InvoiceIssueContext = {
  record: InvoiceOrderRecord;
  ledger: InvoiceDocumentLedger;
  issuer: InvoiceIssuer;
  taxConfig: InvoiceTaxConfig;
  transactionDateBasis: TransactionDateBasis;
  policy: InvoiceIssuePolicy;
  /** 書類を組み立てる決まりの版 */
  rulesVersion: string;
};

const reason = issueReason;

/** 有効な（取消済みでない）出荷の記録の、商品ごとの出荷数 */
function shippedQuantities(record: InvoiceOrderRecord) {
  const quantities = new Map<string, number>();

  for (const fulfillment of record.fulfillments) {
    if (fulfillment.status !== "success") {
      continue;
    }
    for (const part of fulfillment.lines) {
      quantities.set(part.lineId, (quantities.get(part.lineId) ?? 0) + part.quantity);
    }
  }

  return quantities;
}

/** ご注文の商品がすべて、有効な出荷の記録で出荷済みか。配達済みの記録は求めない */
export function allLinesShipped(record: InvoiceOrderRecord) {
  const quantities = shippedQuantities(record);

  return (
    record.sale.lines.length > 0 &&
    record.sale.lines.every((line) => (quantities.get(line.lineId) ?? 0) >= line.quantity)
  );
}

/** 取引情報が確定しているか。取引年月日もここで決める */
export function resolveTaxFacts(
  record: InvoiceOrderRecord,
  basis: TransactionDateBasis
): InvoiceTaxFacts {
  const { sale } = record;
  const shipped = record.fulfillments.filter((fulfillment) => fulfillment.status === "success");

  if (record.cancellation && shipped.length === 0) {
    return {
      status: "noTransaction",
      reasons: [reason("cancelledBeforeShipment", "出荷前にキャンセルされた注文です")],
    };
  }

  const reasons: InvoiceIssueReason[] = [...record.dataIssues];

  if (sale.lines.length === 0) {
    reasons.push(reason("noLines", "ご注文の商品がありません"));
  }
  if (sale.shipping?.ratePercent === 8) {
    reasons.push(
      reason("shippingReducedRate", "別途請求の送料に軽減税率が設定されています（原則は標準税率）")
    );
  }

  const shippedQuantity = shippedQuantities(record);

  for (const lineId of shippedQuantity.keys()) {
    if (!sale.lines.some((line) => line.lineId === lineId)) {
      reasons.push(reason("unknownFulfillmentLine", `出荷の記録の ${lineId} がご注文内容にありません`));
    }
  }
  for (const line of sale.lines) {
    const quantity = shippedQuantity.get(line.lineId) ?? 0;

    if (quantity > line.quantity) {
      reasons.push(reason("overShipped", `${line.description} の出荷数がご注文の数量を超えています`));
    } else if (basis === "shippedAt" && quantity < line.quantity) {
      reasons.push(reason("notShipped", `${line.description} の出荷が済んでいません`));
    }
  }

  if (basis === "orderedAt") {
    return reasons.length > 0
      ? { status: "unconfirmed", reasons }
      : {
          status: "confirmed",
          transactionDate: tokyoDate(sale.processedAt),
          recognizedAt: sale.processedAt,
          reasons: [],
        };
  }

  const shippedAt = shipped.map((fulfillment) => fulfillment.shippedAt);

  if (shippedAt.some((dateTime) => !dateTime)) {
    reasons.push(reason("shippedAtMissing", "出荷日の分からない出荷があります"));
  } else if (new Set(shippedAt.map((dateTime) => tokyoDate(dateTime as string))).size > 1) {
    reasons.push(reason("multipleShipmentDates", "出荷日が複数あります（分割出荷は個別に対応します）"));
  }

  if (reasons.length > 0) {
    return { status: "unconfirmed", reasons };
  }

  const recognizedAt = [...(shippedAt as string[])].sort(
    (a, b) => Date.parse(a) - Date.parse(b)
  ).at(-1) as string;

  return {
    status: "confirmed",
    transactionDate: tokyoDate(recognizedAt),
    recognizedAt,
    reasons: [],
  };
}

/**
 * 返金 1 件の税務上の扱い。
 *
 * - `returnOfConsideration`：売上を計上した後の、お金の返金（適格返還請求書の対象）
 * - `noPayment`：お金の動いていない返金（入金前のキャンセル）
 * - `undetermined`：自動では決めない（返金が未完了、売上計上前の返金など）
 */
export type RefundAssessment = {
  refundId: string;
  payment: InvoiceRefundStatus;
  treatment: "returnOfConsideration" | "noPayment" | "undetermined";
  reasons: InvoiceIssueReason[];
};

export function assessRefund(
  record: InvoiceOrderRecord,
  refund: InvoiceRefund,
  facts: InvoiceTaxFacts
): RefundAssessment {
  const payment = invoiceRefundStatus(record, refund);
  const result = (treatment: RefundAssessment["treatment"], reasons: InvoiceIssueReason[] = []) => ({
    refundId: refund.refundId,
    payment,
    treatment,
    reasons,
  });

  switch (payment) {
    case "noPayment":
      return result("noPayment");
    case "processing":
      return result("undetermined", [reason("refundProcessing", "返金の手続き中です")]);
    case "failed":
      return result("undetermined", [reason("refundFailed", "返金が完了していません")]);
    case "unknown":
      return result("undetermined", [
        reason("refundUnknown", "返金の販売記録と返金の決済の対応を確かめられません"),
      ]);
    case "completed":
      break;
  }

  if (facts.status !== "confirmed") {
    return result("undetermined", facts.reasons);
  }
  if (Date.parse(refund.createdAt) < Date.parse(facts.recognizedAt)) {
    return result("undetermined", [
      reason("refundBeforeRecognition", "売上を計上する前の返金です（個別に対応します）"),
    ]);
  }

  return result("returnOfConsideration");
}

const REGISTRATION_NUMBER = /^T\d{13}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 法定記載事項の不足。
 *
 * 適格簡易請求書（インボイス Q&A 問58）：発行事業者の名称と登録番号、取引年月日、
 * 取引内容（軽減税率の対象はその旨）、税率ごとの対価の合計額、税率ごとの消費税額か
 * 適用税率（この実装では両方載せる）。宛名は不要。
 * 適格返還請求書（問60）：発行事業者の名称と登録番号、返還等の年月日と元の取引年月日、
 * 返還等の内容、税率ごとの返還等の金額、税率ごとの消費税額か適用税率。
 * 領収書の欄：入金を確認した金額と日付（消費税法の記載事項ではなく、領収書の役割）。
 */
export function legalRequirementIssues(document: InvoiceDocument): InvoiceIssueReason[] {
  const missing: InvoiceIssueReason[] = [];

  if (!document.issuer.name.trim()) {
    missing.push(reason("issuerName", "発行事業者の名称がありません"));
  }
  if (!REGISTRATION_NUMBER.test(document.issuer.registrationNumber.trim())) {
    missing.push(reason("registrationNumber", "登録番号（T + 13 桁）がありません"));
  }
  const items =
    document.kind === "invoice"
      ? [...document.lines, ...(document.shipping ? [{ ...document.shipping, description: document.shipping.title }] : [])]
      : [...document.lines, ...document.otherAmounts];

  if (items.length === 0) {
    missing.push(reason("contents", "取引の内容がありません"));
  }
  if (items.some((item) => !item.description.trim())) {
    missing.push(reason("description", "内容の書かれていない行があります"));
  }

  const itemTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const summaryTotal =
    document.taxConfig.priceBasis === "taxIncluded"
      ? document.taxSummary.total
      : document.taxSummary.total - document.taxSummary.tax;

  if (itemTotal !== summaryTotal) {
    missing.push(reason("totalsMismatch", "行の金額の合計と税率ごとの合計が合いません"));
  }

  if (document.kind === "invoice") {
    if (!DATE.test(document.transactionDate)) {
      missing.push(reason("transactionDate", "取引年月日がありません"));
    }
    if (document.receipt.receivedAmount <= 0) {
      missing.push(reason("receiptAmount", "領収した金額がありません"));
    }
    if (!DATE.test(document.receipt.receivedDate)) {
      missing.push(reason("receiptDate", "入金の日付がありません"));
    }
  } else {
    if (!DATE.test(document.returnDate)) {
      missing.push(reason("returnDate", "返還等の年月日がありません"));
    }
    if (!DATE.test(document.originalTransactionDate)) {
      missing.push(reason("originalTransactionDate", "返還の元になった取引の年月日がありません"));
    }
    if (!document.relatedInvoiceId.trim()) {
      missing.push(reason("relatedInvoice", "元の書類がありません"));
    }
  }

  return missing;
}

function legalCheck(document: InvoiceDocument | null, extra: InvoiceIssueReason[] = []): InvoiceLegalCheck {
  if (!document) {
    return extra.length > 0 ? { status: "incomplete", missing: extra } : { status: "notEvaluated", missing: [] };
  }

  const missing = [...extra, ...legalRequirementIssues(document)];

  return missing.length === 0 ? { status: "complete", missing: [] } : { status: "incomplete", missing };
}

function policyCheck(context: InvoiceIssueContext, kind: InvoiceDocument["kind"]): InvoicePolicyCheck {
  const reasons: InvoiceIssueReason[] = [];

  if (!context.policy.memberPageIssueEnabled) {
    reasons.push(reason("memberPageDisabled", "会員ページからの発行は停止中です"));
  }
  if (kind === "invoice" && originalPayment(context.record).status === "unpaid") {
    reasons.push(reason("unpaid", "領収書を兼ねるので、入金を確認できた注文に限って発行します"));
  }
  // 取引年月日の基準にかかわらず、セルフ発行は出荷後に限る（出荷前のご希望は個別に対応する）
  if (kind === "invoice" && !allLinesShipped(context.record)) {
    reasons.push(reason("awaitingShipment", "商品の出荷前は、会員ページからは発行しません"));
    // 未出荷の商品を返金・キャンセルした注文は、待っても出荷されない。待機の案内にしない
    if (context.record.refunds.length > 0 || context.record.cancellation) {
      reasons.push(reason("unshippedRefunded", "未出荷の商品に返金・キャンセルがあります（個別に対応します）"));
    }
  }
  if (kind === "returnInvoice" && !context.policy.returnInvoiceEnabled) {
    reasons.push(reason("returnInvoiceDisabled", "返金の実データで確かめるまで、返還請求書は発行しません"));
  }

  return { status: reasons.length === 0 ? "allowed" : "blocked", reasons };
}

/**
 * 領収書の欄。当初の売上・売上確定の決済の合計と、最後の決済の日。返金の決済は見ない。
 * 入金を確認できない、または決済の日が分からなければ `null`。
 */
export function receiptFromPayments(record: InvoiceOrderRecord): InvoiceReceipt | null {
  const payment = originalPayment(record);

  return payment.status === "paid"
    ? {
        receivedAmount: payment.amount,
        receivedDate: tokyoDate(payment.receivedAt),
        manualPayment: payment.manual,
      }
    : null;
}

function currentInvoice(ledger: InvoiceDocumentLedger) {
  return (
    effectiveDocuments(ledger).find(
      (document): document is SimplifiedInvoiceDocument => document.kind === "invoice"
    ) ?? null
  );
}

function currentReturnInvoice(ledger: InvoiceDocumentLedger, refundId: string) {
  return (
    effectiveDocuments(ledger).find(
      (document): document is ReturnInvoiceDocument =>
        document.kind === "returnInvoice" && document.refundId === refundId
    ) ?? null
  );
}

/**
 * 返金のうち、お金の動いた（動いたかもしれない）もの。返金の記録が重複・矛盾して
 * いれば空で、返金の状況（`refundSummary`）の要確認として扱う。
 */
export function moneyRefunds(record: InvoiceOrderRecord) {
  return (uniqueRefunds(record) ?? []).filter(
    (refund) => invoiceRefundStatus(record, refund) !== "noPayment"
  );
}

function returnReview(record: InvoiceOrderRecord, facts: InvoiceTaxFacts) {
  const reasons = [...record.refundIssues];

  if (record.cancellation && facts.status !== "noTransaction") {
    reasons.push(reason("cancelledAfterShipment", "出荷後にキャンセルされた注文です（個別に対応します）"));
  }

  return reasons;
}

function decide<D extends InvoiceDocument>(
  evaluation: Omit<InvoiceIssueEvaluation<D>, "decision">
): InvoiceIssueEvaluation<D> {
  if (evaluation.existing) {
    return { ...evaluation, decision: "alreadyIssued" };
  }
  if (evaluation.taxFacts.status === "noTransaction" && evaluation.reviewRequired.length === 0) {
    return { ...evaluation, decision: "noTransaction" };
  }

  const issuable =
    evaluation.draft !== null &&
    evaluation.taxFacts.status === "confirmed" &&
    evaluation.legal.status === "complete" &&
    evaluation.policy.status === "allowed" &&
    evaluation.reconciliation === "match" &&
    evaluation.reviewRequired.length === 0;

  return { ...evaluation, decision: issuable ? "issuable" : "notIssuable" };
}

/** 領収書 兼 適格簡易請求書を発行できるか */
export function evaluateInvoiceIssue(
  context: InvoiceIssueContext
): InvoiceIssueEvaluation<SimplifiedInvoiceDocument> {
  const { record } = context;
  const existing = currentInvoice(context.ledger);
  const taxFacts = resolveTaxFacts(record, context.transactionDateBasis);
  const reviewRequired: InvoiceIssueReason[] = [];

  if (taxFacts.status !== "noTransaction" && originalPayment(record).status === "unknown") {
    reviewRequired.push(
      reason("paymentUnknown", "当初のお支払いの記録（金額・状態・日付）を確定できません")
    );
  }

  const receipt = receiptFromPayments(record);
  const draft =
    !existing && taxFacts.status === "confirmed" && receipt
      ? buildInvoiceDocument({
          sale: record.sale,
          transactionDate: taxFacts.transactionDate,
          receipt,
          issuer: context.issuer,
          rulesVersion: context.rulesVersion,
          taxConfig: context.taxConfig,
        })
      : null;

  if (draft && draft.receipt.receivedAmount !== draft.taxSummary.total) {
    reviewRequired.push(
      reason("receiptAmountMismatch", "入金額と請求の合計が合いません（一部入金・注文編集など）")
    );
  }

  return decide({
    existing,
    draft,
    taxFacts,
    legal: legalCheck(draft),
    policy: policyCheck(context, "invoice"),
    reconciliation: reconcileOrder(record, context.taxConfig).sale.status,
    reviewRequired,
  });
}

/** 返金 1 件の適格返還請求書を発行できるか */
export function evaluateReturnInvoiceIssue(
  context: InvoiceIssueContext & { refundId: string }
): InvoiceIssueEvaluation<ReturnInvoiceDocument> {
  const { record } = context;
  const existing = currentReturnInvoice(context.ledger, context.refundId);
  const facts = resolveTaxFacts(record, context.transactionDateBasis);
  const refund = uniqueRefunds(record)?.find((candidate) => candidate.refundId === context.refundId);
  const policy = policyCheck(context, "returnInvoice");
  const reviewRequired = returnReview(record, facts);
  const reconciliations = reconcileOrder(record, context.taxConfig);
  const refundReconciliation = reconciliations.refunds[context.refundId]?.status ?? "dataMissing";
  const reconciliation: ReconcileStatus =
    reconciliations.sale.status !== "match" ? reconciliations.sale.status : refundReconciliation;

  const notReady = (status: "unconfirmed" | "noTransaction", reasons: InvoiceIssueReason[]) =>
    decide<ReturnInvoiceDocument>({
      existing,
      draft: null,
      taxFacts: { status, reasons },
      legal: { status: "notEvaluated", missing: [] },
      policy,
      reconciliation,
      reviewRequired,
    });

  if (!refund) {
    return notReady("unconfirmed", [reason("refundNotFound", "返金の記録を確定できません")]);
  }

  const assessment = assessRefund(record, refund, facts);

  if (assessment.treatment === "noPayment") {
    return notReady("noTransaction", [reason("refundNoPayment", "お金の動いていない返金です")]);
  }
  if (facts.status === "noTransaction") {
    return notReady("noTransaction", [
      reason("refundBeforeShipment", "出荷前のキャンセルの返金は、返還請求書の対象ではありません"),
    ]);
  }
  if (assessment.treatment !== "returnOfConsideration" || facts.status !== "confirmed") {
    return notReady("unconfirmed", assessment.reasons);
  }

  const draft = existing
    ? null
    : buildReturnInvoiceDocument({
        sale: record.sale,
        refund,
        relatedInvoiceId:
          currentInvoice(context.ledger)?.documentId ?? invoiceDocumentId(record.sale.orderId),
        originalTransactionDate: facts.transactionDate,
        issuer: context.issuer,
        rulesVersion: context.rulesVersion,
        taxConfig: context.taxConfig,
      });

  return decide({
    existing,
    draft,
    taxFacts: facts,
    legal: legalCheck(draft),
    policy,
    reconciliation,
    reviewRequired,
  });
}

/**
 * 注文の書類をまとめて判定する。領収書 兼 適格簡易請求書は当初の内容のまま判定し、
 * 返金は返金ごとの返還請求書として別に判定する。返還請求書を出せない返金があっても、
 * 当初の書類は止めない（返金の状況は書類とは別にお客様へ示す）。
 */
export function planOrderDocuments(context: InvoiceIssueContext) {
  return {
    invoice: evaluateInvoiceIssue(context),
    returns: moneyRefunds(context.record).map((refund) =>
      evaluateReturnInvoiceIssue({ ...context, refundId: refund.refundId })
    ),
  };
}

/** 発行できる書類の案を台帳に足す。発行できないものは足さない */
export function issuePlannedDocuments(
  ledger: InvoiceDocumentLedger,
  plan: ReturnType<typeof planOrderDocuments>
) {
  const drafts: InvoiceDocument[] = [plan.invoice, ...plan.returns].flatMap((evaluation) =>
    evaluation.decision === "issuable" && evaluation.draft ? [evaluation.draft] : []
  );

  return drafts.reduce(appendDocument, ledger);
}
