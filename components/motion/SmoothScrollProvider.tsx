"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLayoutEffect, type ReactNode } from "react";

import { notifyMotionReady } from "@/lib/motion/motion-ready";
import { SMOOTH_SCROLL } from "@/lib/motion/smooth-scroll-config";
import {
  bindLenisToScrollTrigger,
  unbindLenisFromScrollTrigger,
} from "@/lib/motion/setup-lenis-scroll-trigger";
import { shouldEnableSmoothScroll } from "@/lib/motion/should-enable-smooth-scroll";

import "lenis/dist/lenis.css";

const SMOOTH_SCROLL_MEDIA_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(pointer: fine) and (min-width: 768px)",
  "(pointer: coarse)",
] as const;

type SmoothScrollRuntime = {
  lenis: Lenis;
};

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let runtime: SmoothScrollRuntime | null = null;

    const destroySmoothScroll = () => {
      if (!runtime) {
        notifyMotionReady();
        return;
      }

      unbindLenisFromScrollTrigger(runtime.lenis);
      runtime.lenis.destroy();
      runtime = null;
      ScrollTrigger.refresh();
      notifyMotionReady();
    };

    const initSmoothScroll = () => {
      if (runtime || !shouldEnableSmoothScroll()) {
        notifyMotionReady();
        return;
      }

      const lenis = new Lenis(SMOOTH_SCROLL.options);

      bindLenisToScrollTrigger(lenis);

      runtime = { lenis };
      ScrollTrigger.refresh();
      notifyMotionReady();
    };

    const syncSmoothScroll = () => {
      if (shouldEnableSmoothScroll()) {
        initSmoothScroll();
        return;
      }

      destroySmoothScroll();
    };

    const onMediaQueryChange = () => {
      destroySmoothScroll();
      syncSmoothScroll();
    };

    syncSmoothScroll();

    const mediaQueryLists = SMOOTH_SCROLL_MEDIA_QUERIES.map((query) =>
      window.matchMedia(query)
    );

    for (const mediaQueryList of mediaQueryLists) {
      mediaQueryList.addEventListener("change", onMediaQueryChange);
    }

    return () => {
      for (const mediaQueryList of mediaQueryLists) {
        mediaQueryList.removeEventListener("change", onMediaQueryChange);
      }

      destroySmoothScroll();
    };
  }, []);

  return children;
}
