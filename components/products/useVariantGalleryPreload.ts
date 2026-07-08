"use client";

import { useEffect } from "react";

import { getAllVariantGalleryImageSources } from "@/lib/products/gallery";
import {
  preloadImagesSequentially,
  scheduleIdleTask,
} from "@/lib/products/preload-image";
import type { ProductVariant } from "@/types/product";

/**
 * 選択中 Variant の全画像を初期表示後に順次プリロードし、
 * 完了後はアイドル時間に他カラー Variant を1つずつ順次プリロードする。
 */
export function useVariantGalleryPreload(
  selectedVariant: ProductVariant | null,
  allVariants: ProductVariant[],
  enabled: boolean
): void {
  const selectedVariantId = selectedVariant?.id ?? null;

  useEffect(() => {
    if (!enabled || !selectedVariantId || !selectedVariant) {
      return;
    }

    let cancelled = false;

    const preloadOtherVariants = async () => {
      const otherVariants = allVariants.filter((variant) => variant.id !== selectedVariantId);

      for (const variant of otherVariants) {
        if (cancelled) {
          return;
        }

        await new Promise<void>((resolve) => {
          scheduleIdleTask(() => resolve());
        });

        if (cancelled) {
          return;
        }

        await preloadImagesSequentially(getAllVariantGalleryImageSources(variant));
      }
    };

    const run = async () => {
      await preloadImagesSequentially(getAllVariantGalleryImageSources(selectedVariant));

      if (cancelled) {
        return;
      }

      await preloadOtherVariants();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [allVariants, enabled, selectedVariant, selectedVariantId]);
}
