"use client";

import { SiteImage } from "@/components/ui/SiteImage";

import { getVariantChipImage } from "@/lib/products/gallery";
import type { ProductVariant } from "@/types/product";

type ProductColorChipsProps = {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onSelect?: (variantId: string) => void;
  onIntent?: (variantId: string) => void;
  className?: string;
  chipSizePx?: number;
  selectionIndicator?: "outline" | "underline";
  underlineOffset?: "default" | "compact";
  gapClassName?: string;
  dimUnselected?: boolean;
  resolveImageSrc?: (src: string) => string;
};

const CHIP_SIZE_MAX_PX = 54;

/** Display: clamp(40px, CHIP_SIZE_MAX_PX * --gap-scale-x, CHIP_SIZE_MAX_PX) */
const defaultChipSizeClassName =
  "size-[clamp(40px,calc(54px*var(--gap-scale-x)),54px)]";

const selectedOutlineClassName =
  "outline outline-1 outline-[var(--foreground)] outline-offset-[calc(5px*var(--gap-scale-x))]";

const selectedUnderlineClassName =
  "after:absolute after:right-0 after:left-0 after:h-px after:bg-black";
const defaultUnderlineOffsetClassName = "after:-bottom-[5px]";
const compactUnderlineOffsetClassName = "after:-bottom-[3px]";

const defaultGapClassName =
  "gap-x-[calc(18px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))]";

export function ProductColorChips({
  variants,
  selectedVariantId,
  onSelect,
  onIntent,
  className = "",
  chipSizePx,
  selectionIndicator = "outline",
  underlineOffset = "default",
  gapClassName = defaultGapClassName,
  dimUnselected = true,
  resolveImageSrc,
}: ProductColorChipsProps) {
  const isInteractive = Boolean(onSelect);
  const chipClassName = `relative block shrink-0 ${
    selectionIndicator === "underline" ? "overflow-visible" : "overflow-hidden"
  } ${
    chipSizePx ? "" : defaultChipSizeClassName
  }`;
  const selectedChipClassName =
    selectionIndicator === "underline"
      ? `${selectedUnderlineClassName} ${
          underlineOffset === "compact"
            ? compactUnderlineOffsetClassName
            : defaultUnderlineOffsetClassName
        }`
      : selectedOutlineClassName;
  const chipStyle = chipSizePx
    ? { width: chipSizePx, height: chipSizePx }
    : undefined;

  return (
    <ul
      className={`flex flex-wrap ${gapClassName} ${className}`.trim()}
      aria-label="Available colors"
    >
      {variants.map((variant) => {
        const isSelected = variant.id === selectedVariantId;
        const chipImage = getVariantChipImage(variant);

        const content = chipImage ? (
          <SiteImage
            src={resolveImageSrc?.(chipImage.src) ?? chipImage.src}
            alt={chipImage.alt}
            width={chipSizePx ?? CHIP_SIZE_MAX_PX}
            height={chipSizePx ?? CHIP_SIZE_MAX_PX}
            sizes={`${(chipSizePx ?? CHIP_SIZE_MAX_PX) * 2}px`}
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
                onFocus={() => onIntent?.(variant.id)}
                onPointerDown={() => onIntent?.(variant.id)}
                onPointerEnter={() => onIntent?.(variant.id)}
                className={`${chipClassName} cursor-pointer transition-opacity duration-200 ${
                  isSelected
                    ? `opacity-100 ${selectedChipClassName}`
                    : dimUnselected
                      ? "opacity-60 hover:opacity-100"
                      : "opacity-100"
                }`}
                style={chipStyle}
              >
                {content}
              </button>
            ) : (
              <span
                aria-hidden="true"
                className={`${chipClassName} ${isSelected ? selectedChipClassName : ""}`}
                style={chipStyle}
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
