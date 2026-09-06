"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProductDetailActionPanel } from "@/components/products/ProductDetailActionPanel";
import { ProductDetailDescription } from "@/components/products/ProductDetailDescription";
import { ProductDetailInfo } from "@/components/products/ProductDetailInfo";
import { ProductDetailNav } from "@/components/products/ProductDetailNav";
import { ProductFeatures } from "@/components/products/ProductFeatures";
import { ProductDetailScrollImages } from "@/components/products/ProductDetailScrollImages";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductOptions } from "@/components/products/ProductOptions";
import { ProductSizeSpecSection } from "@/components/products/ProductSizeSpec";
import { useGalleryImage } from "@/components/products/useGalleryImage";
import { useProductDetailDockingPanel } from "@/components/products/useProductDetailDockingPanel";
import { useProductDetailPanelHeight } from "@/components/products/useProductDetailPanelHeight";
import { useVariantGalleryPreload } from "@/components/products/useVariantGalleryPreload";
import {
  getActiveGalleryImages,
  getDefaultOpenCloseGroupId,
  usesCarouselGallery,
} from "@/lib/products/gallery";
import { getVisibleProductDetailTabs } from "@/lib/products/detail-tabs";
import {
  getSelectedVariant,
  resolveProductVariantId,
} from "@/lib/products/helpers";
import type { OpenCloseGroupId, Product, ProductVariant } from "@/types/product";

type ProductDetailViewProps = {
  product: Product;
  initialVariantId: string;
  optionProducts: Product[];
  priority?: boolean;
};

const mobileActionPanelClassName =
  "bg-[var(--background)] px-[var(--container-x)] pt-[16px] pb-[max(calc(72px*var(--layout-scale-y)),env(safe-area-inset-bottom))]";

type ActionPanelContentProps = {
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedColorCode: string;
  onVariantChange: (variantId: string) => void;
};

function ActionPanelContent({
  product,
  selectedVariant,
  selectedColorCode,
  onVariantChange,
}: ActionPanelContentProps) {
  return (
    <ProductDetailActionPanel
      product={product}
      selectedVariant={selectedVariant}
      selectedColorCode={selectedColorCode}
      onVariantChange={onVariantChange}
    />
  );
}

export function ProductDetailView({
  product,
  initialVariantId,
  optionProducts,
  priority = false,
}: ProductDetailViewProps) {
  const searchParams = useSearchParams();
  const variantIdFromUrl = searchParams.get("color");
  const resolvedInitialVariantId = resolveProductVariantId(
    product,
    variantIdFromUrl ?? initialVariantId
  );

  const dockPanelRef = useRef<HTMLDivElement>(null);
  const fixedPanelRef = useRef<HTMLDivElement>(null);
  const isDocked = useProductDetailDockingPanel(dockPanelRef);
  useProductDetailPanelHeight(fixedPanelRef, !isDocked);

  const [selectedVariantId, setSelectedVariantId] = useState(resolvedInitialVariantId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGroupId, setCurrentGroupId] = useState<OpenCloseGroupId>(
    getDefaultOpenCloseGroupId()
  );

  const selectedVariant = useMemo(
    () => getSelectedVariant(product, selectedVariantId),
    [product, selectedVariantId]
  );

  const activeImages = useMemo(() => {
    if (!selectedVariant) {
      return [];
    }

    return getActiveGalleryImages(selectedVariant.gallery, currentGroupId);
  }, [selectedVariant, currentGroupId]);

  const targetImage = activeImages[currentIndex] ?? null;

  const { displayedImage, isInitialPriority, isDisplayed } = useGalleryImage(
    targetImage,
    priority
  );

  useVariantGalleryPreload(selectedVariant, product.variants, isDisplayed);

  const selectedColorCode = selectedVariant?.colorCode ?? "";

  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setCurrentIndex(0);
    setCurrentGroupId(getDefaultOpenCloseGroupId());
  }, []);

  const handleGroupChange = useCallback((groupId: OpenCloseGroupId) => {
    setCurrentGroupId(groupId);
    setCurrentIndex(0);
  }, []);

  const handlePrevious = useCallback(() => {
    if (!activeImages.length) {
      return;
    }

    setCurrentIndex((index) => (index === 0 ? activeImages.length - 1 : index - 1));
  }, [activeImages.length]);

  const handleNext = useCallback(() => {
    if (!activeImages.length) {
      return;
    }

    setCurrentIndex((index) => (index === activeImages.length - 1 ? 0 : index + 1));
  }, [activeImages.length]);

  const actionPanelProps = {
    product,
    selectedVariant,
    selectedColorCode,
    onVariantChange: handleVariantChange,
  };

  const visibleTabs = useMemo(
    () => getVisibleProductDetailTabs(product, optionProducts),
    [product, optionProducts]
  );

  const useVerticalStackGallery =
    !usesCarouselGallery(product.handle) && activeImages.length > 1;
  const showGalleryControls =
    usesCarouselGallery(product.handle) && activeImages.length > 1;

  return (
    <>
      <div
        className={
          isDocked ? undefined : "max-[1025px]:pb-[var(--product-detail-panel-height)]"
        }
      >
        <div className="grid grid-cols-1 gap-x-[calc(32px*var(--gap-scale-x))] gap-y-[calc(32px*var(--gap-scale-y))] min-[1025px]:grid-cols-[221fr_149fr] min-[1025px]:items-start min-[1025px]:gap-x-[calc(80px*var(--gap-scale-x))] gap-y-[calc(80px*var(--gap-scale-y))]">
          <div
            id="photo"
            className="flex flex-col gap-[calc(8px*var(--gap-scale-y))] scroll-mt-[var(--header-height)]"
          >
            {useVerticalStackGallery ? (
              <ProductDetailScrollImages images={activeImages} priority={priority} />
            ) : (
              <ProductGallery
                gallery={selectedVariant?.gallery}
                imageCount={activeImages.length}
                currentGroupId={currentGroupId}
                displayedImage={displayedImage}
                isInitialPriority={isInitialPriority}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onGroupChange={handleGroupChange}
                showControls={showGalleryControls}
              />
            )}

            {product.scrollImages?.length ? (
              <ProductDetailScrollImages images={product.scrollImages} />
            ) : null}

            <div
              ref={dockPanelRef}
              className={`${mobileActionPanelClassName} min-[1025px]:hidden ${
                isDocked ? "visible" : "invisible pointer-events-none"
              }`}
              aria-hidden={!isDocked}
            >
              <ActionPanelContent {...actionPanelProps} />
            </div>

            <ProductDetailDescription
              product={product}
              className="px-[var(--container-x)] pt-[calc(32px*var(--gap-scale-y))] pb-[calc(32px*var(--gap-scale-y))] min-[1025px]:hidden"
            />

            <ProductDetailNav
              tabs={visibleTabs}
              className="mt-[calc(72px*var(--gap-scale-y))] px-[var(--container-x)] pb-[max(calc(144px*var(--layout-scale-y)),env(safe-area-inset-bottom))] min-[1025px]:hidden"
            />
          </div>

          <div className="relative hidden min-[1025px]:sticky min-[1025px]:top-0 min-[1025px]:flex min-[1025px]:h-[100svh] min-[1025px]:flex-col min-[1025px]:px-0 min-[1025px]:pr-[var(--container-x)] min-[1025px]:pt-[var(--container-y-top)]">
            <ProductDetailInfo
              product={product}
              selectedVariant={selectedVariant}
              selectedColorCode={selectedColorCode}
              onVariantChange={handleVariantChange}
            />

            <ProductDetailNav
              tabs={visibleTabs}
              className="min-[1025px]:absolute min-[1025px]:bottom-[10vh] min-[1025px]:left-0 min-[1025px]:right-0 min-[1025px]:pr-[var(--container-x)]"
            />
          </div>
        </div>

        {product.features?.length ? (
          <ProductFeatures
            features={product.features}
            productHandle={product.handle}
            colorCode={selectedVariant?.colorCode}
            colorKeyedFeatureImages={product.colorKeyedFeatureImages}
          />
        ) : null}

        {product.sizeSpec ? <ProductSizeSpecSection sizeSpec={product.sizeSpec} /> : null}

        {optionProducts.length ? <ProductOptions products={optionProducts} /> : null}
      </div>

      <div
        ref={fixedPanelRef}
        className={`fixed inset-x-0 bottom-0 z-30 ${mobileActionPanelClassName} min-[1025px]:hidden ${
          isDocked ? "pointer-events-none opacity-0" : ""
        }`}
        aria-hidden={isDocked}
      >
        <ActionPanelContent {...actionPanelProps} />
      </div>
    </>
  );
}
