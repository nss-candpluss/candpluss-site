"use client";

/**
 * Shopify の Product データを表示する商品詳細 View。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProductDetailDesktopHero } from "@/components/products/product-detail/ProductDetailDesktopHero";
import {
  ProductDetailFeatureSection,
  type ProductDetailFeature,
} from "@/components/products/product-detail/ProductDetailFeatureSection";
import { ProductDetailMobileHero } from "@/components/products/product-detail/ProductDetailMobileHero";
import { buildProductDetailGallery } from "@/components/products/product-detail/gallery-items";
import {
  isConstrainedGalleryConnection,
  preloadProductDetailImage,
  uniqueImageSources,
} from "@/components/products/product-detail/image-preload";
import { ProductOptions } from "@/components/products/ProductOptions";
import { ProductSizeSpecSection } from "@/components/products/ProductSizeSpec";
import {
  getSelectedVariant,
  isPlaceholderProductVariantId,
  resolveProductVariantId,
} from "@/lib/products/helpers";
import { productDetailSectionTitleClassName, uiText } from "@/lib/typography";
import type { Product } from "@/types/product";

type ProductDetailViewProps = {
  product: Product;
  initialVariantId: string;
  optionProducts: Product[];
  priority?: boolean;
};

const PRODUCT_DETAIL_SECTION_TITLE_CLASS_NAME = productDetailSectionTitleClassName;

const PRODUCT_DETAIL_SIZE_SPEC_TYPOGRAPHY = {
  title: PRODUCT_DETAIL_SECTION_TITLE_CLASS_NAME,
  itemName: uiText(14),
  content: "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[24.5px]",
  note: "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(22.75px,calc(24.5px*var(--text-scale)),24.5px)]",
} as const;

function buildProductFeatures(product: Product): ProductDetailFeature[] {
  return product.features ?? [];
}

/**
 * 選択中のカラーを URL に反映し、その状態のまま共有・ブックマークできるようにする。
 * 履歴を増やさないよう replaceState を使う（一覧のカテゴリ絞り込みと同じ方針）。
 * basePath や他のクエリ・ハッシュを壊さないため現在の URL を基点に書き換える。
 */
function syncVariantIdToUrl(variantId: string) {
  const url = new URL(window.location.href);

  if (isPlaceholderProductVariantId(variantId)) {
    url.searchParams.delete("color");
  } else {
    url.searchParams.set("color", variantId);
  }

  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

export function ProductDetailView({
  product,
  initialVariantId,
  optionProducts,
}: ProductDetailViewProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
  const variantRequestRef = useRef(0);

  const preloadVariantEntry = useCallback(
    (variantId: string) => {
      const variant = getSelectedVariant(product, variantId);
      const gallery = buildProductDetailGallery(product, variant);
      const firstItem = gallery[0];
      const thumbnailSources = gallery.map((item) =>
        item.kind === "image" ? item.thumbnailSrc : item.thumbnailPoster
      );
      const criticalSources = uniqueImageSources([
        ...(firstItem?.kind === "image" ? [firstItem.src] : []),
        ...thumbnailSources.slice(0, 6),
      ]);
      const deferredSources = uniqueImageSources(thumbnailSources.slice(6));

      deferredSources.forEach((source) => {
        void preloadProductDetailImage(source);
      });

      return Promise.all(criticalSources.map(preloadProductDetailImage)).then((results) =>
        results.every(Boolean)
      );
    },
    [product]
  );

  const handleVariantIntent = useCallback(
    (variantId: string) => {
      void preloadVariantEntry(variantId);
    },
    [preloadVariantEntry]
  );

  const handleVariantChange = useCallback(
    async (variantId: string) => {
      if (variantId === selectedVariantId) {
        return;
      }

      const requestId = ++variantRequestRef.current;
      await preloadVariantEntry(variantId);

      if (requestId === variantRequestRef.current) {
        setSelectedVariantId(variantId);
        syncVariantIdToUrl(variantId);
      }
    },
    [preloadVariantEntry, selectedVariantId]
  );

  useEffect(() => {
    const variantIdFromUrl = new URLSearchParams(window.location.search).get("color");
    if (!variantIdFromUrl) {
      return;
    }

    const resolvedVariantId = resolveProductVariantId(product, variantIdFromUrl);
    const timeoutId = window.setTimeout(() => {
      void preloadVariantEntry(resolvedVariantId).then(() => {
        setSelectedVariantId(resolvedVariantId);
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [preloadVariantEntry, product]);

  const selectedVariant = useMemo(
    () => getSelectedVariant(product, selectedVariantId),
    [product, selectedVariantId]
  );

  const selectedColorCode = selectedVariant?.colorCode ?? "";
  const galleryItems = useMemo(
    () => buildProductDetailGallery(product, selectedVariant),
    [product, selectedVariant]
  );
  const features = useMemo(() => buildProductFeatures(product), [product]);

  useEffect(() => {
    if (!selectedColorCode) {
      return;
    }

    let cancelled = false;
    const currentGallerySources = galleryItems.flatMap(
      (item) => (item.kind === "image" ? [item.src] : [item.poster])
    );
    const alternateEntrySources = product.variants.flatMap((variant) => {
      if (variant.id === selectedVariantId) {
        return [];
      }

      const gallery = buildProductDetailGallery(product, variant);
      const firstItem = gallery[0];
      return [
        ...(firstItem?.kind === "image" ? [firstItem.src] : []),
        ...gallery.map((item) =>
          item.kind === "image" ? item.thumbnailSrc : item.thumbnailPoster
        ),
      ];
    });
    const queue = uniqueImageSources([
      ...currentGallerySources,
      ...alternateEntrySources,
    ]);
    const workerCount = isConstrainedGalleryConnection() ? 1 : 3;

    const preloadWorker = async () => {
      while (!cancelled) {
        const nextSource = queue.shift();
        if (!nextSource) {
          return;
        }

        await preloadProductDetailImage(nextSource);
      }
    };

    const startPreloading = () => {
      void Promise.all(
        Array.from({ length: workerCount }, () => preloadWorker())
      );
    };

    if (document.readyState === "complete") {
      startPreloading();
    } else {
      window.addEventListener("load", startPreloading, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", startPreloading);
    };
  }, [galleryItems, product, selectedColorCode, selectedVariantId]);

  return (
    <>
      <ProductDetailDesktopHero
        key={`desktop-${selectedColorCode}`}
        items={galleryItems}
        product={product}
        selectedVariant={selectedVariant}
        selectedColorCode={selectedColorCode}
        onVariantChange={handleVariantChange}
        onVariantIntent={handleVariantIntent}
      />

      <ProductDetailMobileHero
        key={`mobile-${selectedColorCode}`}
        items={galleryItems}
        product={product}
        selectedVariant={selectedVariant}
        selectedColorCode={selectedColorCode}
        onVariantChange={handleVariantChange}
        onVariantIntent={handleVariantIntent}
      />

      <ProductDetailFeatureSection
        id="feature"
        title="Feature"
        features={features}
        priorityFirst
      />

      {product.sizeSpec ? (
        <ProductSizeSpecSection
          sizeSpec={product.sizeSpec}
          typography={PRODUCT_DETAIL_SIZE_SPEC_TYPOGRAPHY}
        />
      ) : null}

      {optionProducts.length ? (
        <ProductOptions
          products={optionProducts}
          titleTypographyClassName={PRODUCT_DETAIL_SECTION_TITLE_CLASS_NAME}
          cardPresentation="productsListing"
        />
      ) : null}
    </>
  );
}
