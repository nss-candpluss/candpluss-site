/**
 * Lenis + ScrollTrigger 連携時の scroller 指定。
 * setup-lenis-scroll-trigger.ts の scrollerProxy(document.documentElement) と必ず一致させる。
 */
export const SCROLL_TRIGGER_SCROLLER =
  typeof document === "undefined" ? null : (document.documentElement as HTMLElement);

export function getScrollTriggerScroller(): HTMLElement | undefined {
  return SCROLL_TRIGGER_SCROLLER ?? undefined;
}
