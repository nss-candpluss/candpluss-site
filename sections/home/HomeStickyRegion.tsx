"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type HomeStickyRegionProps = {
  children: ReactNode;
};

export function HomeStickyRegion({ children }: HomeStickyRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const region = regionRef.current;

    if (!region) {
      return;
    }

    const sync = () => {
      const background = region.querySelector<HTMLElement>(
        "[data-home-hero-background]"
      );
      const covering = region.querySelector<HTMLElement>("[data-home-covering]");
      const extra = Math.max(
        0,
        (background?.offsetHeight ?? 0) - (covering?.offsetHeight ?? 0)
      );

      region.style.paddingBottom = extra ? `${extra}px` : "";
      region.style.marginBottom = extra ? `-${extra}px` : "";
    };

    const background = region.querySelector<HTMLElement>(
      "[data-home-hero-background]"
    );
    const covering = region.querySelector<HTMLElement>("[data-home-covering]");
    const observer = new ResizeObserver(sync);

    if (background) {
      observer.observe(background);
    }

    if (covering) {
      observer.observe(covering);
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
    <div ref={regionRef} data-hero-section className="relative">
      {children}
    </div>
  );
}
