import {
  InvoiceMoneyError,
  multiplyYen,
  subtractYen,
  sumYen,
  type Yen,
} from "@/lib/invoice/money";
import {
  taxBreakdown,
  type InvoiceTaxConfig,
  type PriceBasis,
  type TaxableAmount,
  type TaxBreakdown,
  type TaxRatePercent,
} from "@/lib/invoice/tax";

/**
 * 領収書 兼 適格簡易請求書・適格返還請求書の元にする注文のデータ。
 *
 * 「ご注文内容」（注文時の販売記録）と「お支払いの状況」（決済・出荷・キャンセル・
 * 返金の記録）を別々に持つ。返金やキャンセルで Shopify の合計金額は変わるが、
 * ご注文内容は注文時のまま変えない。返金は返金ごとに別の記録として持つ。
 *
 * Shopify のデータからの変換は `customer-account-order.ts` で行う。自動では扱わない
 * 事柄（注文編集・扱っていない税率など）は `dataIssues` か `refundIssues` に残し、発行を止める。
 */
export type InvoiceOrderRecord = {
  /** この注文情報を Shopify から取得した日時。書類の発行日時とは別 */
  capturedAt: string;
  source: "customerAccountApi" | "testFixture";
  sale: InvoiceOrderSale;
  payments: InvoicePaymentTransaction[];
  fulfillments: InvoiceFulfillment[];
  cancellation: InvoiceCancellation | null;
  refunds: InvoiceRefund[];
  /** Shopify の今の状態。精算状況の確認にだけ使い、書類の税額の照合には使わない */
  shopifyStatus: {
    financialStatus: string | null;
    totalRefunded: Yen | null;
  };
  /** 変換のときに見つけた、ご注文内容・お支払いについて自動では扱わない事柄。1 件でもあれば書類を発行しない */
  dataIssues: InvoiceIssueReason[];
  /**
   * 返金について自動では扱わない事柄。返金の書類（適格返還請求書）だけを止め、
   * 当初の領収書 兼 適格簡易請求書の発行は止めない
   */
  refundIssues: InvoiceIssueReason[];
};

export type InvoiceIssueReason = {
  code: string;
  message: string;
};

export function issueReason(code: string, message: string): InvoiceIssueReason {
  return { code, message };
}

/**
 * Shopify が計算した金額・税額（販売記録の値）。照合にだけ使い、書類の計算には使わない。
 * 税率は Shopify の値をそのまま持ち、扱える税率かどうかは照合で見る。
 */
export type ShopifyAmounts = {
  total: Yen;
  tax: Yen;
  rates: { ratePercent: number; amount: Yen; tax: Yen }[];
};

/** ご注文内容。注文時の販売記録から作り、後から変えない */
export type InvoiceOrderSale = {
  orderId: string;
  orderName: string;
  priceBasis: PriceBasis;
  /** 注文の処理日時（ご注文日） */
  processedAt: string;
  lines: InvoiceOrderLine[];
  /** 別途請求する送料。送料無料なら `null` */
  shipping: InvoiceShipping | null;
  /** `null` は Shopify の販売記録から取れていない */
  shopifyReference: ShopifyAmounts | null;
};

export type InvoiceOrderLine = {
  lineId: string;
  description: string;
  quantity: number;
  /** 割引前の単価。`priceBasis` が税込なら税込 */
  unitPrice: Yen;
  /** この行の割引の合計（注文全体の割引を割り振った分を含む） */
  discount: Yen;
  ratePercent: TaxRatePercent;
};

export type InvoiceShipping = {
  title: string;
  /** 割引前の送料 */
  price: Yen;
  discount: Yen;
  /** 送料の税率。商品の税率とは独立（別途請求の送料は原則 10%） */
  ratePercent: TaxRatePercent;
};

export type InvoicePaymentTransaction = {
  transactionId: string;
  parentTransactionId: string | null;
  kind: "sale" | "capture" | "authorization" | "refund" | "void" | "other";
  status: "success" | "pending" | "failure" | "unknown";
  amount: Yen;
  /** 銀行振込など手動の決済。記録は当店が登録したもので、入出金の確認ではない */
  manual: boolean;
  /** 決済日時 */
  processedAt: string | null;
};

/** 出荷 1 件。取消済みの出荷も残し、判定では成功した出荷だけを使う */
export type InvoiceFulfillment = {
  fulfillmentId: string;
  status: "success" | "pending" | "cancelled" | "failure" | "unknown";
  /** 出荷日時 */
  shippedAt: string | null;
  lines: { lineId: string; quantity: number }[];
};

export type InvoiceCancellation = {
  cancelledAt: string;
  reason: string | null;
};

/**
 * 返金 1 件（Shopify の返金の販売記録）。適格返還請求書は返金ごとに作る。
 *
 * 入金前のキャンセルでも Shopify は返金の販売記録を作る。販売記録があるだけでは
 * お金を返したことにならないので、返金の状態は決済の記録と `refundedAmount` で見る
 * （`settlement.ts`）。
 */
export type InvoiceRefund = {
  refundId: string;
  createdAt: string;
  /** 返した商品。金額は返した額（正の数） */
  lines: { lineId: string; quantity: number; amount: Yen; ratePercent: TaxRatePercent }[];
  /** 返した送料 */
  shipping: { amount: Yen; ratePercent: TaxRatePercent }[];
  /** 商品にも送料にも紐づかない返金 */
  adjustments: { description: string; amount: Yen; ratePercent: TaxRatePercent }[];
  /** Shopify の返金の記録（`Order.refunds`）にある、実際に返金した額。記録が無ければ `null` */
  refundedAmount: Yen | null;
  shopifyReference: ShopifyAmounts | null;
};

/**
 * 現在の精算状況。決済・キャンセル・返金の記録から決まるもので、ご注文内容とは混ぜない。
 * 状態の分け方は注文履歴のお支払いサマリー（`accountOrderSettlement`）と同じ。
 */
export type InvoiceSettlement =
  | { kind: "active"; awaitingPayment: boolean; paid: Yen }
  | { kind: "cancelledUnpaid" }
  | {
      kind: "settled";
      cancelled: boolean;
      paid: Yen;
      refunded: Yen;
      refundPending: Yen;
      refundFailed: boolean;
      net: Yen;
      manualPayment: boolean;
    }
  | { kind: "unknown" };

function amountAfterDiscount(gross: Yen, discount: Yen, label: string) {
  const amount = subtractYen(gross, discount);

  if (discount < 0 || amount < 0) {
    throw new InvoiceMoneyError(`${label} の割引が不正です`);
  }

  return amount;
}

/** 商品 1 行の、割引を引いた後の金額 */
export function orderLineAmount(line: InvoiceOrderLine) {
  if (!Number.isSafeInteger(line.quantity) || line.quantity < 0) {
    throw new InvoiceMoneyError(`${line.lineId} の数量が不正です: ${line.quantity}`);
  }

  return amountAfterDiscount(multiplyYen(line.unitPrice, line.quantity), line.discount, line.lineId);
}

/** 送料の、割引を引いた後の金額 */
export function shippingAmount(shipping: InvoiceShipping) {
  return amountAfterDiscount(shipping.price, shipping.discount, "送料");
}

/** ご注文内容を、税率ごとの集計に入れる形にする。商品と送料はそれぞれの税率で入れる */
export function saleTaxableAmounts(sale: InvoiceOrderSale): TaxableAmount[] {
  return [
    ...sale.lines.map((line) => ({ amount: orderLineAmount(line), ratePercent: line.ratePercent })),
    ...(sale.shipping
      ? [{ amount: shippingAmount(sale.shipping), ratePercent: sale.shipping.ratePercent }]
      : []),
  ];
}

/** 返金 1 件を、税率ごとの集計に入れる形にする */
export function refundTaxableAmounts(refund: InvoiceRefund): TaxableAmount[] {
  const parts = [...refund.lines, ...refund.shipping, ...refund.adjustments];

  for (const part of parts) {
    if (part.amount < 0) {
      throw new InvoiceMoneyError(`${refund.refundId} の返金額が負の数です`);
    }
  }

  return parts.map((part) => ({ amount: part.amount, ratePercent: part.ratePercent }));
}

export function refundAmount(refund: InvoiceRefund) {
  return sumYen(refundTaxableAmounts(refund).map((part) => part.amount));
}

/** ご注文内容の税率ごとの集計（領収書 兼 適格簡易請求書） */
export function saleTaxBreakdown(sale: InvoiceOrderSale, config: InvoiceTaxConfig): TaxBreakdown {
  return taxBreakdown(saleTaxableAmounts(sale), config);
}

/** 返金 1 件の税率ごとの集計（適格返還請求書） */
export function refundTaxBreakdown(refund: InvoiceRefund, config: InvoiceTaxConfig): TaxBreakdown {
  return taxBreakdown(refundTaxableAmounts(refund), config);
}
