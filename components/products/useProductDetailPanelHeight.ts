"use client";

import { useEffect, type RefObject } from "react";

const MOBILE_PANEL_MEDIA_QUERY = "(max-width: 1024px)";

function clearPanelHeight(): void {
  document.documentElement.style.setProperty("--product-detail-panel-height", "0px");
}

function setPanelHeight(height: number): void {
  document.documentElement.style.setProperty(
    "--product-detail-panel-height",
    `${height}px`
  );
}

export function useProductDetailPanelHeight(
  panelRef: RefObject<HTMLElement | null>,
  enabled = true
): void {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_PANEL_MEDIA_QUERY);

    const updateHeight = () => {
      if (!mediaQuery.matches || !enabled) {
        clearPanelHeight();
        return;
      }

      setPanelHeight(panel.offsetHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(panel);
    mediaQuery.addEventListener("change", updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", updateHeight);
      window.removeEventListener("resize", updateHeight);
      clearPanelHeight();
    };
  }, [enabled, panelRef]);
}
