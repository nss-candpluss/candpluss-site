"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useCart } from "@/components/commerce/CartProvider";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import { ProductDetailGalleryMedia } from "@/components/products/product-detail/ProductDetailGalleryMedia";
import { ProductDetailGalleryModal } from "@/components/products/product-detail/ProductDetailGalleryModal";
import { PRODUCT_DETAIL_ZOOM_IN_CURSOR } from "@/components/products/product-detail/gallery-cursors";
import {
  galleryItemKey,
  type ProductDetailGalleryItem,
} from "@/components/products/product-detail/gallery-items";
import { preloadProductDetailImage } from "@/components/products/product-detail/image-preload";
import { shouldDisplayGalleryNavigation } from "@/lib/products/gallery";
import { canPurchaseProduct } from "@/lib/products/purchase";
import {
  getProductVariantOptionName,
  shouldDisplayProductPrice,
  shouldDisplayProductVariantLabel,
  shouldDisplayProductVariantOptions,
} from "@/lib/products/helpers";
import {
  ProductDetailThumbnailStrip,
  type ProductDetailSelectMeta,
  type ProductDetailThumbnailStripHandle,
} from "@/components/products/product-detail/ProductDetailThumbnailStrip";
import {
  PRODUCT_DETAIL_SLIDE_MS,
  productDetailSlideDurationMs,
} from "@/components/products/product-detail/slide-timing";
import { ProductDetailBreadcrumbs } from "@/components/products/product-detail/ProductDetailBreadcrumbs";
import { ProductColorChips } from "@/components/products/ProductColorChips";
import { ProductDetailDescription } from "@/components/products/ProductDetailDescription";
import { ProductGalleryControls } from "@/components/products/ProductGalleryControls";
import { ProductStatusLabel } from "@/components/products/ProductStatusLabel";
import { arrowMaskStyle } from "@/lib/maskStyle";
import type { Product, ProductVariant } from "@/types/product";

type ProductDetailDesktopHeroProps = {
  items: ProductDetailGalleryItem[];
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedColorCode: string;
  onVariantChange: (variantId: string) => void;
  onVariantIntent: (variantId: string) => void;
};

/** 1個前 → 左から / 1個後 → 右から */
type MainSlideEnterFrom = "left" | "right";

type MainSlideLayer = {
  key: string;
  item: ProductDetailGalleryItem;
  role: "incoming" | "outgoing" | "settled";
  enterFrom: MainSlideEnterFrom;
};

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function resolveNavigation(
  fromIndex: number,
  toIndex: number,
  length: number
): { enterFrom: MainSlideEnterFrom; steps: number } {
  const forward = wrapIndex(toIndex - fromIndex, length);
  const backward = wrapIndex(fromIndex - toIndex, length);

  // 1個前（戻る）は左から、1個後（進む）は右から
  if (forward <= backward) {
    return { enterFrom: "right", steps: forward };
  }

  return { enterFrom: "left", steps: -backward };
}

function mainSlideClassName(layer: MainSlideLayer) {
  if (layer.role === "settled") {
    return "";
  }

  if (layer.role === "incoming") {
    return layer.enterFrom === "left"
      ? "product-detail-main-in-left"
      : "product-detail-main-in-right";
  }

  return layer.enterFrom === "left"
    ? "product-detail-main-out-right"
    : "product-detail-main-out-left";
}

export function ProductDetailDesktopHero({
  items,
  product,
  selectedVariant,
  selectedColorCode,
  onVariantChange,
  onVariantIntent,
}: ProductDetailDesktopHeroProps) {
  const { addLine, error: cartError, isLoading: isCartLoading } = useCart();
  const { customer } = useCustomer();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideLayers, setSlideLayers] = useState<MainSlideLayer[]>(() => {
    const initial = items[0];

    return initial
      ? [
          {
            key: `settled-${galleryItemKey(initial)}`,
            item: initial,
            role: "settled",
            enterFrom: "right",
          },
        ]
      : [];
  });
  const [mainSlideMs, setMainSlideMs] = useState(PRODUCT_DETAIL_SLIDE_MS);
  const [mainDragOffsetX, setMainDragOffsetX] = useState(0);
  const [isMainDragging, setIsMainDragging] = useState(false);
  const [mainDragSnapBack, setMainDragSnapBack] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const slideSeqRef = useRef(0);
  const selectionRequestRef = useRef(0);
  const thumbnailStripRef = useRef<ProductDetailThumbnailStripHandle>(null);
  const mainViewportRef = useRef<HTMLDivElement>(null);
  const suppressModalClickRef = useRef(false);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    [0, -1, 1, -2, 2].forEach((offset) => {
      const item = items[wrapIndex(selectedIndex + offset, items.length)];
      if (item?.kind === "image") {
        void preloadProductDetailImage(item.src);
      }
    });
  }, [items, selectedIndex]);
  const mainDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    axis: "x" | "y" | null;
    moved: boolean;
  } | null>(null);

  const selectedItem = items[selectedIndex] ?? items[0];
  const prevDragItem = items[wrapIndex(selectedIndex - 1, items.length)];
  const nextDragItem = items[wrapIndex(selectedIndex + 1, items.length)];
  const priceAmount =
    selectedVariant?.price?.amount.toLocaleString("ja-JP") ??
    product.priceLabel.replace(/^¥/, "");
  const showPrice = shouldDisplayProductPrice(product, selectedVariant);
  const displayTitle = product.title.replace("（デザインテスト）", "");
  const variantOptionName = getProductVariantOptionName(product);
  const showVariantOptions = shouldDisplayProductVariantOptions(product);
  const showVariantLabel = shouldDisplayProductVariantLabel(
    product,
    selectedVariant
  );
  const canSelectVariant = product.variants.length > 1;
  const showGalleryNavigation = shouldDisplayGalleryNavigation(items.length);
  const isMainSliding = slideLayers.some((layer) => layer.role !== "settled");
  const canAddToCart = Boolean(selectedVariant?.shopifyVariantId) &&
    selectedVariant?.availableForSale !== false &&
    canPurchaseProduct(product, Boolean(customer));
  const showMainDragPeek =
    !isMainSliding &&
    (isMainDragging || mainDragSnapBack || mainDragOffsetX !== 0);
  const mainDragTransition = mainDragSnapBack
    ? `transform ${PRODUCT_DETAIL_SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "none";

  const selectImage = useCallback(
    (index: number, meta?: ProductDetailSelectMeta) => {
      if (!items.length) {
        return;
      }

      const nextIndex = wrapIndex(index, items.length);

      if (nextIndex === selectedIndex) {
        return;
      }

      const nextItem = items[nextIndex];
      const currentItem = items[selectedIndex];

      if (!nextItem || !currentItem) {
        setSelectedIndex(nextIndex);
        return;
      }

      const navigation = resolveNavigation(selectedIndex, nextIndex, items.length);
      const enterFrom = navigation.enterFrom;
      const steps = meta?.steps ?? navigation.steps;
      const durationMs = meta?.durationMs ?? productDetailSlideDurationMs(steps);
      const nextMediaSource =
        nextItem.kind === "image" ? nextItem.src : nextItem.poster;
      const requestId = ++selectionRequestRef.current;

      void preloadProductDetailImage(nextMediaSource).then(() => {
        if (requestId !== selectionRequestRef.current) {
          return;
        }

        slideSeqRef.current += 1;
        const seq = slideSeqRef.current;

        setMainSlideMs(durationMs);
        setSelectedIndex(nextIndex);
        setSlideLayers([
          {
            key: `out-${seq}-${galleryItemKey(currentItem)}`,
            item: currentItem,
            role: "outgoing",
            enterFrom,
          },
          {
            key: `in-${seq}-${galleryItemKey(nextItem)}`,
            item: nextItem,
            role: "incoming",
            enterFrom,
          },
        ]);
      });
    },
    [items, selectedIndex]
  );

  const handleIncomingAnimationEnd = useCallback(
    (event: ReactAnimationEvent<HTMLDivElement>, layerKey: string) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      setSlideLayers((layers) => {
        const incoming = layers.find(
          (layer) => layer.key === layerKey && layer.role === "incoming"
        );

        if (!incoming) {
          return layers;
        }

        // key は維持（動画のリマウントによる一瞬の背景チラつきを防ぐ）
        return [
          {
            ...incoming,
            role: "settled",
          },
        ];
      });
    },
    []
  );

  const handleMainPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      isMainSliding ||
      isMainDragging ||
      event.button !== 0 ||
      !items.length
    ) {
      return;
    }

    if ((event.target as Element | null)?.closest?.("button, a")) {
      return;
    }

    suppressModalClickRef.current = false;

    // 縦スクロールを妨げないよう、ここでは capture しない（横方向確定後に行う）
    mainDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
      moved: false,
    };
    setMainDragSnapBack(false);
  };

  const handleMainPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mainDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.axis === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        mainDragRef.current = null;
        return;
      }

      drag.axis = "x";
      drag.moved = true;
      suppressModalClickRef.current = true;
      setIsMainDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (drag.axis !== "x") {
      return;
    }

    setMainDragOffsetX(deltaX);
  };

  const endMainDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mainDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const wasHorizontalDrag = drag.axis === "x" && drag.moved;
    mainDragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!wasHorizontalDrag) {
      setIsMainDragging(false);
      setMainDragOffsetX(0);
      return;
    }

    const width = mainViewportRef.current?.clientWidth ?? 0;
    const threshold = Math.max(48, width * 0.12);
    const shouldStep = Math.abs(deltaX) >= threshold;

    setIsMainDragging(false);

    if (!shouldStep) {
      // 離した位置から元位置へ戻す
      setMainDragSnapBack(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMainDragOffsetX(0);
        });
      });
      return;
    }

    setMainDragOffsetX(0);
    setMainDragSnapBack(false);

    // 左へスワイプ → 次へ / 右へスワイプ → 前へ（サムネと同時連動）
    const nextIndex =
      deltaX < 0
        ? wrapIndex(selectedIndex + 1, items.length)
        : wrapIndex(selectedIndex - 1, items.length);

    thumbnailStripRef.current?.goToIndex(nextIndex);
  };

  const handleMainClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as Element | null)?.closest?.("button, a")) {
      return;
    }

    if (suppressModalClickRef.current) {
      suppressModalClickRef.current = false;
      return;
    }

    setIsGalleryModalOpen(true);
  };

  return (
    <>
      <section className="hidden min-[1025px]:grid min-[1025px]:min-h-[100svh] min-[1025px]:grid-cols-[auto_minmax(0,3fr)_minmax(360px,2fr)] min-[1025px]:pt-[var(--header-height)]">
      <style>{`
        @keyframes product-detail-main-in-left {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes product-detail-main-in-right {
          from { transform: translate3d(100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes product-detail-main-out-left {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }
        @keyframes product-detail-main-out-right {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(100%, 0, 0); }
        }
        .product-detail-main-in-left,
        .product-detail-main-in-right,
        .product-detail-main-out-left,
        .product-detail-main-out-right {
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
        }
        .product-detail-main-in-left {
          animation-name: product-detail-main-in-left;
        }
        .product-detail-main-in-right {
          animation-name: product-detail-main-in-right;
        }
        .product-detail-main-out-left {
          animation-name: product-detail-main-out-left;
        }
        .product-detail-main-out-right {
          animation-name: product-detail-main-out-right;
        }
      `}</style>

      <div className="relative h-[calc(100svh-var(--header-height))] self-start [&>aside]:h-full">
        <ProductDetailThumbnailStrip
          ref={thumbnailStripRef}
          items={items}
          selectedIndex={selectedIndex}
          onSelect={selectImage}
        />
      </div>

      <div
        ref={mainViewportRef}
        className={`relative h-[calc(100svh-var(--header-height))] self-start touch-pan-y overflow-hidden bg-[#eef1f3] ${
          isMainDragging ? "touch-none" : ""
        }`}
        style={{
          cursor: isMainDragging ? "grabbing" : PRODUCT_DETAIL_ZOOM_IN_CURSOR,
        }}
        onPointerDown={handleMainPointerDown}
        onPointerMove={handleMainPointerMove}
        onPointerUp={endMainDrag}
        onPointerCancel={endMainDrag}
        onClick={handleMainClick}
      >
        {showMainDragPeek && prevDragItem ? (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              transform: `translate3d(calc(-100% + ${mainDragOffsetX}px), 0, 0)`,
              transition: mainDragTransition,
            }}
          >
            <ProductDetailGalleryMedia
              item={prevDragItem}
              mode="preview"
              sizes="(min-width: 1025px) 56vw"
              alt=""
            />
          </div>
        ) : null}

        {showMainDragPeek && nextDragItem ? (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              transform: `translate3d(calc(100% + ${mainDragOffsetX}px), 0, 0)`,
              transition: mainDragTransition,
            }}
          >
            <ProductDetailGalleryMedia
              item={nextDragItem}
              mode="preview"
              sizes="(min-width: 1025px) 56vw"
              alt=""
            />
          </div>
        ) : null}

        {(slideLayers.length
          ? slideLayers
          : selectedItem
            ? [
                {
                  key: `settled-${galleryItemKey(selectedItem)}`,
                  item: selectedItem,
                  role: "settled" as const,
                  enterFrom: "right" as const,
                },
              ]
            : []
        ).map((layer) => {
          const settledDragStyle =
            layer.role === "settled" && showMainDragPeek
              ? {
                  transform: `translate3d(${mainDragOffsetX}px, 0, 0)`,
                  transition: mainDragTransition,
                }
              : undefined;

          return (
            <div
              key={layer.key}
              className={`absolute inset-0 ${mainSlideClassName(layer)}`}
              style={
                layer.role === "settled"
                  ? settledDragStyle
                  : { animationDuration: `${mainSlideMs}ms` }
              }
              onAnimationEnd={
                layer.role === "incoming"
                  ? (event) => handleIncomingAnimationEnd(event, layer.key)
                  : undefined
              }
              onTransitionEnd={
                layer.role === "settled" && mainDragSnapBack
                  ? (event) => {
                      if (event.propertyName !== "transform") {
                        return;
                      }

                      setMainDragSnapBack(false);
                    }
                  : undefined
              }
            >
              <ProductDetailGalleryMedia
                item={layer.item}
                mode={layer.role === "outgoing" ? "preview" : "playback"}
                sizes="(min-width: 1025px) 56vw"
                priority={layer.role !== "outgoing"}
                alt={layer.item.alt}
              />
            </div>
          );
        })}

        <ProductGalleryControls
          hasImages={showGalleryNavigation}
          onPrevious={() =>
            thumbnailStripRef.current?.goToIndex(
              wrapIndex(selectedIndex - 1, items.length)
            )
          }
          onNext={() =>
            thumbnailStripRef.current?.goToIndex(
              wrapIndex(selectedIndex + 1, items.length)
            )
          }
        />

        <p
          className="pointer-events-none absolute top-[clamp(12px,1.5vw,28px)] left-[clamp(12px,1.5vw,28px)] z-10 bg-black/70 px-[8px] py-[4px] font-ui-en text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-white"
        >
          {selectedIndex + 1} / {items.length}
        </p>

        {showGalleryNavigation ? (
        <ol
          aria-label="商品画像"
          className="absolute bottom-[clamp(16px,2.2vh,26px)] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[6px]"
        >
          {items.map((item, index) => (
            <li key={galleryItemKey(item)} className="flex items-center">
              <button
                type="button"
                aria-label={
                  item.kind === "video"
                    ? `${index + 1}枚目の動画を表示`
                    : `${index + 1}枚目の画像を表示`
                }
                aria-current={index === selectedIndex ? "true" : undefined}
                onClick={() => thumbnailStripRef.current?.goToIndex(index)}
                className={`block rounded-full opacity-70 transition-[width,height,background-color] ${
                  index === selectedIndex
                    ? "size-[11px] bg-white"
                    : "size-[8px] bg-[#ccc]"
                }`}
              />
            </li>
          ))}
        </ol>
        ) : null}
      </div>

      <div className="px-[clamp(42px,4vw,76px)] pt-[clamp(12px,2vh,26px)] pb-[clamp(28px,4vh,52px)]">
        <ProductDetailBreadcrumbs
          category={product.category}
          categorySlug={product.categorySlug}
          className="font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-[var(--color-muted)]"
        />

        <h1
          className="mt-[clamp(16px,2.5vh,30px)] font-ui-en text-[clamp(26px,calc(30px*var(--text-scale)),30px)] leading-[clamp(26px,calc(30px*var(--text-scale)),30px)] font-semibold text-[var(--foreground)]"
        >
          {displayTitle}
        </h1>

        <ProductStatusLabel
          status={product.status}
          label={product.statusLabel}
          color={product.statusColor}
          size={14}
          className="mt-[clamp(12px,1.8vh,20px)] !text-[clamp(13px,calc(14px*var(--text-scale)),14px)] !leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]"
        />

        {showVariantOptions ? (
        <div className="mt-[clamp(34px,5vh,58px)]">
          <ProductColorChips
            variants={product.variants}
            selectedVariantId={selectedVariant?.id}
            onSelect={canSelectVariant ? onVariantChange : undefined}
            onIntent={canSelectVariant ? onVariantIntent : undefined}
            optionName={variantOptionName}
            chipSizePx={60}
            selectionIndicator="underline"
            gapClassName="gap-x-[clamp(8px,calc(10px*var(--gap-scale-x)),10px)] gap-y-[clamp(8px,calc(10px*var(--gap-scale-y)),10px)]"
            dimUnselected={false}
          />

          {showVariantLabel && selectedVariant ? (
            <p
              className="mt-[clamp(20px,2.8vh,32px)] font-ui-en text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-[var(--foreground)]"
            >
              <span className="font-semibold">{variantOptionName}</span>
              {` : ${selectedVariant.colorName}`}
            </p>
          ) : null}
        </div>
        ) : null}

        <button
          type="button"
          data-variant-id={selectedVariant?.id ?? ""}
          data-color-code={selectedColorCode}
          data-shopify-variant-id={selectedVariant?.shopifyVariantId ?? ""}
          disabled={!canAddToCart || isCartLoading}
          onClick={() => {
            if (selectedVariant?.shopifyVariantId) {
              void addLine(selectedVariant.shopifyVariantId);
            }
          }}
          className={`mt-[clamp(32px,5vh,58px)] flex w-full items-center justify-between px-[clamp(22px,2.2vw,36px)] py-[clamp(16px,2.2vh,24px)] text-white disabled:cursor-not-allowed ${
            canAddToCart ? "bg-[var(--foreground)]" : "bg-[#C6C6C6]"
          }`}
        >
          <span
            className="inline-flex items-center gap-[calc(8/18*1em)] font-ui-en text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[clamp(15px,calc(16px*var(--text-scale)),16px)] font-medium"
          >
            <span
              aria-hidden="true"
              className="size-[calc(24/18*1em)] shrink-0 bg-current"
              style={arrowMaskStyle}
            />
            ADD TO CART
          </span>
          {showPrice ? (
          <span
            className="inline-flex items-baseline gap-[4px] font-ui-en text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]"
          >
            <span>¥{priceAmount}</span>
            <span className="font-body-ja text-[11px] leading-[11px]">税込</span>
          </span>
          ) : null}
        </button>
        {cartError ? (
          <p role="alert" className="mt-3 font-body-ja text-xs text-[#9b1b30]">
            {cartError}
          </p>
        ) : null}

        <ProductDetailDescription
          product={product}
          className="mt-[clamp(38px,6vh,70px)]"
          bodyClassName="whitespace-pre-line font-body-ja text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[clamp(24.5px,calc(26.25px*var(--text-scale)),26.25px)] text-[var(--foreground)]"
        />
      </div>
      </section>

      <ProductDetailGalleryModal
        isOpen={isGalleryModalOpen}
        items={items}
        selectedIndex={selectedIndex}
        onSelect={(index) => thumbnailStripRef.current?.goToIndex(index)}
        onClose={() => setIsGalleryModalOpen(false)}
      />
    </>
  );
}
