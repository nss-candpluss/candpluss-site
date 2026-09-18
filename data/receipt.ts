/**
 * 領収書の発行者情報。
 *
 * 会社情報（`data/company.ts`）と重複するが、領収書は表記を変えたくなる
 * ことがあるので独立して持つ。
 */
export const receiptIssuer = {
  name: "株式会社NSS",
  postalCode: "〒816-0902",
  address: "福岡県大野城市乙金1-10-40",
  tel: "092-504-7370",
  /**
   * 適格請求書発行事業者の登録番号（`T` + 13 桁）。
   *
   * 未登録・未確認のうちは空のままにする。空の間は領収書に登録番号を
   * 印字せず、適格請求書としては扱わない。番号を入れた時点で登録番号と
   * 税率別内訳が印字され、適格請求書の体裁になる。
   */
  invoiceRegistrationNumber: "",
} as const;

/** 消費税の標準税率。軽減税率の商品を扱いはじめたら区分が必要になる */
export const RECEIPT_TAX_RATE_PERCENT = 10;

export const receiptNotes = [
  "本領収書は電子的に発行しているため、収入印紙の貼付は不要です。",
] as const;

export function isQualifiedInvoiceReady() {
  return receiptIssuer.invoiceRegistrationNumber.trim().length > 0;
}
