import { InvoiceMoneyError, type Yen } from "@/lib/invoice/money";
import {
  orderLineAmount,
  refundTaxBreakdown,
  saleTaxBreakdown,
  shippingAmount,
  type InvoiceOrderSale,
  type InvoiceRefund,
} from "@/lib/invoice/order";
import {
  isReducedRate,
  type InvoiceTaxConfig,
  type TaxBreakdown,
  type TaxRatePercent,
} from "@/lib/invoice/tax";

/**
 * お客様に渡す書類の記載内容。
 *
 * - 領収書 兼 適格簡易請求書（`invoice`）：注文 1 件に 1 枚。代金を受け取ったことの
 *   証明（領収書の欄）と、課税取引の内容・税額（適格簡易請求書の記載事項）を 1 枚に載せる。
 *   小売業として不特定多数に販売するので宛名は載せない（インボイス Q&A 問24・問58）。
 * - 適格返還請求書（`returnInvoice`）：お金を返した返金 1 件に 1 枚。当初の書類は変えない。
 *
 * 書類は 1 件ずつ別の記録として組み立て、発行したら内容を変えない。訂正するときは
 * 元の書類を残したまま、`corrects` で元の書類を指す新しい書類を足す。
 *
 * 書類の内容は、Shopify の販売記録・決済・出荷の記録と、生成の決まり（`rulesVersion`）
 * だけで決まり、いつ組み立てても同じになるようにする。そのため、閲覧のたびに変わる
 * 発行日時や注文情報の取得日時は書類に持たない（適格簡易請求書・適格返還請求書の
 * 記載事項ではない）。
 *
 * 日付は次のものを混ぜない。
 * - 取引年月日（`transactionDate`）：税務上の取引の日。決め方は判定側の設定
 * - 決済日（`receipt.receivedDate`）：領収書の欄の日付。Shopify の決済の記録の日
 * - 返還等の年月日（`returnDate`）：返金の日
 */

export type InvoiceIssuer = {
  name: string;
  brandName: string | null;
  /** 適格請求書発行事業者の登録番号（`T` + 13 桁） */
  registrationNumber: string;
};

/**
 * 訂正の書類が指す元の書類。記載事項を直した書類で、それ自体が法定記載事項を
 * 満たす正式な書類。元の書類は台帳に残す。
 */
export type InvoiceCorrection = {
  documentId: string;
  /** 同じ書類への何回目の訂正か（1 から） */
  sequence: number;
  reason: string;
};

/** 領収書の欄。入金を確認した金額と日付 */
export type InvoiceReceipt = {
  receivedAmount: Yen;
  /**
   * Shopify の決済の記録の処理日（日本時間）。カード会社からの入金日や、銀行振込の
   * 実際の振込日とは限らないので、書類では「決済日」「入金確認日」として出す
   */
  receivedDate: string;
  /** 銀行振込など手動の決済。入金の記録は当店が登録したもの */
  manualPayment: boolean;
};

type DocumentBase = {
  documentId: string;
  orderId: string;
  orderName: string;
  issuer: InvoiceIssuer;
  /** 書類を組み立てた決まりの版。版を変えずに書類の内容を変えない */
  rulesVersion: string;
  taxConfig: InvoiceTaxConfig;
  taxSummary: TaxBreakdown;
  /** 訂正の書類なら、訂正する元の書類 */
  corrects: InvoiceCorrection | null;
};

export type InvoiceDocumentLine = {
  lineId: string;
  description: string;
  quantity: number;
  unitPrice: Yen;
  discount: Yen;
  amount: Yen;
  ratePercent: TaxRatePercent;
  /** 軽減税率の対象。書類では「※」などの印を付ける */
  reducedRate: boolean;
};

export type InvoiceDocumentShipping = {
  title: string;
  price: Yen;
  discount: Yen;
  amount: Yen;
  ratePercent: TaxRatePercent;
  reducedRate: boolean;
};

export type SimplifiedInvoiceDocument = DocumentBase & {
  kind: "invoice";
  receipt: InvoiceReceipt;
  transactionDate: string;
  lines: InvoiceDocumentLine[];
  shipping: InvoiceDocumentShipping | null;
};

export type ReturnInvoiceLine = {
  lineId: string;
  description: string;
  quantity: number;
  amount: Yen;
  ratePercent: TaxRatePercent;
  reducedRate: boolean;
};

export type ReturnInvoiceAmount = {
  description: string;
  amount: Yen;
  ratePercent: TaxRatePercent;
  reducedRate: boolean;
};

export type ReturnInvoiceDocument = DocumentBase & {
  kind: "returnInvoice";
  refundId: string;
  /** 元の領収書 兼 適格簡易請求書。同時に作るときも、その書類を指す */
  relatedInvoiceId: string;
  /** 返還等の年月日（日本時間） */
  returnDate: string;
  /** 返還の元になった取引の年月日 */
  originalTransactionDate: string;
  lines: ReturnInvoiceLine[];
  /** 送料と、商品にも送料にも紐づかない返金 */
  otherAmounts: ReturnInvoiceAmount[];
};

export type InvoiceDocument = SimplifiedInvoiceDocument | ReturnInvoiceDocument;

export class InvoiceDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceDocumentError";
  }
}

export const INVOICE_DOCUMENT_TITLES = {
  invoice: "領収書 兼 適格簡易請求書",
  returnInvoice: "適格返還請求書",
} as const satisfies Record<InvoiceDocument["kind"], string>;

/** 日時を日本時間の年月日（YYYY-MM-DD）にする */
export function tokyoDate(dateTime: string) {
  const time = Date.parse(dateTime);

  if (Number.isNaN(time)) {
    throw new InvoiceDocumentError(`日時として読めません: ${dateTime}`);
  }

  return new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }

  return value;
}

export function invoiceDocumentId(orderId: string) {
  return `invoice:${orderId}`;
}

export function returnInvoiceDocumentId(orderId: string, refundId: string) {
  return `return:${orderId}:${refundId}`;
}

function documentIdFor(baseId: string, corrects: InvoiceCorrection | null) {
  return corrects ? `${corrects.documentId}:correction:${corrects.sequence}` : baseId;
}

type CommonInput = {
  issuer: InvoiceIssuer;
  rulesVersion: string;
  taxConfig: InvoiceTaxConfig;
  corrects?: InvoiceCorrection | null;
};

/** 領収書 兼 適格簡易請求書を組み立てる。金額は返金前のご注文内容のまま */
export function buildInvoiceDocument(
  input: CommonInput & {
    sale: InvoiceOrderSale;
    transactionDate: string;
    receipt: InvoiceReceipt;
  }
): SimplifiedInvoiceDocument {
  const { sale } = input;
  const corrects = input.corrects ?? null;

  return deepFreeze({
    kind: "invoice",
    documentId: documentIdFor(invoiceDocumentId(sale.orderId), corrects),
    orderId: sale.orderId,
    orderName: sale.orderName,
    issuer: { ...input.issuer },
    rulesVersion: input.rulesVersion,
    taxConfig: { ...input.taxConfig },
    taxSummary: saleTaxBreakdown(sale, input.taxConfig),
    corrects,
    receipt: { ...input.receipt },
    transactionDate: input.transactionDate,
    lines: sale.lines.map(
      (line): InvoiceDocumentLine => ({
        lineId: line.lineId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        amount: orderLineAmount(line),
        ratePercent: line.ratePercent,
        reducedRate: isReducedRate(line.ratePercent),
      })
    ),
    shipping: sale.shipping
      ? {
          title: sale.shipping.title,
          price: sale.shipping.price,
          discount: sale.shipping.discount,
          amount: shippingAmount(sale.shipping),
          ratePercent: sale.shipping.ratePercent,
          reducedRate: isReducedRate(sale.shipping.ratePercent),
        }
      : null,
  });
}

/** 適格返還請求書（返金 1 件）を組み立てる。当初の書類とは別の記録にする */
export function buildReturnInvoiceDocument(
  input: CommonInput & {
    sale: InvoiceOrderSale;
    refund: InvoiceRefund;
    relatedInvoiceId: string;
    originalTransactionDate: string;
  }
): ReturnInvoiceDocument {
  const { sale, refund } = input;
  const corrects = input.corrects ?? null;

  const lines = refund.lines.map((part): ReturnInvoiceLine => {
    const line = sale.lines.find((candidate) => candidate.lineId === part.lineId);

    if (!line) {
      throw new InvoiceDocumentError(`返金の対象 ${part.lineId} がご注文内容にありません`);
    }
    if (part.quantity > line.quantity || part.amount > orderLineAmount(line)) {
      throw new InvoiceMoneyError(`${part.lineId} の返金がご注文の数量・金額を超えています`);
    }

    return {
      lineId: part.lineId,
      description: line.description,
      quantity: part.quantity,
      amount: part.amount,
      ratePercent: part.ratePercent,
      reducedRate: isReducedRate(part.ratePercent),
    };
  });

  const shippingRefunded = refund.shipping.reduce((sum, part) => sum + part.amount, 0);

  if (shippingRefunded > (sale.shipping ? shippingAmount(sale.shipping) : 0)) {
    throw new InvoiceMoneyError(`${refund.refundId} の送料の返金が請求した送料を超えています`);
  }

  const otherAmounts: ReturnInvoiceAmount[] = [
    ...refund.shipping.map((part) => ({
      description: sale.shipping?.title ?? "送料",
      amount: part.amount,
      ratePercent: part.ratePercent,
      reducedRate: isReducedRate(part.ratePercent),
    })),
    ...refund.adjustments.map((part) => ({
      description: part.description,
      amount: part.amount,
      ratePercent: part.ratePercent,
      reducedRate: isReducedRate(part.ratePercent),
    })),
  ];

  return deepFreeze({
    kind: "returnInvoice",
    documentId: documentIdFor(returnInvoiceDocumentId(sale.orderId, refund.refundId), corrects),
    orderId: sale.orderId,
    orderName: sale.orderName,
    issuer: { ...input.issuer },
    rulesVersion: input.rulesVersion,
    taxConfig: { ...input.taxConfig },
    taxSummary: refundTaxBreakdown(refund, input.taxConfig),
    corrects,
    refundId: refund.refundId,
    relatedInvoiceId: input.relatedInvoiceId,
    returnDate: tokyoDate(refund.createdAt),
    originalTransactionDate: input.originalTransactionDate,
    lines,
    otherAmounts,
  });
}

/** 1 つの注文で発行した書類の台帳。足すだけで、発行済みの書類は変えない */
export type InvoiceDocumentLedger = {
  readonly orderId: string;
  readonly documents: readonly InvoiceDocument[];
};

export function emptyLedger(orderId: string): InvoiceDocumentLedger {
  return deepFreeze({ orderId, documents: [] });
}

/**
 * 台帳に書類を足す。
 *
 * - 同じ ID・同じ内容の書類はすでに発行済みなので、台帳をそのまま返す（再表示）
 * - 同じ ID で内容が違う書類は、発行済みの内容を変えることになるので止める
 * - 訂正でない 2 枚目の領収書 兼 適格簡易請求書や、同じ返金の返還請求書は足せない
 * - 訂正は、台帳にある同じ種類の書類を指していなければならない
 */
export function appendDocument(
  ledger: InvoiceDocumentLedger,
  document: InvoiceDocument
): InvoiceDocumentLedger {
  if (document.orderId !== ledger.orderId) {
    throw new InvoiceDocumentError("別の注文の書類は足せません");
  }

  const existing = ledger.documents.find(
    (candidate) => candidate.documentId === document.documentId
  );

  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(document)) {
      return ledger;
    }
    throw new InvoiceDocumentError(`発行済みの書類 ${document.documentId} の内容は変えられません`);
  }

  if (document.corrects) {
    const target = ledger.documents.find(
      (candidate) => candidate.documentId === document.corrects?.documentId
    );

    if (!target || target.kind !== document.kind) {
      throw new InvoiceDocumentError("訂正する元の書類が台帳にありません");
    }
  } else if (
    ledger.documents.some(
      (candidate) =>
        !candidate.corrects &&
        candidate.kind === document.kind &&
        (document.kind === "invoice" ||
          (candidate.kind === "returnInvoice" && candidate.refundId === document.refundId))
    )
  ) {
    throw new InvoiceDocumentError(
      document.kind === "invoice"
        ? "この注文の領収書 兼 適格簡易請求書はすでに発行済みです（訂正として足してください）"
        : `返金 ${document.refundId} の返還請求書はすでに発行済みです`
    );
  }

  return deepFreeze({
    ...ledger,
    documents: [...ledger.documents, document],
  });
}

/** 訂正のつながりの、いちばん最初の書類の ID */
function rootDocumentId(ledger: InvoiceDocumentLedger, document: InvoiceDocument) {
  let current = document;

  while (current.corrects) {
    const parent = ledger.documents.find(
      (candidate) => candidate.documentId === current.corrects?.documentId
    );

    if (!parent) {
      break;
    }
    current = parent;
  }

  return current.documentId;
}

/**
 * 今有効な書類。訂正があれば最後の訂正を、無ければ元の書類を返す。
 * 元の書類も訂正前の書類も台帳には残っている。
 */
export function effectiveDocuments(ledger: InvoiceDocumentLedger): InvoiceDocument[] {
  const latest = new Map<string, InvoiceDocument>();

  for (const document of ledger.documents) {
    latest.set(rootDocumentId(ledger, document), document);
  }

  return [...latest.values()];
}

/** 1 つの PDF にまとめるときの順番。領収書 兼 適格簡易請求書、返還請求書（返還日の順） */
export function orderStatementDocuments(ledger: InvoiceDocumentLedger) {
  const documents = effectiveDocuments(ledger);

  return [
    ...documents.filter((document) => document.kind === "invoice"),
    ...documents
      .filter((document): document is ReturnInvoiceDocument => document.kind === "returnInvoice")
      .sort((a, b) => a.returnDate.localeCompare(b.returnDate) || a.refundId.localeCompare(b.refundId)),
  ];
}
