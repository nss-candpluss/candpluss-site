import {
  INVOICE_DOCUMENT_TITLES,
  type ReturnInvoiceDocument,
  type SimplifiedInvoiceDocument,
} from "@/lib/invoice/documents";
import type { LoadedCustomerReceipt } from "@/lib/invoice/load-customer-receipt";
import type { Yen } from "@/lib/invoice/money";
import type { InvoiceIssueReason } from "@/lib/invoice/order";

/**
 * 領収書のページでお客様に見せる内容。
 *
 * 判定の理由（`InvoiceIssueReason`）や API のエラーはそのまま出さず、決まった案内の
 * 文言だけにする。案内の種類が分かれば十分で、内部の事情はお客様に関係ない。
 */
export const RECEIPT_NOTICES = {
  notFound: "対象の注文が見つかりませんでした。",
  awaitingPayment: "領収書は、ご入金の確認と商品の発送の後にご確認いただけます。",
  awaitingShipment: "領収書は商品発送後にご確認いただけます。",
  cancelled: "このご注文は商品の発送前にキャンセルされたため、領収書は発行しておりません。",
  contact: "現在、領収書を表示できません。お手数ですが、お問い合わせください。",
  fetchFailed: "領収書の取得に失敗しました。時間をおいて再度お試しください。",
} as const;

export type ReceiptNotice = keyof typeof RECEIPT_NOTICES;

export const RETURN_INVOICE_NOTICE =
  "ご返金分の適格返還請求書は、現在この画面では発行しておりません。必要な場合は、お手数ですがお問い合わせください。";

export const REFUND_NOTICES = {
  original: "領収書は、ご購入時のご注文内容とお支払いの内容で発行しています。ご返金の内容は含みません。",
  failed: "完了していないご返金の手続きがあります。",
  needsReview: "ご返金の内容を確認しております。詳しくは、お手数ですがお問い合わせください。",
} as const;

export type CustomerRefundView = {
  refunded: Yen;
  pending: Yen;
  failed: boolean;
  needsReview: boolean;
};

export type CustomerReceiptView =
  | { status: "notice"; notice: ReceiptNotice; refunds: CustomerRefundView | null }
  | {
      status: "issuable";
      invoice: SimplifiedInvoiceDocument;
      refunds: CustomerRefundView | null;
      returnInvoices: ReturnInvoiceDocument[];
      /** 返還請求書を出せない返金がある。推測で作らず、案内だけを出す */
      returnInvoiceWithheld: boolean;
    };

/** 入金待ち・出荷待ちのような、待てば発行できる理由 */
const WAITING_REASONS: Record<string, ReceiptNotice> = {
  unpaid: "awaitingPayment",
  awaitingShipment: "awaitingShipment",
  notShipped: "awaitingShipment",
};

/**
 * 発行できない理由からお客様への案内を選ぶ。待てば発行できる理由だけのときは
 * 入金待ち・出荷待ちを案内し、それ以外の理由が 1 つでもあればお問い合わせを案内する
 * （自動では扱わない注文を、待てば出るように見せない）。
 */
export function receiptNoticeFor(reasons: readonly InvoiceIssueReason[]): ReceiptNotice {
  const notices = reasons.map((reason) => WAITING_REASONS[reason.code] ?? "contact");

  if (notices.length === 0 || notices.includes("contact")) {
    return "contact";
  }
  return notices.includes("awaitingPayment") ? "awaitingPayment" : "awaitingShipment";
}

export function customerReceiptView(loaded: LoadedCustomerReceipt): CustomerReceiptView {
  switch (loaded.status) {
    case "notFound":
      return { status: "notice", notice: "notFound", refunds: null };
    case "fetchFailed":
    case "failed":
      return { status: "notice", notice: "fetchFailed", refunds: null };
    case "invalidData":
      return { status: "notice", notice: "contact", refunds: null };
    case "evaluated":
      break;
  }

  const { invoice, refunds, returnInvoices } = loaded;

  if (invoice.status === "noTransaction") {
    return { status: "notice", notice: "cancelled", refunds };
  }
  if (invoice.status === "unavailable") {
    return { status: "notice", notice: receiptNoticeFor(invoice.reasons), refunds };
  }

  return {
    status: "issuable",
    invoice: invoice.document,
    refunds,
    returnInvoices: returnInvoices.flatMap((item) => (item.status === "issuable" ? [item.document] : [])),
    returnInvoiceWithheld: returnInvoices.some((item) => item.status === "unavailable"),
  };
}

/** 保存するファイル名（拡張子なし）。閲覧した日に左右されないよう、注文番号だけで決める */
export function invoiceFileName(document: SimplifiedInvoiceDocument | ReturnInvoiceDocument, index = 0) {
  const title = INVOICE_DOCUMENT_TITLES[document.kind].replace(/\s+/g, "");
  const orderNumber = document.orderName.replace(/^#/, "");

  return document.kind === "invoice" ? `${title}_${orderNumber}` : `${title}_${orderNumber}_${index + 1}`;
}
