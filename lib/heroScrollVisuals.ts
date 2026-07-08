import {
  clearHeroScrollSnapshot,
  readHeroScrollSnapshot,
  writeHeroScrollSnapshot,
} from "@/lib/heroScrollRestore";

export const OVERLAY_ALPHA = 0.82;
export const TITLE_OPACITY_END = 0.32;

export const TITLE_BASE_OFFSET_Y = {
  mobile: -160,
  desktop: -135,
} as const;

export const TITLE_SCROLL_DOWN_Y = {
  mobile: 100,
  desktop: 50,
} as const;

const BURST_DELAYS = [0, 16, 50, 100, 200, 400, 800, 1200, 2000, 3000] as const;
const BURST_RAF_MS = 2500;

export function supportsHeroScrollCss() {
  return (
    typeof CSS !== "undefined" &&
    CSS.supports("animation-timeline: scroll(root)")
  );
}

export function updateHeroScrollEndVar(section: HTMLElement) {
  const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 0);
  section.style.setProperty("--hero-scroll-end", `${scrollDistance}px`);
}

export function getTitleScrollValues() {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const titleStartY = isMobile
    ? TITLE_BASE_OFFSET_Y.mobile
    : TITLE_BASE_OFFSET_Y.desktop;
  const titleScrollDown = isMobile
    ? TITLE_SCROLL_DOWN_Y.mobile
    : TITLE_SCROLL_DOWN_Y.desktop;

  return {
    titleStartY,
    titleEndY: titleStartY + titleScrollDown,
  };
}

export function getHeroScrollProgress(
  section: HTMLElement,
  options?: { allowSnapshot?: boolean }
) {
  const scrollY = Math.max(
    window.scrollY || document.documentElement.scrollTop || 0,
    0
  );

  const viewportHeight = window.innerHeight;
  const scrollDistance = section.offsetHeight - viewportHeight;

  if (scrollDistance <= 0) {
    return 0;
  }

  if (scrollY <= 16) {
    if (options?.allowSnapshot) {
      const snapshot = readHeroScrollSnapshot();
      if (snapshot && snapshot.scrollY > 50) {
        return Math.min(1, Math.max(0, snapshot.progress));
      }
    }

    return 0;
  }

  const progressFromScroll = scrollY / scrollDistance;

  return Math.min(1, Math.max(0, progressFromScroll));
}

export function clearHeroInlineVisuals(
  section: HTMLElement,
  overlay: HTMLElement,
  titleLayer: HTMLElement
) {
  overlay.style.removeProperty("background-color");
  titleLayer.style.removeProperty("opacity");
  titleLayer.style.removeProperty("transform");
  section.dataset.heroProgress = "";
}

export function clearHeroVisualsForCssMode() {
  const elements = queryHeroElements();
  if (!elements) {
    return false;
  }

  const { section, overlay, titleLayer } = elements;
  clearHeroInlineVisuals(section, overlay, titleLayer);
  section.dataset.heroScrollMode = "css";
  return true;
}

export function applyHeroVisualsToElements(
  section: HTMLElement,
  overlay: HTMLElement,
  titleLayer: HTMLElement,
  progress: number
) {
  if (supportsHeroScrollCss()) {
    clearHeroInlineVisuals(section, overlay, titleLayer);
    section.dataset.heroProgress = progress.toFixed(3);
    section.dataset.heroScrollMode = "css";
    return;
  }

  const { titleStartY, titleEndY } = getTitleScrollValues();
  const overlayAlpha = progress * OVERLAY_ALPHA;
  const titleOpacity = 1 - progress * (1 - TITLE_OPACITY_END);
  const titleY = titleStartY + (titleEndY - titleStartY) * progress;

  overlay.style.backgroundColor = `rgba(0,0,0,${overlayAlpha})`;
  titleLayer.style.opacity = String(titleOpacity);
  titleLayer.style.transform = `translate3d(0, ${titleY}px, 0)`;
  section.dataset.heroProgress = progress.toFixed(3);
  section.dataset.heroScrollMode = "js";

  if (progress <= 0.001) {
    clearHeroScrollSnapshot();
    return;
  }

  if (window.scrollY > 0) {
    writeHeroScrollSnapshot(window.scrollY, progress);
  }
}

export function queryHeroElements() {
  const section = document.querySelector<HTMLElement>("[data-hero-section]");
  if (!section) {
    return null;
  }

  const overlay = section.querySelector<HTMLElement>(".hero-overlay");
  const titleLayer = section.querySelector<HTMLElement>("[data-hero-title-layer]");

  if (!overlay || !titleLayer) {
    return null;
  }

  return { section, overlay, titleLayer };
}

export function syncHeroVisualsFromDom(
  source: string,
  debugLog?: (payload: Record<string, unknown>) => void,
  options?: { allowSnapshot?: boolean }
) {
  const elements = queryHeroElements();
  if (!elements) {
    debugLog?.({ source, found: false });
    return false;
  }

  const { section, overlay, titleLayer } = elements;
  const progress = getHeroScrollProgress(section, options);

  applyHeroVisualsToElements(section, overlay, titleLayer, progress);

  debugLog?.({
    source,
    found: true,
    progress,
    scrollY: window.scrollY,
    sectionTop: section.getBoundingClientRect().top,
    allowSnapshot: options?.allowSnapshot ?? false,
  });

  return true;
}

export function scheduleHeroBurstSync(
  source: string,
  syncFn: (source: string, allowSnapshot?: boolean) => void,
  allowSnapshot = false,
  rafMs = BURST_RAF_MS
) {
  syncFn(`${source}:immediate`, allowSnapshot);

  BURST_DELAYS.forEach((delay) => {
    window.setTimeout(() => {
      syncFn(`${source}:retry:${delay}`, allowSnapshot);
    }, delay);
  });

  const start = performance.now();

  const rafBurst = () => {
    syncFn(`${source}:raf`, allowSnapshot);

    if (performance.now() - start < rafMs) {
      window.requestAnimationFrame(rafBurst);
    }
  };

  window.requestAnimationFrame(rafBurst);
}

declare global {
  interface Window {
    __heroScrollSync?: () => void;
  }
}
