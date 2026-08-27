"use client";

import { ProductColorChips } from "@/components/products/ProductColorChips";
import { ProductStatusLabel } from "@/components/products/ProductStatusLabel";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import { isAddToCartButtonVisible } from "@/lib/products/add-to-cart-visibility";
import {
  getProductVariantOptionName,
  resolveProductPriceAmount,
  shouldDisplayProductPrice,
  shouldDisplayProductVariantLabel,
  shouldDisplayProductVariantOptions,
} from "@/lib/products/helpers";
import { canPurchaseProduct } from "@/lib/products/purchase";
import type { Product, ProductVariant } from "@/types/product";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

type ProductDetailActionPanelProps = {
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedColorCode: string;
  onVariantChange: (variantId: string) => void;
};

const actionPanelTopSpacingClassName =
  "mt-[20px] min-[1024px]:mt-[calc(52px*var(--gap-scale-y))]";

function ProductPriceLabel({
  priceAmount,
  tone = "onLight",
}: {
  priceAmount: string;
  tone?: "onLight" | "onDark";
}) {
  const toneClassName = tone === "onDark" ? "text-inherit" : "text-[var(--foreground)]";

  return (
    <span
      className={`inline-flex items-baseline gap-x-[calc(4px*var(--gap-scale-x))] gap-y-[calc(4px*var(--gap-scale-y))] font-ui-en ${toneClassName}`}
    >
      <span
        className={`inline-flex items-baseline gap-x-[calc(2px*var(--gap-scale-x))] gap-y-[calc(2px*var(--gap-scale-y))] font-semibold ${uiText(14)}`}
      >
        <span>¥</span>
        <span>{priceAmount}</span>
      </span>
      <span className={`font-body-ja ${uiText(13)}`}>税込</span>
    </span>
  );
}

export function ProductDetailActionPanel({
  product,
  selectedVariant,
  selectedColorCode,
  onVariantChange,
}: ProductDetailActionPanelProps) {
  const { customer } = useCustomer();
  const showPrice = shouldDisplayProductPrice(product, selectedVariant);
  const priceAmount = resolveProductPriceAmount(product, selectedVariant).toLocaleString(
    "ja-JP"
  );
  const showVariantOptions = shouldDisplayProductVariantOptions(product);
  const showVariantLabel = shouldDisplayProductVariantLabel(
    product,
    selectedVariant
  );
  const variantOptionName = getProductVariantOptionName(product);
  const displayCode = selectedVariant?.code ?? product.code;
  const showAddToCartButton = isAddToCartButtonVisible();
  const canAddToCart =
    Boolean(selectedVariant?.shopifyVariantId) &&
    selectedVariant?.availableForSale !== false &&
    canPurchaseProduct(product, Boolean(customer));

  return (
    <div className="flex flex-col">
      <ProductStatusLabel
        status={product.status}
        label={product.statusLabel}
        color={product.statusColor}
        size={15}
      />

      <div className="mt-[12px] flex flex-wrap items-center justify-between gap-x-[calc(16px*var(--gap-scale-x))] gap-y-[calc(16px*var(--gap-scale-y))] min-[1024px]:mt-[calc(20px*var(--gap-scale-y))]">
        <h1 className="font-body-ja text-[calc(22px*var(--text-scale))] leading-[calc(36px*var(--text-scale))] font-semibold text-[var(--foreground)] min-[1024px]:text-[calc(30px*var(--text-scale))]">
          {product.title}
        </h1>
        {displayCode ? (
          <p className={`font-ui-en text-[var(--color-muted)] ${uiText(14)}`}>
            {displayCode}
          </p>
        ) : null}
      </div>

      <p
        className="mt-[12px] font-body-ja text-[calc(14px*var(--text-scale))] leading-[calc(14px*var(--text-scale))] text-[var(--color-muted)] min-[1024px]:mt-[calc(20px*var(--gap-scale-y))] min-[1024px]:text-[calc(15px*var(--text-scale))] min-[1024px]:leading-[calc(15px*var(--text-scale))]"
      >
        {product.category}
      </p>

      {showVariantOptions ? (
        <div className="mt-[16px] flex flex-wrap items-center gap-x-[calc(32px*var(--gap-scale-x))] gap-y-[12px] min-[1024px]:mt-[calc(24px*var(--gap-scale-y))] min-[1024px]:flex-col min-[1024px]:items-stretch min-[1024px]:gap-x-0 min-[1024px]:gap-y-[calc(22px*var(--gap-scale-y))]">
          <ProductColorChips
            variants={product.variants}
            selectedVariantId={selectedVariant?.id}
            onSelect={onVariantChange}
            optionName={variantOptionName}
            className="ml-[calc(6px*var(--gap-scale-x))] min-[1024px]:pt-[calc(6px*var(--gap-scale-y))] min-[1024px]:pb-[calc(6px*var(--gap-scale-y))]"
          />
          {showVariantLabel && selectedVariant ? (
            <p className={`shrink-0 font-ui-en text-[var(--foreground)] ${uiText(14)}`}>
              <span className="font-semibold">{variantOptionName}</span>
              {` : ${selectedVariant.colorName}`}
            </p>
          ) : null}
        </div>
      ) : null}

      {showAddToCartButton ? (
        <button
          type="button"
          data-variant-id={selectedVariant?.id ?? ""}
          data-color-code={selectedColorCode}
          data-shopify-variant-id={selectedVariant?.shopifyVariantId ?? ""}
          disabled={!canAddToCart}
          className={`${actionPanelTopSpacingClassName} flex w-full items-center justify-between px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] text-white disabled:cursor-not-allowed min-[1024px]:py-[calc(18px*var(--gap-scale-y))] ${
            canAddToCart
              ? "bg-[var(--foreground)]"
              : "bg-[#C6C6C6]"
          }`}
        >
          <span
            className={`inline-flex items-center gap-[calc(8/18*1em)] font-ui-en font-medium ${uiText(16)}`}
          >
            <span
              aria-hidden="true"
              className="size-[calc(24/18*1em)] shrink-0 bg-current"
              style={arrowMaskStyle}
            />
            ADD TO CART
          </span>
          {showPrice ? <ProductPriceLabel priceAmount={priceAmount} tone="onDark" /> : null}
        </button>
      ) : showPrice ? (
        <div className={actionPanelTopSpacingClassName}>
          <ProductPriceLabel priceAmount={priceAmount} />
        </div>
      ) : null}
    </div>
  );
}
