"use client";

import { useCallback, useEffect, useState } from "react";

import { productDetailTabs } from "@/types/product";

import { getHeaderOffset } from "@/lib/products/scroll-offsets";

function getAvailableTabs() {
  return productDetailTabs.filter((tab) => document.getElementById(tab.id));
}

function resolveActiveSectionId(): string {
  const hash = window.location.hash.slice(1);
  if (hash && productDetailTabs.some((tab) => tab.id === hash)) {
    const hashTarget = document.getElementById(hash);
    if (hashTarget) {
      return hash;
    }
  }

  const tabs = getAvailableTabs();
  if (!tabs.length) {
    return "photo";
  }

  const scrollPosition = window.scrollY + getHeaderOffset() + 1;
  let currentId = tabs[0].id;

  for (const tab of tabs) {
    const element = document.getElementById(tab.id);
    if (!element) {
      continue;
    }

    const sectionTop = element.getBoundingClientRect().top + window.scrollY;
    if (scrollPosition >= sectionTop) {
      currentId = tab.id;
    }
  }

  return currentId;
}

export function useProductDetailActiveSection() {
  const [activeSectionId, setActiveSectionId] = useState("photo");

  const updateActiveSection = useCallback(() => {
    setActiveSectionId(resolveActiveSectionId());
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateActiveSection);

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [updateActiveSection]);

  return { activeSectionId, setActiveSectionId };
}
