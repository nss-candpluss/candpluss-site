/** サムネイル縦スライド / メイン画像横スライド共通の基本尺 */
export const MOYA500_DESIGN_SLIDE_MS = 360;

/** ステップ数に応じた共通 duration（サムネイル・メインで揃える） */
export function moya500DesignSlideDurationMs(steps: number): number {
  const distance = Math.abs(steps);
  return Math.min(560, MOYA500_DESIGN_SLIDE_MS + Math.max(0, distance - 1) * 70);
}
