/** サムネイル縦スライド / メイン画像横スライド共通の基本尺 */
export const PRODUCT_DETAIL_SLIDE_MS = 360;

/** ステップ数に応じた共通 duration（サムネイル・メインで揃える） */
export function productDetailSlideDurationMs(steps: number): number {
  const distance = Math.abs(steps);
  return Math.min(560, PRODUCT_DETAIL_SLIDE_MS + Math.max(0, distance - 1) * 70);
}
