export const HEADER_SCROLL_DELTA_PX = 8;

/** ページ先頭ヘッダーが見えるより何倍分早くスクロールヘッダーを消すか */
export const HEADER_SCROLL_FADE_AHEAD_MULTIPLIER = 3;

export function resolveScrollHeaderFadeAheadPx(headerHeight: number): number {
  return Math.max(headerHeight, 80) * HEADER_SCROLL_FADE_AHEAD_MULTIPLIER;
}

export function resolveScrollHeaderVisibility({
  originalHeaderBottom,
  fadeAheadPx,
  scrollY,
  previousScrollY,
  isCurrentlyVisible,
}: {
  originalHeaderBottom: number;
  fadeAheadPx: number;
  scrollY: number;
  previousScrollY: number;
  isCurrentlyVisible: boolean;
}): boolean {
  if (originalHeaderBottom > -fadeAheadPx) {
    return false;
  }

  const delta = previousScrollY - scrollY;

  if (Math.abs(delta) < HEADER_SCROLL_DELTA_PX) {
    return isCurrentlyVisible;
  }

  return delta > 0;
}
