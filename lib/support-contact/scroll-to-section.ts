import { SUPPORT_PRODUCT_SUPPORT_SECTION_ID } from "@/lib/paths";
import { scrollBoundLenisTo } from "@/lib/motion/setup-lenis-scroll-trigger";

export function scrollToSupportProductSupportHash(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.hash.slice(1) !== SUPPORT_PRODUCT_SUPPORT_SECTION_ID) {
    return;
  }

  const element = document.getElementById(SUPPORT_PRODUCT_SUPPORT_SECTION_ID);

  if (!element) {
    return;
  }

  const offset = -(parseFloat(getComputedStyle(element).scrollMarginTop) || 0);

  if (!scrollBoundLenisTo(element, { immediate: true, offset })) {
    element.scrollIntoView({ behavior: "auto", block: "start" });
  }
}
