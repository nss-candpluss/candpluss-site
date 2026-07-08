"use client";

import { useCallback, type MouseEvent } from "react";

import { useProductDetailActiveSection } from "@/components/products/useProductDetailActiveSection";
import {
  getScrollBehavior,
  scrollToSectionStart,
} from "@/lib/products/scroll-to-section";
import { getHeaderOffset } from "@/lib/products/scroll-offsets";
import {
  hoverUnderlineActiveClassName,
  hoverUnderlineHoverClassName,
} from "@/components/ui/TextLink";
import { productDetailTabs } from "@/types/product";
import { uiText } from "@/lib/typography";

type ProductDetailTab = (typeof productDetailTabs)[number];

type ProductDetailNavProps = {
  className?: string;
  tabs?: readonly ProductDetailTab[];
};

export function ProductDetailNav({
  className = "",
  tabs = productDetailTabs,
}: ProductDetailNavProps) {
  const { activeSectionId, setActiveSectionId } = useProductDetailActiveSection();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      event.preventDefault();

      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      setActiveSectionId(sectionId);

      const behavior = getScrollBehavior(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );

      if (sectionId === "photo") {
        const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

        window.scrollTo({
          top,
          behavior,
        });
      } else {
        scrollToSectionStart(target, behavior);
      }

      window.history.pushState(null, "", `#${sectionId}`);
    },
    [setActiveSectionId]
  );

  return (
    <nav
      aria-label="Product information"
      className={`box-border flex flex-wrap items-center justify-start gap-x-[calc(32px*var(--gap-scale-x))] gap-y-[calc(12px*var(--gap-scale-y))] ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = activeSectionId === tab.id;

        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={isActive ? "location" : undefined}
            onClick={(event) => handleClick(event, tab.id)}
            className={`font-ui-en font-semibold text-[var(--foreground)] ${uiText(16)} transition-opacity duration-200 ${
              isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
            } ${isActive ? hoverUnderlineActiveClassName : hoverUnderlineHoverClassName}`}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
