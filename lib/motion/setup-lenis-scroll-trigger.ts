import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

const scrollUpdateHandler = ScrollTrigger.update;

let boundLenis: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

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

  tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);
}

export function isLenisBound(): boolean {
  return boundLenis !== null;
}

export function getLenisScrollPosition(): number | null {
  return boundLenis?.scroll ?? null;
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

  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }

  boundLenis = null;
  ScrollTrigger.scrollerProxy(document.documentElement, {});
  ScrollTrigger.clearScrollMemory();
}
