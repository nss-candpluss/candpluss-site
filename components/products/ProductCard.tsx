"use client";

import { SiteImage } from "@/components/ui/SiteImage";
import Link from "next/link";
import { useState } from "react";

import { ProductColorChips } from "@/components/products/ProductColorChips";
import { ProductStatusLabel, hasProductStatusLabel } from "@/components/products/ProductStatusLabel";
import { getProductListingImage } from "@/lib/products/gallery";
import { getProductDetailHref, resolveProductVariantId } from "@/lib/products";
import type { Product } from "@/types/product";
import { uiText } from "@/lib/typography";

type ProductCardProps = {
  product: Product;
  sizes?: string;
  priority?: boolean;
};

export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
}: ProductCardProps) {
  const defaultVariantId = resolveProductVariantId(product);
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);

  const displayImage = getProductListingImage(product, selectedVariantId);
  const detailHref = getProductDetailHref(product.handle, selectedVariantId);
  const hasMultipleVariants = product.variants.length > 1;
  const showStatusLabel = hasProductStatusLabel(product.status, product.statusLabel);
  const priceAmount = product.priceLabel.replace(/^¥/, "");

  return (
    <article>
      <Link href={detailHref} className="block">
        <div className="relative aspect-[6/5] overflow-hidden bg-[var(--color-line)]">
          {displayImage ? (
            <SiteImage
              src={displayImage.src}
              alt={displayImage.alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover object-center"
            />
          ) : null}
        </div>
      </Link>

      <div className="mt-[calc(18px*var(--gap-scale-y))] px-[calc(8px*var(--gap-scale-x))]">
        {product.variants.length > 0 ? (
          <ProductColorChips
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelect={hasMultipleVariants ? setSelectedVariantId : undefined}
            className="pl-[calc(5px*var(--gap-scale-x))]"
          />
        ) : null}

        <Link
          href={detailHref}
          className={`flex flex-col ${
            product.variants.length > 0 ? "mt-[calc(24px*var(--gap-scale-y))]" : ""
          }`}
        >
          {showStatusLabel ? (
            <ProductStatusLabel
              status={product.status}
              label={product.statusLabel}
              color={product.statusColor}
              size={14}
            />
          ) : null}

          <h2
            className={`font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)} ${
              showStatusLabel ? "mt-[calc(14px*var(--gap-scale-y))]" : ""
            }`}
          >
            {product.title}
          </h2>

          <p
            className={`mt-[calc(14px*var(--gap-scale-y))] font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
          >
            {product.category}
          </p>

          <p className="mt-[calc(14px*var(--gap-scale-y))] inline-flex items-baseline gap-x-[calc(4px*var(--gap-scale-x))] gap-y-[calc(4px*var(--gap-scale-y))] text-[var(--foreground)]">
            <span
              className={`inline-flex items-baseline gap-x-[calc(2px*var(--gap-scale-x))] gap-y-[calc(2px*var(--gap-scale-y))] font-ui-en font-semibold ${uiText(14)}`}
            >
              <span>¥</span>
              <span>{priceAmount}</span>
            </span>
            <span className={`font-body-ja ${uiText(11)}`}>税込</span>
          </p>
        </Link>
      </div>
    </article>
  );
}
