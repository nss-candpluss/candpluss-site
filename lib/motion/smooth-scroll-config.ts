/**
 * スムーススクロール ON/OFF
 *
 * 「スムーススクロールを外して」と言われた場合は enabled: false にしてください。
 * Lenis は起動せず、ScrollTrigger 連携も行われず、導入前と同じネイティブスクロールに戻ります。
 */
export const SMOOTH_SCROLL = {
  enabled: true,
  /** true の場合、タッチ端末・768px未満では Lenis を起動しない */
  desktopOnly: true,
  options: {
    lerp: 0.08,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
    autoRaf: true,
  },
} as const;
