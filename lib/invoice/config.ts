import { RECEIPT_ISSUE_ENABLED } from "@/data/receipt";
import type { InvoiceIssuePolicy, TransactionDateBasis } from "@/lib/invoice/eligibility";
import type { InvoiceTaxConfig } from "@/lib/invoice/tax";

/**
 * 書類の消費税計算の設定（仮）。
 *
 * 価格は税込（Shopify の「商品価格と配送料に売上税を含める」がオン）。端数処理は、
 * Shopify の実際の注文の税額（1,610・535・525・282・114・218 円）と合う四捨五入にしている。
 * 税込価格を 10% / 8% で割り戻すと端数がちょうど 0.5 円になることはないので、
 * 四捨五入と銀行丸めの結果は同じになる。
 *
 * 当店として採る端数処理は未確定。確定するまで本番の書類には使わない。
 */
export const PROVISIONAL_INVOICE_TAX_CONFIG: InvoiceTaxConfig = {
  priceBasis: "taxIncluded",
  rounding: "halfUp",
};

export const INVOICE_TAX_CONFIG_CONFIRMED = false;

/**
 * 書類を組み立てる決まりの版（仮）。書類に記録する。
 *
 * 書類は保存せず、閲覧のたびに Shopify の記録から組み立てるので、決まり（計算・
 * 日付の基準・発行者情報・表記）を変えると、すでにお客様に渡した書類の内容まで
 * 変わってしまう。決まりを変えるときは版を上げ、前の版の注文の出力が変わらない
 * ようにする。実際の注文の出力は `tests/invoice/customer-account-order.test.ts`
 * で固定している。正式公開の前に、版の切り替え方（どの注文にどの版を使うか）を決める。
 */
export const INVOICE_RULES_VERSION = "provisional-2026-10";

/**
 * 取引年月日の決め方（仮）。通信販売の商品の引渡しとして出荷日を使う。
 * 株式会社NSS の売上計上の基準と合わせる必要があり、未確定。
 */
export const PROVISIONAL_TRANSACTION_DATE_BASIS: TransactionDateBasis = "shippedAt";

/**
 * 会員ページから書類を出すかどうかの、当店の運用（仮）。
 *
 * 会員ページからの発行は、注文履歴のリンク・発行ページと同じ `RECEIPT_ISSUE_ENABLED`
 * 1 か所で切り替える（別々に開け閉めしない）。
 *
 * 書類は「領収書 兼 適格簡易請求書」で、入金を確認し、出荷した注文に交付する
 * （取引年月日の基準が確定するまでは仮）。適格返還請求書は、部分返金・全額返金・
 * 複数回の返金を実際のデータで確かめるまで発行しない。
 */
export const PROVISIONAL_INVOICE_ISSUE_POLICY: InvoiceIssuePolicy = {
  memberPageIssueEnabled: RECEIPT_ISSUE_ENABLED,
  returnInvoiceEnabled: false,
};
