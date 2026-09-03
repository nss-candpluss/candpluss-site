"use client";

import { useEffect, useRef } from "react";

import { maskGraphicStyle } from "@/lib/maskStyle";
import { SITE_LOADER_STORAGE_KEY } from "@/lib/site-loader";

export function SiteLoader() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const overlay = overlayRef.current;

    if (root.dataset.loader !== "pending" || !overlay) {
      return;
    }

    function finish() {
      try {
        sessionStorage.setItem(SITE_LOADER_STORAGE_KEY, "1");
      } catch {
        // sessionStorage may be unavailable
      }

      root.dataset.loader = "done";
    }

    function handleAnimationEnd(event: AnimationEvent) {
      if (event.target !== overlay || event.animationName !== "site-loader-overlay") {
        return;
      }

      finish();
    }

    overlay.addEventListener("animationend", handleAnimationEnd);

    return () => {
      overlay.removeEventListener("animationend", handleAnimationEnd);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="site-loader"
      aria-hidden="true"
      role="presentation"
    >
      <div className="site-loader__stage">
        <span className="site-loader__plus" aria-hidden="true">
          <span className="site-loader__plus-bar site-loader__plus-bar--x" />
          <span className="site-loader__plus-bar site-loader__plus-bar--y" />
        </span>
        <span
          className="site-loader__logo"
          style={maskGraphicStyle("/assets/logos/logo-candpluss.svg")}
        />
        <span className="site-loader__rule" />
      </div>
    </div>
  );
}
