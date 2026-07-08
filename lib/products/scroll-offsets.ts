const HEADER_OFFSET_FALLBACK_PX = 80;

export function getHeaderOffset(): number {
  if (typeof window === "undefined") {
    return HEADER_OFFSET_FALLBACK_PX;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : HEADER_OFFSET_FALLBACK_PX;
}

export function getProductDetailPanelOffset(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  if (window.matchMedia("(min-width: 1024px)").matches) {
    return 0;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--product-detail-panel-height"
  );
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}
