/**
 * スムーススクロール ON/OFF
 *
 * 「スムーススクロールを外して」と言われた場合は enabled: false にしてください。
 * Lenis は起動せず、ScrollTrigger 連携も行われず、導入前と同じネイティブスクロールに戻ります。
 */
export const SMOOTH_SCROLL = {
  enabled: false,
  /** true の場合、タッチ主体端末・768px未満では Lenis を起動しない */
  desktopOnly: true,
} as const;
