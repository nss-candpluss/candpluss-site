import type { Yen } from "@/lib/invoice/money";
import {
  refundTaxBreakdown,
  saleTaxBreakdown,
  type InvoiceOrderRecord,
  type ShopifyAmounts,
} from "@/lib/invoice/order";
import type { InvoiceTaxConfig, TaxBreakdown } from "@/lib/invoice/tax";

/**
 * 書類の金額・税額と、Shopify の販売記録の金額・税額の照合。
 *
 * 比べるのは注文全体（返金なら返金 1 件）の合計・消費税額と、税率ごとの金額・消費税額。
 * 商品行ごとの税額は比べない。Shopify は注文全体で計算した税額を各行に 1 円ずつ割り振って
 * いて（#1057 の 2,400 円の行は 219 円）、行ごとに計算した額とは合わないことがあるため。
 *
 * 結果は 3 つだけに分け、一致以外は書類を発行しない。差の原因（端数処理・注文編集・
 * 送料の課税設定など）は自動では決めず、当店が確かめる。
 * - `match`：一致
 * - `mismatch`：金額・税額・税率のどれかが合わない
 * - `dataMissing`：Shopify の販売記録から値が取れていない
 */
export type ReconcileStatus = "match" | "mismatch" | "dataMissing";

export type ReconcileFinding = {
  /** `total`・`tax` は合計、`rateAmount`・`rateTax` は税率ごと */
  field: "total" | "tax" | "rateAmount" | "rateTax";
  ratePercent: number | null;
  /** 書類側（当店の計算）の値 */
  expected: number;
  /** Shopify の値 */
  actual: number;
};

export type AmountReconciliation = {
  status: ReconcileStatus;
  findings: ReconcileFinding[];
};

export type InvoiceReconciliation = {
  orderId: string;
  /** 照合に使った Shopify のデータの取得日時 */
  sourceCapturedAt: string;
  sale: AmountReconciliation;
  /** 返金 ID ごとの照合 */
  refunds: Record<string, AmountReconciliation>;
};

export function reconcileAmounts(
  ours: TaxBreakdown,
  theirs: ShopifyAmounts | null
): AmountReconciliation {
  if (!theirs) {
    return { status: "dataMissing", findings: [] };
  }

  const findings: ReconcileFinding[] = [];
  const compare = (
    field: ReconcileFinding["field"],
    ratePercent: number | null,
    expected: Yen | number,
    actual: Yen | number
  ) => {
    if (expected !== actual) {
      findings.push({ field, ratePercent, expected, actual });
    }
  };

  compare("total", null, ours.total, theirs.total);
  compare("tax", null, ours.tax, theirs.tax);

  // 0 円の税率（送料無料の 10% など）は、書類の税率ごとの欄を作らないので比べない
  const theirRates = theirs.rates.filter((rate) => rate.amount !== 0 || rate.tax !== 0);
  const rates = new Set<number>([
    ...ours.rates.map((rate) => rate.ratePercent),
    ...theirRates.map((rate) => rate.ratePercent),
  ]);

  for (const ratePercent of [...rates].sort((a, b) => b - a)) {
    const mine = ours.rates.find((rate) => rate.ratePercent === ratePercent);
    const shopify = theirRates.find((rate) => rate.ratePercent === ratePercent);

    compare("rateAmount", ratePercent, mine?.totalIncludingTax ?? 0, shopify?.amount ?? 0);
    compare("rateTax", ratePercent, mine?.tax ?? 0, shopify?.tax ?? 0);
  }

  return { status: findings.length === 0 ? "match" : "mismatch", findings };
}

/** 注文 1 件の照合。ご注文内容は注文時の販売記録と、返金は返金ごとの販売記録と比べる */
export function reconcileOrder(
  record: InvoiceOrderRecord,
  taxConfig: InvoiceTaxConfig
): InvoiceReconciliation {
  return {
    orderId: record.sale.orderId,
    sourceCapturedAt: record.capturedAt,
    sale: reconcileAmounts(saleTaxBreakdown(record.sale, taxConfig), record.sale.shopifyReference),
    refunds: Object.fromEntries(
      record.refunds.map((refund) => [
        refund.refundId,
        reconcileAmounts(refundTaxBreakdown(refund, taxConfig), refund.shopifyReference),
      ])
    ),
  };
}
