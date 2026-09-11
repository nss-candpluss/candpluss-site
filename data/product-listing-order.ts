/**
 * 一覧ページでの並び順。カテゴリ内の並びをここで明示する。
 *
 * ここに無い商品はカテゴリ内で「指定済みの商品より後ろ」に回り、
 * その中では Shopify から取得した順（商品名順）を保つ。
 */
export const productListingHandleOrder: readonly string[] = [
  // テント・シェルター オプション（MOYA500 → MOYA420）
  "moya500_roofsheet",
  "moya500_groundsheet",
  "moya500_innertent",
  "moya500_innertent-mesh",
  "moya500_tpu",
  "moya420_roofsheet",
  "moya420_groundsheet",
  "moya420_innertent",
  "moya420_innertent-mesh",

  // アクセサリー
  "guyrope",
  "triangle-guylineadjuster",
  "gearaid-seam-grip",
  "gearaid-sil-nylon-patch",
];
