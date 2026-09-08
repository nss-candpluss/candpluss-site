import { scrollBoundLenisTo } from "@/lib/motion/setup-lenis-scroll-trigger";

export function scrollToPageTop(): void {
  if (window.location.hash) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );
  }

  if (!scrollBoundLenisTo(0)) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
