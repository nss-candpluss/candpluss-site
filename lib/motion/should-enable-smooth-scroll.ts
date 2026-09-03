import { SMOOTH_SCROLL } from "@/lib/motion/smooth-scroll-config";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Lenis / 横スクロール ScrollTrigger など PC 向けスクロール演出の共通条件 */
export const DESKTOP_POINTER_MEDIA_QUERY = "(pointer: fine) and (min-width: 768px)";

export function matchesDesktopPointerMediaQuery(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(DESKTOP_POINTER_MEDIA_QUERY).matches;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function shouldEnableSmoothScroll(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (!SMOOTH_SCROLL.enabled) {
    return false;
  }

  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return false;
  }

  if (
    SMOOTH_SCROLL.desktopOnly &&
    (isTouchDevice() || !matchesDesktopPointerMediaQuery())
  ) {
    return false;
  }

  return true;
}
