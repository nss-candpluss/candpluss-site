import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

const scrollUpdateHandler = ScrollTrigger.update;

let boundLenis: Lenis | null = null;

export function bindLenisToScrollTrigger(lenis: Lenis) {
  if (boundLenis) {
    unbindLenisFromScrollTrigger(boundLenis);
  }

  boundLenis = lenis;

  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (arguments.length && value !== undefined) {
        lenis.scrollTo(value, { immediate: true });
      }

      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    pinType: document.documentElement.style.transform ? "transform" : "fixed",
  });

  lenis.on("scroll", scrollUpdateHandler);
}

export function isLenisBound(): boolean {
  return boundLenis !== null;
}

export function getLenisScrollPosition(): number | null {
  return boundLenis?.scroll ?? null;
}

export function scrollBoundLenisTo(
  target: number | string | HTMLElement,
  options?: { immediate?: boolean; offset?: number }
): boolean {
  if (!boundLenis) {
    return false;
  }

  boundLenis.scrollTo(target, options);
  return true;
}

/**
 * 慣性アニメーションを打ち切り、Lenis の内部位置を実スクロール位置に同期する。
 *
 * Lenis は慣性中（isScrolling === "smooth"）はネイティブ scroll イベントを無視するため、
 * その間にページ遷移が起きると Next.js の scrollTop = 0 が次フレームで上書きされ、
 * 遷移先でページ途中に着地する。遷移が始まる前に慣性を止めておくことで回避する。
 *
 * reset() は Lenis の型定義上 private なので、内部で reset() を呼ぶ stop()/start() を使う。
 */
export function settleBoundLenis() {
  if (!boundLenis || boundLenis.isScrolling !== "smooth") {
    return;
  }

  boundLenis.stop();
  boundLenis.start();
}

export function stopBoundLenis() {
  boundLenis?.stop();
}

export function startBoundLenis() {
  boundLenis?.start();
}

export function unbindLenisFromScrollTrigger(lenis: Lenis) {
  if (boundLenis !== lenis) {
    return;
  }

  lenis.off("scroll", scrollUpdateHandler);

  boundLenis = null;
  ScrollTrigger.scrollerProxy(document.documentElement, {});
  ScrollTrigger.clearScrollMemory();
}
