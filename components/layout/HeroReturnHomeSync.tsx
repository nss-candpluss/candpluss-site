"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import {
  clearHeroRestoreStateIfFreshHomeVisit,
  shouldRestoreHeroOnReturnHome,
} from "@/lib/heroScrollRestoreDetect";
import {
  consumeHeroPendingReturn,
  markHeroPendingReturn,
  readHeroLastPathname,
  writeHeroLastPathname,
} from "@/lib/heroScrollRestore";
import {
  clearHeroVisualsForCssMode,
  scheduleHeroBurstSync,
  supportsHeroScrollCss,
  syncHeroVisualsFromDom,
} from "@/lib/heroScrollVisuals";

const DEBUG = process.env.NODE_ENV === "development";

function logSync(label: string, payload: Record<string, unknown>) {
  if (!DEBUG) {
    return;
  }

  console.log(`[HeroReturnHomeSync] ${label}`, payload);
}

function syncHeroFromLayout(source: string, allowSnapshot = false) {
  syncHeroVisualsFromDom(
    source,
    (payload) => {
      logSync("sync", payload);
    },
    { allowSnapshot }
  );
}

function scheduleReturnHomeSync(source: string) {
  logSync("return-home", {
    source,
    scrollY: window.scrollY,
    storedPrevious: readHeroLastPathname(),
  });

  scheduleHeroBurstSync(
    source,
    (retrySource, allowSnapshot) => {
      syncHeroFromLayout(retrySource, allowSnapshot);
      window.__heroScrollSync?.();
    },
    true,
    5000
  );

  consumeHeroPendingReturn();
}

function runHomeHeroSync(trigger: string, pathname: string) {
  if (pathname !== "/") {
    return;
  }

  if (supportsHeroScrollCss()) {
    clearHeroVisualsForCssMode();
    return;
  }

  if (shouldRestoreHeroOnReturnHome(pathname)) {
    scheduleReturnHomeSync(trigger);
    return;
  }

  clearHeroRestoreStateIfFreshHomeVisit(pathname);
  syncHeroFromLayout(`${trigger}:home`);
}

export function HeroReturnHomeSync() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    let scrollTicking = false;

    const handleScroll = () => {
      if (pathname !== "/") {
        return;
      }

      if (supportsHeroScrollCss()) {
        return;
      }

      if (scrollTicking) {
        return;
      }

      scrollTicking = true;
      window.requestAnimationFrame(() => {
        syncHeroFromLayout("global:scroll");
        scrollTicking = false;
      });
    };

    const handlePageShow = () => {
      runHomeHeroSync("pageshow", pathname);
    };

    const handlePopState = () => {
      runHomeHeroSync("popstate", pathname);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    runHomeHeroSync("mount", pathname);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const refPrevious = previousPathnameRef.current;
    const storedPrevious = readHeroLastPathname();

    if (pathname !== "/") {
      if (refPrevious === "/" || storedPrevious === "/") {
        markHeroPendingReturn();
      }

      previousPathnameRef.current = pathname;
      writeHeroLastPathname(pathname);
      return;
    }

    const returnedFromOtherPage = Boolean(
      (refPrevious && refPrevious !== "/") ||
        (storedPrevious && storedPrevious !== "/")
    );

    runHomeHeroSync("pathname", pathname);

    if (returnedFromOtherPage) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          runHomeHeroSync("pathname:deferred", pathname);
        });
      });
    }

    previousPathnameRef.current = pathname;
    writeHeroLastPathname(pathname);
  }, [pathname]);

  return null;
}
