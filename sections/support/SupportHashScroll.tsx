"use client";

import { useEffect } from "react";

import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { scrollToSupportProductSupportHash } from "@/lib/support-contact/scroll-to-section";

export function SupportHashScroll() {
  useEffect(() => {
    let frameId = 0;

    const run = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = window.requestAnimationFrame(scrollToSupportProductSupportHash);
      });
    };

    const unsubscribe = subscribeMotionReady(run);
    window.addEventListener("hashchange", run);
    window.addEventListener("load", run);
    const timeoutId = window.setTimeout(run, 250);

    return () => {
      unsubscribe();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", run);
      window.removeEventListener("load", run);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
