"use client";

import { useEffect, useState, type RefObject } from "react";

const MOBILE_PANEL_MEDIA_QUERY = "(max-width: 1024px)";
const DOCK_ENTER_PX = 2;
const DOCK_EXIT_PX = 12;

export function useProductDetailDockingPanel(
  dockRef: RefObject<HTMLElement | null>
): boolean {
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_PANEL_MEDIA_QUERY);

    const updateDockState = () => {
      if (!mediaQuery.matches) {
        setIsDocked(false);
        return;
      }

      const dockTop = dock.getBoundingClientRect().top;
      const anchorTop = window.innerHeight - dock.offsetHeight;

      setIsDocked((previous) => {
        if (dockTop <= anchorTop + DOCK_ENTER_PX) {
          return true;
        }

        if (dockTop > anchorTop + DOCK_EXIT_PX) {
          return false;
        }

        return previous;
      });
    };

    updateDockState();

    window.addEventListener("scroll", updateDockState, { passive: true });
    window.addEventListener("resize", updateDockState);
    mediaQuery.addEventListener("change", updateDockState);

    const resizeObserver = new ResizeObserver(updateDockState);
    resizeObserver.observe(dock);

    return () => {
      window.removeEventListener("scroll", updateDockState);
      window.removeEventListener("resize", updateDockState);
      mediaQuery.removeEventListener("change", updateDockState);
      resizeObserver.disconnect();
    };
  }, [dockRef]);

  return isDocked;
}
