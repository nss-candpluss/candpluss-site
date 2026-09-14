"use client";

import { SiteImage } from "@/components/ui/SiteImage";
import Link from "next/link";
import { useState } from "react";

import { usePurchaseChannel } from "@/components/commerce/PurchaseChannelProvider";
import { ProductColorChips } from "@/components/products/ProductColorChips";
import { ProductComingSoonBadge } from "@/components/products/ProductComingSoonBadge";
import {
  ProductStatusLabel,
  hasProductStatusLabel,
  listingStatusRowMinHeightClassName,
  useStatusDisplayOverrideHandle,
} from "@/components/products/ProductStatusLabel";
import { productLaunchNoticeByHandle } from "@/data/product-launch-notices";
import { channelPath, isWebPurchaseEnabled } from "@/lib/commerce/purchase-channel";
import { getProductListingImage } from "@/lib/products/gallery";
import {
  getProductDetailHref,
  resolveProductPriceAmount,
  resolveProductVariantId,
  shouldDisplayProductPrice,
} from "@/lib/products/helpers";
import type { Product } from "@/types/product";
import { uiText } from "@/lib/typography";

type ProductCardProps = {
  product: Product;
  className?: string;
  sizes?: string;
  priority?: boolean;
  presentation?: "default" | "productsListing";
};

const listingText14ClassName = uiText(14);
const listingTitleClassName = uiText(16);
const listingStatusClassName =
  `flex items-center ${listingStatusRowMinHeightClassName} !text-[clamp(13px,calc(14px*var(--text-scale)),14px)] !leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]`;
const listingTaxClassName = uiText(11);
const listingImageToColorsClassName =
  "mt-[clamp(10px,calc(18px*var(--gap-scale-y)),18px)]";
const listingColorsToTextClassName =
  "mt-[clamp(14px,calc(24px*var(--gap-scale-y)),24px)]";
const listingTextGapClassName =
  "mt-[clamp(6px,calc(14px*var(--gap-scale-y)),14px)]";

export function ProductCard({
  product,
  className = "",
  sizes = "(min-width: 1025px) 33vw, 100vw",
  priority = false,
  presentation = "default",
}: ProductCardProps) {
  const defaultVariantId = resolveProductVariantId(product);
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);
  const channel = usePurchaseChannel();

  const displayImage = getProductListingImage(product, selectedVariantId);
  const detailHref = channelPath(
    channel,
    getProductDetailHref(product, selectedVariantId)
  );
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0] ??
    null;
  const showPrice = shouldDisplayProductPrice(product, selectedVariant);
  const priceAmount = resolveProductPriceAmount(product, selectedVariant).toLocaleString(
    "ja-JP"
  );
  const hasMultipleVariants = product.variants.length > 1;
  const statusOverrideHandle = useStatusDisplayOverrideHandle(product.handle);
  // 購入停止中は Shopify のステータスではなく COMING SOON と販売開始日を出す
  const showComingSoon = !isWebPurchaseEnabled(channel);
  const launchNotice = productLaunchNoticeByHandle[product.handle];
  const showStatusLabel =
    !showComingSoon &&
    hasProductStatusLabel(
      product.status,
      product.statusLabel,
      statusOverrideHandle
    );
  const hasStatusRow = showComingSoon || showStatusLabel;
  const usesProductsListingStyles = presentation === "productsListing";

  return (
    <article className={`group ${className}`.trim()}>
      <Link href={detailHref} className="block">
        <div className="relative aspect-[6/5] overflow-hidden bg-[var(--color-line)]">
          {displayImage ? (
            <SiteImage
              src={displayImage.src}
              alt={displayImage.alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : null}
        </div>
      </Link>

      <div
        className={`px-[calc(8px*var(--gap-scale-x))] ${
          usesProductsListingStyles && product.variants.length > 0
            ? listingImageToColorsClassName
            : "mt-[calc(18px*var(--gap-scale-y))]"
        }`}
      >
        {product.variants.length > 0 ? (
          <ProductColorChips
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelect={hasMultipleVariants ? setSelectedVariantId : undefined}
            className={
              usesProductsListingStyles
                ? ""
                : "pl-[calc(5px*var(--gap-scale-x))]"
            }
            selectionIndicator={
              usesProductsListingStyles ? "underline" : "outline"
            }
            underlineOffset={
              usesProductsListingStyles ? "compact" : "default"
            }
            dimUnselected={!usesProductsListingStyles}
          />
        ) : null}

        <Link
          href={detailHref}
          className={`flex flex-col ${
            product.variants.length > 0
              ? usesProductsListingStyles
                ? listingColorsToTextClassName
                : "mt-[calc(24px*var(--gap-scale-y))]"
              : ""
          }`}
        >
          {showComingSoon ? (
            <div className="flex flex-col items-start gap-[6px]">
              <ProductComingSoonBadge className="!text-[clamp(11px,calc(12px*var(--text-scale)),12px)]" />
              {launchNotice ? (
                <p
                  className={`font-body-ja font-semibold text-[#c40000] ${
                    usesProductsListingStyles ? listingStatusClassName : uiText(14)
                  }`}
                >
                  {launchNotice}
                </p>
              ) : null}
            </div>
          ) : showStatusLabel ? (
            <ProductStatusLabel
              handle={product.handle}
              status={product.status}
              label={product.statusLabel}
              color={product.statusColor}
              size={14}
              className={
                usesProductsListingStyles ? listingStatusClassName : ""
              }
            />
          ) : null}

          <h2
            className={`font-body-ja font-semibold text-[var(--foreground)] ${
              usesProductsListingStyles
                ? listingTitleClassName
                : uiText(16)
            } ${
              hasStatusRow
                ? usesProductsListingStyles
                  ? listingTextGapClassName
                  : "mt-[calc(14px*var(--gap-scale-y))]"
                : ""
            }`}
          >
            {product.title}
          </h2>

          <p
            className={`font-body-ja text-[var(--color-muted)] ${
              usesProductsListingStyles
                ? listingText14ClassName
                : uiText(14)
            } ${
              usesProductsListingStyles
                ? listingTextGapClassName
                : "mt-[calc(14px*var(--gap-scale-y))]"
            }`}
          >
            {product.category}
          </p>

          {showPrice ? (
          <p
            className={`inline-flex items-baseline gap-x-[calc(4px*var(--gap-scale-x))] gap-y-[calc(4px*var(--gap-scale-y))] text-[var(--foreground)] ${
              usesProductsListingStyles
                ? listingTextGapClassName
                : "mt-[calc(14px*var(--gap-scale-y))]"
            }`}
          >
            <span
              className={`inline-flex items-baseline gap-x-[calc(2px*var(--gap-scale-x))] gap-y-[calc(2px*var(--gap-scale-y))] font-ui-en font-semibold ${
                usesProductsListingStyles
                  ? listingText14ClassName
                  : uiText(14)
              }`}
            >
              <span>¥</span>
              <span>{priceAmount}</span>
            </span>
            <span
              className={`font-body-ja ${
                usesProductsListingStyles
                  ? listingTaxClassName
                  : uiText(11)
              }`}
            >
              税込
            </span>
          </p>
          ) : null}
        </Link>
      </div>
    </article>
  );
}
