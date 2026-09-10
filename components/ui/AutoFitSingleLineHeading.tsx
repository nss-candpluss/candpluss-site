"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";

type AutoFitSingleLineHeadingProps = ComponentPropsWithoutRef<"h2">;

export function AutoFitSingleLineHeading({
  className = "",
  ...props
}: AutoFitSingleLineHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const area = heading?.parentElement;

    if (!heading || !area) {
      return;
    }

    let frameId = 0;
    let active = true;

    const fitHeading = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        heading.style.removeProperty("font-size");
        heading.style.removeProperty("line-height");

        const availableWidth = area.clientWidth;
        const naturalWidth = heading.scrollWidth;

        if (naturalWidth <= availableWidth || availableWidth === 0) {
          return;
        }

        const baseFontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
        const fittedFontSize = baseFontSize * (availableWidth / naturalWidth);

        heading.style.fontSize = `${fittedFontSize}px`;
        heading.style.lineHeight = `${fittedFontSize}px`;
      });
    };

    const resizeObserver = new ResizeObserver(fitHeading);
    resizeObserver.observe(area);
    fitHeading();

    void document.fonts.ready.then(() => {
      if (active) {
        fitHeading();
      }
    });
    document.fonts.addEventListener("loadingdone", fitHeading);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      document.fonts.removeEventListener("loadingdone", fitHeading);
      heading.style.removeProperty("font-size");
      heading.style.removeProperty("line-height");
    };
  }, []);

  return (
    <h2
      ref={headingRef}
      className={`max-w-full whitespace-nowrap ${className}`.trim()}
      {...props}
    />
  );
}
