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

  // Lenis の scrollTo と scrollIntoView はどちらも scroll-margin-top を
  // 自分で差し引くため、ヘッダー分の offset を渡すと二重に効く。
  if (!scrollBoundLenisTo(element, { immediate: true })) {
    element.scrollIntoView({ behavior: "auto", block: "start" });
  }
}
