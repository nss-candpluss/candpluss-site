import { getHeaderOffset } from "@/lib/products/scroll-offsets";

export function scrollToSectionStart(element: HTMLElement, behavior: ScrollBehavior = "auto"): void {
  const top = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  window.scrollTo({
    top,
    behavior,
  });
}

export function getScrollBehavior(preferReducedMotion: boolean): ScrollBehavior {
  return preferReducedMotion ? "auto" : "smooth";
}
