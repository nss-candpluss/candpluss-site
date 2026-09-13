/**
 * 一覧・詳細のステータス欄の表示差し替え（テスト用）。
 * 購入可否や Shopify の sales_status は変えない。
 */
export const productStatusDisplayOverrides: Record<
  string,
  { label: string; color: string }
> = {
  moya500: {
    label: "2026年10月2日(金) 20:00〜発売",
    color: "#c40000",
  },
  moya420: {
    label: "2027年春 発売予定",
    color: "#c40000",
  },
};
