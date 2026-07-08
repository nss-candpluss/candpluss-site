"use client";

import { useEffect, useRef, useState } from "react";

import { preloadImage } from "@/lib/products/preload-image";
import type { ProductImage } from "@/types/product";

type UseGalleryImageResult = {
  displayedImage: ProductImage | null;
  isInitialPriority: boolean;
  isDisplayed: boolean;
};

export function useGalleryImage(
  targetImage: ProductImage | null,
  priority = false
): UseGalleryImageResult {
  const [displayedImage, setDisplayedImage] = useState<ProductImage | null>(null);
  const [isDisplayed, setIsDisplayed] = useState(false);
  const displayedSrcRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const targetSrc = targetImage?.src ?? null;
  const targetAlt = targetImage?.alt ?? "";

  useEffect(() => {
    if (!targetSrc) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const nextImage: ProductImage = { src: targetSrc, alt: targetAlt };

    void preloadImage(targetSrc)
      .catch(() => undefined)
      .finally(() => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (displayedSrcRef.current === targetSrc) {
          return;
        }

        displayedSrcRef.current = targetSrc;
        setDisplayedImage(nextImage);
        setIsDisplayed(true);
      });
  }, [targetSrc, targetAlt]);

  return {
    displayedImage,
    isInitialPriority: priority && !isDisplayed,
    isDisplayed,
  };
}
