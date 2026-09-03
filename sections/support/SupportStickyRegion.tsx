"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type SupportStickyRegionProps = {
  children: ReactNode;
};

export function SupportStickyRegion({ children }: SupportStickyRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const region = regionRef.current;

    if (!region) {
      return;
    }

    const sync = () => {
      const background = region.querySelector<HTMLElement>(
        "[data-support-hero-background]"
      );
      const guide = region.querySelector<HTMLElement>("[data-support-guide]");
      const extra = Math.max(
        0,
        (background?.offsetHeight ?? 0) - (guide?.offsetHeight ?? 0)
      );

      region.style.paddingBottom = extra ? `${extra}px` : "";
      region.style.marginBottom = extra ? `-${extra}px` : "";
    };

    const background = region.querySelector<HTMLElement>(
      "[data-support-hero-background]"
    );
    const guide = region.querySelector<HTMLElement>("[data-support-guide]");
    const observer = new ResizeObserver(sync);

    if (background) {
      observer.observe(background);
    }

    if (guide) {
      observer.observe(guide);
    }

    window.addEventListener("resize", sync);
    sync();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      region.style.paddingBottom = "";
      region.style.marginBottom = "";
    };
  }, []);

  return (
    <div ref={regionRef} className="relative">
      {children}
    </div>
  );
}
