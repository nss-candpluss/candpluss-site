/**
 * 領収書の発行者情報。
 *
 * 会社情報（`data/company.ts`）と重複するが、領収書は表記を変えたくなる
 * ことがあるので独立して持つ。
 */
export const receiptIssuer = {
  /** 屋号。運営会社（`name`）より上に出す */
  brandName: "C AND+S",
  name: "株式会社NSS",
  postalCode: "〒816-0902",
  address: "福岡県大野城市乙金1-10-40",
  tel: "0120-64-8175",
  /**
   * 適格請求書発行事業者の登録番号（`T` + 13 桁）。
   *
   * 未登録・未確認のうちは空のままにする。空の間は領収書に登録番号を
   * 印字せず、適格請求書としては扱わない。番号を入れた時点で登録番号と
   * 税率別内訳が印字され、適格請求書の体裁になる。
   */
  invoiceRegistrationNumber: "T5290001041852",
} as const;

/** 帳票の表題。画面の見出し・ページタイトル・会員ページのリンク・ファイル名で揃える */
export const RECEIPT_DOCUMENT_TITLE = "利用明細書（兼 適格請求書）";

/** 消費税の標準税率。軽減税率の商品を扱いはじめたら区分が必要になる */
export const RECEIPT_TAX_RATE_PERCENT = 10;

/**
 * 集計欄の金額。税抜合計（商品）＋送料（税抜）＋消費税＝合計金額 になるように割り振る。
 *
 * 商品も送料も税込価格。Shopify の税額は送料の分を含まないので使わず、税込の
 * 合計金額から1回だけ割り戻す（適格請求書は税率ごとに端数処理を1回にする）。
 * 商品の税抜額は残りから出すので、四捨五入の端数が出ても合計とは必ず一致する。
 */
export function receiptSummaryAmounts({
  total,
  shipping,
}: {
  total: number;
  shipping: number;
}) {
  const includedTax = (amount: number) =>
    Math.round(
      (amount * RECEIPT_TAX_RATE_PERCENT) / (100 + RECEIPT_TAX_RATE_PERCENT)
    );
  const tax = includedTax(total);
  const shippingExcludingTax = shipping - includedTax(shipping);

  return {
    subtotalExcludingTax: total - tax - shippingExcludingTax,
    shippingExcludingTax,
    tax,
    total,
  };
}

/** 保存するファイル名（拡張子なし）。「表題_注文番号_発行日（JST の YYYYMMDD）」 */
export function receiptFileName(orderName: string, issuedAt: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(issuedAt));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${RECEIPT_DOCUMENT_TITLE}_${orderName.replace(/^#/, "")}_${part("year")}${part("month")}${part("day")}`;
}

/**
 * 明細の最低行数。商品が少なくても表の高さを保ち、A4 1 枚の体裁にする。
 * 超えた分はそのまま行を足す。
 */
export const RECEIPT_MIN_DETAIL_ROWS = 16;

/**
 * 明細の摘要。「MOYA500　Classic Yellow」のように商品名と色・サイズを全角空白でつなぐ。
 *
 * Shopify の `name` は「MOYA500 - Classic Yellow」と色・サイズまで含むので、
 * 末尾の「 - 色・サイズ」を外してからつなぐ。色・サイズが無い商品は
 * `variantTitle` が「Default Title」になる。
 */
export function receiptLineDescription(name: string, variantTitle?: string | null) {
  if (!variantTitle || variantTitle === "Default Title") {
    return name;
  }

  const suffix = ` - ${variantTitle}`;
  const productName = name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;

  return `${productName}　${variantTitle}`;
}

export function isQualifiedInvoiceReady() {
  return receiptIssuer.invoiceRegistrationNumber.trim().length > 0;
}
