"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type AnimationEvent as ReactAnimationEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
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
  PRODUCT_DETAIL_MOBILE_THUMB_STRIP_HEIGHT,
  ProductDetailThumbnailStripHorizontal,
} from "@/components/products/product-detail/ProductDetailThumbnailStripHorizontal";
import {
  PRODUCT_DETAIL_SLIDE_MS,
  productDetailSlideDurationMs,
} from "@/components/products/product-detail/slide-timing";
import { ProductDetailBreadcrumbs } from "@/components/products/product-detail/ProductDetailBreadcrumbs";
import { ProductColorChips } from "@/components/products/ProductColorChips";
import { ProductDetailDescription } from "@/components/products/ProductDetailDescription";
import { ProductStatusLabel } from "@/components/products/ProductStatusLabel";
import { arrowMaskStyle } from "@/lib/maskStyle";
import type { Product, ProductVariant } from "@/types/product";

type ProductDetailMobileHeroProps = {
  items: ProductDetailGalleryItem[];
  product: Product;
  selectedVariant: ProductVariant | null;
  selectedColorCode: string;
  onVariantChange: (variantId: string) => void;
  onVariantIntent: (variantId: string) => void;
};

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
      ? "product-detail-mobile-main-in-left"
      : "product-detail-mobile-main-in-right";
  }

  return layer.enterFrom === "left"
    ? "product-detail-mobile-main-out-right"
    : "product-detail-mobile-main-out-left";
}

export function ProductDetailMobileHero({
  items,
  product,
  selectedVariant,
  selectedColorCode,
  onVariantChange,
  onVariantIntent,
}: ProductDetailMobileHeroProps) {
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
  const mainViewportRef = useRef<HTMLDivElement>(null);
  const pendingCommitIndexRef = useRef<number | null>(null);
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
  // 隣画像は常時待機（ドラッグ開始フレームで背景が覗かないようにする）
  const showMainDragPeek = !isMainSliding;
  const mainDragTransition =
    mainDragSnapBack && !isMainDragging
      ? `transform ${PRODUCT_DETAIL_SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";

  const settleToIndex = useCallback(
    (index: number) => {
      const nextIndex = wrapIndex(index, items.length);
      const nextItem = items[nextIndex];

      if (!nextItem) {
        return;
      }

      slideSeqRef.current += 1;
      setMainDragSnapBack(false);
      setIsMainDragging(false);
      setMainDragOffsetX(0);
      setSelectedIndex(nextIndex);
      setSlideLayers([
        {
          key: `settled-${slideSeqRef.current}-${galleryItemKey(nextItem)}`,
          item: nextItem,
          role: "settled",
          enterFrom: "right",
        },
      ]);
    },
    [items]
  );

  const selectImage = useCallback(
    (index: number) => {
      if (!items.length || pendingCommitIndexRef.current != null) {
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
      const durationMs = productDetailSlideDurationMs(navigation.steps);
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
        setMainDragOffsetX(0);
        setMainDragSnapBack(false);
        setSelectedIndex(nextIndex);
        setSlideLayers([
          {
            key: `out-${seq}-${galleryItemKey(currentItem)}`,
            item: currentItem,
            role: "outgoing",
            enterFrom: navigation.enterFrom,
          },
          {
            key: `in-${seq}-${galleryItemKey(nextItem)}`,
            item: nextItem,
            role: "incoming",
            enterFrom: navigation.enterFrom,
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
      mainDragSnapBack ||
      pendingCommitIndexRef.current != null ||
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

      // 縦優先 → ページスクロールに任せてドラッグ解除
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
      // 閾値未満は離した位置から中央へ戻す（隣画像も一緒に動く）
      setMainDragSnapBack(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMainDragOffsetX(0);
        });
      });
      return;
    }

    // 確定時は一度中央に戻さず、画面外までスライドしてから切り替える（背景色のチラつき防止）
    const nextIndex =
      deltaX < 0
        ? wrapIndex(selectedIndex + 1, items.length)
        : wrapIndex(selectedIndex - 1, items.length);

    pendingCommitIndexRef.current = nextIndex;
    setMainDragSnapBack(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMainDragOffsetX(deltaX < 0 ? -width : width);
      });
    });
  };

  const handleDragTransitionEnd = (
    event: ReactTransitionEvent<HTMLDivElement>
  ) => {
    if (event.propertyName !== "transform") {
      return;
    }

    const pendingIndex = pendingCommitIndexRef.current;

    if (pendingIndex != null) {
      pendingCommitIndexRef.current = null;
      settleToIndex(pendingIndex);
      return;
    }

    if (mainDragSnapBack) {
      setMainDragSnapBack(false);
    }
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
      <section
        className="min-[1025px]:hidden"
        style={
          {
            "--product-detail-mobile-thumb-strip-height": PRODUCT_DETAIL_MOBILE_THUMB_STRIP_HEIGHT,
          } as CSSProperties
        }
      >
      <style>{`
        @keyframes product-detail-mobile-main-in-left {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes product-detail-mobile-main-in-right {
          from { transform: translate3d(100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes product-detail-mobile-main-out-left {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }
        @keyframes product-detail-mobile-main-out-right {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(100%, 0, 0); }
        }
        .product-detail-mobile-main-in-left,
        .product-detail-mobile-main-in-right,
        .product-detail-mobile-main-out-left,
        .product-detail-mobile-main-out-right {
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
        }
        .product-detail-mobile-main-in-left {
          animation-name: product-detail-mobile-main-in-left;
        }
        .product-detail-mobile-main-in-right {
          animation-name: product-detail-mobile-main-in-right;
        }
        .product-detail-mobile-main-out-left {
          animation-name: product-detail-mobile-main-out-left;
        }
        .product-detail-mobile-main-out-right {
          animation-name: product-detail-mobile-main-out-right;
        }
        @media (pointer: coarse) {
          .product-detail-mobile-dots {
            display: none;
          }
        }
      `}</style>

      {/* 1. 画像エリア：1画面にヘッダー＋メイン＋サムネ＋パンくず＋商品名の半分 */}
      <div
        id="photo"
        className="pt-[var(--header-height)] scroll-mt-[var(--header-height)]"
      >
        <div
          ref={mainViewportRef}
          className={`relative w-full touch-pan-y overflow-hidden bg-[#eef1f3] ${
            isMainDragging ? "touch-none" : ""
          }`}
          style={{
            cursor: isMainDragging ? "grabbing" : PRODUCT_DETAIL_ZOOM_IN_CURSOR,
            height:
              "calc(100svh - var(--header-height) - var(--product-detail-mobile-thumb-strip-height) - 8px - 13px - 16px - clamp(13px, calc(15px * var(--text-scale)), 15px))",
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
                sizes="100vw"
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
                sizes="100vw"
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
                  layer.role === "settled" ? handleDragTransitionEnd : undefined
                }
              >
                <ProductDetailGalleryMedia
                  item={layer.item}
                  mode={layer.role === "outgoing" ? "preview" : "playback"}
                  sizes="100vw"
                  priority={layer.role !== "outgoing"}
                  alt={layer.item.alt}
                />
              </div>
            );
          })}

          <p
            className="pointer-events-none absolute top-[12px] left-[12px] z-10 bg-black/70 px-[8px] py-[4px] font-ui-en text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-white"
          >
            {selectedIndex + 1} / {items.length}
          </p>

          {showGalleryNavigation ? (
          <ol
            aria-label="商品画像"
            className="product-detail-mobile-dots absolute bottom-[14px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[6px]"
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
                  onClick={() => selectImage(index)}
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

        <ProductDetailThumbnailStripHorizontal
          items={items}
          selectedIndex={selectedIndex}
          onSelect={selectImage}
        />
      </div>

      {/* 2. テキストエリア */}
      <div className="px-[var(--container-x)] pt-[8px] pb-[32px]">
        <ProductDetailBreadcrumbs
          category={product.category}
          categorySlug={product.categorySlug}
          className="font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-[var(--color-muted)]"
        />

        <h1
          className="mt-[16px] font-ui-en text-[clamp(26px,calc(30px*var(--text-scale)),30px)] leading-[clamp(26px,calc(30px*var(--text-scale)),30px)] font-semibold text-[var(--foreground)]"
        >
          {displayTitle}
        </h1>

        <ProductStatusLabel
          status={product.status}
          label={product.statusLabel}
          color={product.statusColor}
          size={13}
          className="mt-[12px] !text-[clamp(13px,calc(14px*var(--text-scale)),14px)] !leading-[clamp(13px,calc(14px*var(--text-scale)),14px)]"
        />

        {showVariantOptions ? (
        <div className="mt-[28px]">
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
              className="mt-[16px] font-ui-en text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-[var(--foreground)]"
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
          className={`mt-[28px] flex w-full items-center justify-between px-[20px] py-[16px] text-white disabled:cursor-not-allowed ${
            canAddToCart ? "bg-[var(--foreground)]" : "bg-[#C6C6C6]"
          }`}
        >
          <span
            className="inline-flex items-center gap-[calc(8/18*1em)] font-ui-en text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[clamp(15px,calc(16px*var(--text-scale)),16px)] font-medium"
          >
            <span
              aria-hidden="true"
              className="size-[calc(22/18*1em)] shrink-0 bg-current"
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
          className="mt-[32px]"
          bodyClassName="whitespace-pre-line font-body-ja text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[clamp(24.5px,calc(26.25px*var(--text-scale)),26.25px)] text-[var(--foreground)]"
        />
      </div>
      </section>

      <ProductDetailGalleryModal
        isOpen={isGalleryModalOpen}
        items={items}
        selectedIndex={selectedIndex}
        onSelect={selectImage}
        onClose={() => setIsGalleryModalOpen(false)}
      />
    </>
  );
}
