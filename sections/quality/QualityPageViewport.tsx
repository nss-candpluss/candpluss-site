"use client";

import { useEffect } from "react";

const ROOT_CLASS = "quality-page";

function setAppViewportHeight() {
  document.documentElement.style.setProperty(
    "--app-vh",
    `${window.innerHeight * 0.01}px`
  );
}

/** Quality ページ表示中のみ --app-vh を設定し、実 viewport 高さに追従させる */
export function QualityPageViewport() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(ROOT_CLASS);
    setAppViewportHeight();

    window.addEventListener("resize", setAppViewportHeight, { passive: true });
    window.addEventListener("orientationchange", setAppViewportHeight, { passive: true });

    return () => {
      root.classList.remove(ROOT_CLASS);
      root.style.removeProperty("--app-vh");
      window.removeEventListener("resize", setAppViewportHeight);
      window.removeEventListener("orientationchange", setAppViewportHeight);
    };
  }, []);

  return null;
}
