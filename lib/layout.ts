/**
 * Tailwind は動的テンプレートリテラル内のクラスを検出できないため、
 * 共通の 12 カラム配置はリテラル文字列として列挙する。
 */

/** Container 内に置く 12 カラムの基本グリッド */
export const siteGridClassName = "grid grid-cols-12";

/** 1 カラム（全幅） */
export const fullSpanClassName = "col-span-12";

/** 標準カード: 1列 → 2列（768px）→ 3列（1025px） */
export const standardCardSpanClassName =
  "col-span-12 min-[768px]:col-span-6 min-[1025px]:col-span-4";

/** 商品一覧: 1列 → 2列（640px）→ 3列（1025px） */
export const productCardSpanClassName =
  "col-span-12 min-[640px]:col-span-6 min-[1025px]:col-span-4";

/** 2 カラム FeatureLinks: 1列 → 2列（768px） */
export const twoColumnFeatureSpanClassName =
  "col-span-12 min-[768px]:col-span-6";

/** Main Products が 3 列（PC）に戻る最小件数 */
export const MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT = 5;

/** Main Products: 4件以下は 2 列、5件以上は標準 3 列 */
export function mainProductCardSpanClassName(itemCount: number) {
  return itemCount >= MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT
    ? standardCardSpanClassName
    : twoColumnFeatureSpanClassName;
}

/** Main Products: 2 列は FeatureLinks と同じ 13/10、3 列は 4/5 */
export function mainProductCardAspectClassName(itemCount: number) {
  return itemCount >= MAIN_PRODUCTS_THREE_COLUMN_MIN_COUNT
    ? "aspect-[4/5]"
    : "aspect-[13/10]";
}

/** 3 カラム FeatureLinks: 1列 → 3列（768px） */
export const threeColumnFeatureSpanClassName =
  "col-span-12 min-[768px]:col-span-4";

/** フォーム: 1列 → 2列（640px） */
export const formHalfSpanClassName =
  "col-span-12 min-[640px]:col-span-6";

/** 定義リスト: 1列 → 3 + 9 カラム（768px） */
export const definitionLabelSpanClassName =
  "col-span-12 min-[768px]:col-span-3";
export const definitionValueSpanClassName =
  "col-span-12 min-[768px]:col-span-9";

/** Concept: PC の左側ページ内ナビ（3 カラム） */
export const conceptSectionNavSpanClassName = "col-span-3";

/** Concept: 見出し。画面の左右中央に置く */
export const conceptStoryHeadingSpanClassName = "col-span-12";

/** Concept: 本文。画面の左右中央に置く */
export const conceptStoryContentSpanClassName = "col-span-12";
