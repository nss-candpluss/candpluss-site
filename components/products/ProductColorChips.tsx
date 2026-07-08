"use client";

import { SiteImage } from "@/components/ui/SiteImage";

import { getVariantChipImage } from "@/lib/products/gallery";
import type { ProductVariant } from "@/types/product";

type ProductColorChipsProps = {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onSelect?: (variantId: string) => void;
  className?: string;
};

const CHIP_SIZE_MAX_PX = 54;

/** Display: clamp(40px, CHIP_SIZE_MAX_PX * --gap-scale-x, CHIP_SIZE_MAX_PX) */
const chipClassName =
  "relative block size-[clamp(40px,calc(54px*var(--gap-scale-x)),54px)] shrink-0 overflow-hidden";

const selectedChipClassName =
  "outline outline-1 outline-[var(--foreground)] outline-offset-[calc(5px*var(--gap-scale-x))]";

export function ProductColorChips({
  variants,
  selectedVariantId,
  onSelect,
  className = "",
}: ProductColorChipsProps) {
  const isInteractive = Boolean(onSelect);

  return (
    <ul
      className={`flex flex-wrap gap-x-[calc(18px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))] ${className}`.trim()}
      aria-label="Available colors"
    >
      {variants.map((variant) => {
        const isSelected = variant.id === selectedVariantId;
        const chipImage = getVariantChipImage(variant);

        const content = chipImage ? (
          <SiteImage
            src={chipImage.src}
            alt={chipImage.alt}
            width={CHIP_SIZE_MAX_PX}
            height={CHIP_SIZE_MAX_PX}
            className="size-full object-cover object-center"
          />
        ) : (
          <span
            aria-hidden="true"
            className="block size-full"
            style={{ backgroundColor: variant.swatch }}
          />
        );

        return (
          <li key={variant.id}>
            {isInteractive ? (
              <button
                type="button"
                aria-label={variant.colorName}
                aria-pressed={isSelected}
                onClick={() => onSelect?.(variant.id)}
                className={`${chipClassName} cursor-pointer transition-opacity duration-200 ${
                  isSelected
                    ? `opacity-100 ${selectedChipClassName}`
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {content}
              </button>
            ) : (
              <span
                aria-hidden="true"
                className={`${chipClassName} ${isSelected ? selectedChipClassName : ""}`}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
