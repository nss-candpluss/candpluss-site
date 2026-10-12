import { InvoiceMoneyError, yen, type Yen } from "@/lib/invoice/money";
import {
  issueReason,
  orderLineAmount,
  refundTaxBreakdown,
  saleTaxBreakdown,
  shippingAmount,
  type InvoiceIssueReason,
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
  /** 利用明細書の集計欄。この書式で正しく出せない注文は `null`（発行しない） */
  statement: InvoiceStatementSummary | null;
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

/**
 * 表題。`invoice` は株式会社NSS 指定の「利用明細書（兼 適格請求書）」を、宛名を省く
 * 適格簡易請求書として出すので「適格簡易請求書」にしたもの
 */
export const INVOICE_DOCUMENT_TITLES = {
  invoice: "利用明細書（兼 適格簡易請求書）",
  returnInvoice: "適格返還請求書",
} as const satisfies Record<InvoiceDocument["kind"], string>;

/** 利用明細書の集計欄の税率。NSS 指定の書式は 10% の取引だけを前提にしている */
export const STATEMENT_TAX_RATE_PERCENT = 10;

/** 利用明細書の集計欄（NSS 指定の「税抜合計・送料（税抜）・消費税（10%）・合計金額」） */
export type InvoiceStatementSummary = {
  /** 商品の税抜合計（割引後） */
  productsExcludingTax: Yen;
  /** 送料の税抜額（割引後） */
  shippingExcludingTax: Yen;
  /** 10% の消費税額（税率ごとに 1 回だけ端数処理した額） */
  tax: Yen;
  total: Yen;
};

/**
 * 集計欄の内訳。消費税・合計は書類の税率ごとの集計（`taxSummary`、税率ごとに 1 回の端数処理）のまま。
 * 商品と送料の税抜額は、Shopify が注文の税額を販売記録ごとに割り振った値（`allocations`）から
 * 「税込の金額 − 割り振られた税額」で作る。割り振りの決まりは Shopify の仕様（割り切れない 1 円を
 * 1 円ずつ割り振り、合計すると注文の税額になる）なので、次をすべて満たすときだけ内訳を出す。
 *
 * - 10% の取引だけで、価格は税込
 * - 販売記録の金額が、書類の商品の行・送料の金額と 1 件ずつ一致する
 * - 割り振られた税額の合計が、書類の消費税額（1 回の端数処理）と一致する
 * - 各販売記録の税額が、注文の税額を金額で按分した額の切り捨て〜切り上げに入っている
 *   （1 円ずつの割り振りで生じる範囲。それ以外の配分は割り振りとして説明できない）
 *
 * 満たさなければ `summary` は `null` で、理由を返す（発行を止める）。
 */
export function invoiceStatementBreakdown(
  sale: InvoiceOrderSale,
  taxSummary: TaxBreakdown
): { summary: InvoiceStatementSummary | null; reasons: InvoiceIssueReason[] } {
  const stop = (code: string, message: string) => ({ summary: null, reasons: [issueReason(code, message)] });
  const rates = [
    ...taxSummary.rates.map((rate) => rate.ratePercent),
    ...sale.lines.map((line) => line.ratePercent),
    ...(sale.shipping ? [sale.shipping.ratePercent] : []),
  ];

  if (rates.some((ratePercent) => ratePercent !== STATEMENT_TAX_RATE_PERCENT)) {
    return stop("statementUnsupportedRate", "利用明細書の書式は 10% の取引だけを扱います");
  }
  if (sale.priceBasis !== "taxIncluded") {
    return stop("statementUnsupportedPriceBasis", "利用明細書の書式は税込価格の注文だけを扱います");
  }

  const allocations = sale.shopifyReference?.allocations;

  if (!allocations) {
    return stop("statementAllocationMissing", "Shopify の販売記録ごとの税額が取れていません");
  }

  const products = allocations.filter((part) => part.lineType === "product");
  const shippings = allocations.filter((part) => part.lineType === "shipping");
  const shippingAmountYen = sale.shipping ? shippingAmount(sale.shipping) : 0;
  const linesMatch =
    products.length === sale.lines.length &&
    sale.lines.every((line) =>
      products.some((part) => part.lineId === line.lineId && part.amount === orderLineAmount(line))
    ) &&
    shippings.length <= 1 &&
    (shippings[0]?.amount ?? 0) === shippingAmountYen;

  if (!linesMatch) {
    return stop("statementAllocationMismatch", "Shopify の販売記録の金額が、商品・送料の金額と合いません");
  }
  if (
    allocations.some(
      (part) => part.ratePercent !== STATEMENT_TAX_RATE_PERCENT && !(part.amount === 0 && part.tax === 0)
    )
  ) {
    return stop("statementUnsupportedRate", "Shopify の販売記録に 10% 以外の税があります");
  }

  const allocatedTax = allocations.reduce((sum, part) => sum + part.tax, 0);

  if (allocatedTax !== taxSummary.tax) {
    return stop(
      "statementAllocationSumMismatch",
      `Shopify が割り振った税額の合計（${allocatedTax} 円）が、消費税額（${taxSummary.tax} 円）と合いません`
    );
  }

  const totalAmount = allocations.reduce((sum, part) => sum + part.amount, 0);
  const outOfRange = allocations.find((part) => {
    if (totalAmount === 0) {
      return part.tax !== 0;
    }
    const share = part.amount * taxSummary.tax;

    return part.tax * totalAmount < share - (totalAmount - 1) || part.tax * totalAmount > share + (totalAmount - 1);
  });

  if (outOfRange) {
    return stop(
      "statementAllocationOutOfRange",
      `Shopify の販売記録の税額（${outOfRange.tax} 円）が、注文の税額の割り振りとして説明できません`
    );
  }

  const excludingTax = (parts: typeof allocations) => parts.reduce((sum, part) => sum + part.amount - part.tax, 0);
  const summary: InvoiceStatementSummary = {
    productsExcludingTax: yen(excludingTax(products)),
    shippingExcludingTax: yen(excludingTax(shippings)),
    tax: taxSummary.tax,
    total: taxSummary.total,
  };

  if (summary.productsExcludingTax + summary.shippingExcludingTax + summary.tax !== summary.total) {
    return stop("statementTotalMismatch", "集計欄の金額の合計が合計金額と合いません");
  }

  return { summary, reasons: [] };
}

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
  const taxSummary = saleTaxBreakdown(sale, input.taxConfig);

  return deepFreeze({
    kind: "invoice",
    documentId: documentIdFor(invoiceDocumentId(sale.orderId), corrects),
    orderId: sale.orderId,
    orderName: sale.orderName,
    issuer: { ...input.issuer },
    rulesVersion: input.rulesVersion,
    taxConfig: { ...input.taxConfig },
    taxSummary,
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
    statement: invoiceStatementBreakdown(sale, taxSummary).summary,
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
