"use client";

import { SiteImage } from "@/components/ui/SiteImage";

import { ProductGalleryControls } from "@/components/products/ProductGalleryControls";
import { ProductGalleryOpenClose } from "@/components/products/ProductGalleryOpenClose";
import { isOpenCloseGallery } from "@/lib/products/gallery";
import type { OpenCloseGroupId, ProductImage, VariantGallery } from "@/types/product";

type ProductGalleryProps = {
  gallery: VariantGallery | undefined;
  imageCount: number;
  currentGroupId: OpenCloseGroupId;
  displayedImage: ProductImage | null;
  isInitialPriority: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onGroupChange: (groupId: OpenCloseGroupId) => void;
  showControls?: boolean;
};

export function ProductGallery({
  gallery,
  imageCount,
  currentGroupId,
  displayedImage,
  isInitialPriority,
  onPrevious,
  onNext,
  onGroupChange,
  showControls = true,
}: ProductGalleryProps) {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden bg-[var(--color-line)] min-[1024px]:aspect-auto min-[1024px]:h-[100svh]"
    >
      {displayedImage ? (
        <SiteImage
          src={displayedImage.src}
          alt={displayedImage.alt}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          priority={isInitialPriority}
          className="absolute inset-0 object-cover object-center"
        />
      ) : null}

      <ProductGalleryControls
        onPrevious={onPrevious}
        onNext={onNext}
        hasImages={showControls && imageCount > 1}
      />

      {gallery && isOpenCloseGallery(gallery) ? (
        <ProductGalleryOpenClose activeGroupId={currentGroupId} onChange={onGroupChange} />
      ) : null}
    </div>
  );
}
