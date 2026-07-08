import {
  clearHeroPendingReturn,
  clearHeroScrollSnapshot,
  isHeroPendingReturn,
  readHeroLastPathname,
  readHeroScrollSnapshot,
} from "@/lib/heroScrollRestore";

export function getNavigationType() {
  if (typeof performance === "undefined") {
    return null;
  }

  const [navigationEntry] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];

  return navigationEntry?.type ?? null;
}

export function shouldRestoreHeroOnReturnHome(pathname = "/") {
  if (pathname !== "/") {
    return false;
  }

  const storedPrevious = readHeroLastPathname();
  if (storedPrevious && storedPrevious !== "/") {
    const navigationType = getNavigationType();
    if (navigationType !== "reload") {
      return true;
    }
  }

  if (getNavigationType() === "back_forward") {
    return true;
  }

  if (isHeroPendingReturn()) {
    return true;
  }

  if (window.scrollY > 50) {
    return true;
  }

  const snapshot = readHeroScrollSnapshot();
  return (snapshot?.scrollY ?? 0) > 50;
}

export function clearHeroRestoreStateIfFreshHomeVisit(pathname = "/") {
  const navigationType = getNavigationType();
  const snapshot = readHeroScrollSnapshot();

  if (
    pathname === "/" &&
    navigationType === "navigate" &&
    window.scrollY <= 16 &&
    !isHeroPendingReturn() &&
    (snapshot?.scrollY ?? 0) <= 50
  ) {
    clearHeroPendingReturn();
    clearHeroScrollSnapshot();
  }
}
