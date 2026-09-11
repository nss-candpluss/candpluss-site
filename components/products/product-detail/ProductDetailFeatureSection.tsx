"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

import {
  createFeatureTrack,
  settleFeatureTrack,
  wrapIndex,
  type FeatureTrackSlot,
} from "@/components/products/product-detail/feature-track";
import { preloadProductDetailImage } from "@/components/products/product-detail/image-preload";
import {
  PRODUCT_DETAIL_SLIDE_MS,
  productDetailSlideDurationMs,
} from "@/components/products/product-detail/slide-timing";
import { ProductFeatureLinks } from "@/components/products/ProductFeatureLinks";
import { ProductGalleryChevron } from "@/components/products/ProductGalleryControls";
import { ProductNotes } from "@/components/products/ProductNotes";
import { SiteImage } from "@/components/ui/SiteImage";
import { assetPath } from "@/lib/assetPath";
import { splitFeatureNotes } from "@/lib/products/feature-notes";
import { productDetailSectionTitleClassName, productFeatureItemTitleClassName } from "@/lib/typography";
import type {
  ProductFeature,
  ProductGalleryMedia,
  ProductVideo,
} from "@/types/product";

export type ProductDetailFeature = ProductFeature & {
  images?: string[];
  mediaSlots?: (string | null)[];
  links?: Array<{
    label: string;
    href?: string;
  }>;
};

type ProductDetailFeatureSectionProps = {
  id: string;
  title: "Material" | "Feature";
  features: ProductDetailFeature[];
  priorityFirst?: boolean;
  hasBottomPadding?: boolean;
};

type FeatureSlideEnterFrom = "left" | "right";

function resolveFeatureNavigation(
  fromIndex: number,
  toIndex: number,
  length: number
): { enterFrom: FeatureSlideEnterFrom; steps: number } {
  const forward = wrapIndex(toIndex - fromIndex, length);
  const backward = wrapIndex(fromIndex - toIndex, length);

  return forward <= backward
    ? { enterFrom: "right", steps: forward }
    : { enterFrom: "left", steps: -backward };
}

function ProductDetailFeatureVideo({
  video,
  active,
}: {
  video: ProductVideo;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = assetPath(video.src);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    let animationFrameId = 0;

    const syncPlayback = () => {
      const rect = element.getBoundingClientRect();
      const visibleHeight = Math.max(
        0,
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
      );
      const isVisible =
        rect.height > 0 && visibleHeight / rect.height >= 0.2;

      if (!active || !isVisible || document.visibilityState === "hidden") {
        element.pause();
        return;
      }

      element.muted = true;
      element.defaultMuted = true;
      element.playsInline = true;

      if (element.paused) {
        void element.play().catch(() => {
          // 低電力モード等で拒否された場合は、次の表示・再生可能イベントで再試行する
        });
      }
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(syncPlayback);
    };

    element.addEventListener("canplay", scheduleSync);
    element.addEventListener("loadeddata", scheduleSync);
    document.addEventListener("visibilitychange", scheduleSync);
    document.addEventListener("pointerdown", syncPlayback, { passive: true });
    document.addEventListener("touchstart", syncPlayback, { passive: true });
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("focus", scheduleSync);
    window.addEventListener("pageshow", scheduleSync);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(scheduleSync, {
            threshold: [0, 0.2],
          });
    observer?.observe(element);
    scheduleSync();

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(animationFrameId);
      element.removeEventListener("canplay", scheduleSync);
      element.removeEventListener("loadeddata", scheduleSync);
      document.removeEventListener("visibilitychange", scheduleSync);
      document.removeEventListener("pointerdown", syncPlayback);
      document.removeEventListener("touchstart", syncPlayback);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("focus", scheduleSync);
      window.removeEventListener("pageshow", scheduleSync);
      element.pause();
    };
  }, [active, videoSrc]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={video.poster ? assetPath(video.poster) : undefined}
      autoPlay={active}
      muted
      playsInline
      loop
      preload="auto"
      controls={false}
      className="absolute inset-0 size-full object-contain object-center"
    />
  );
}

type ProductDetailFeatureMedia = ProductGalleryMedia | null;

function ProductDetailFeatureMediaGallery({
  media,
  priority,
}: {
  media: ProductDetailFeatureMedia[];
  priority: boolean;
}) {
  const [slots, setSlots] = useState<FeatureTrackSlot[]>(() =>
    createFeatureTrack(media.length)
  );
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionMs, setTransitionMs] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingCommitRef = useRef<{
    imageIndex: number;
    direction: 1 | -1;
  } | null>(null);
  const navigationRequestRef = useRef(0);
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    axis: "x" | "y" | null;
    moved: boolean;
  } | null>(null);
  const hasMultipleMedia = media.length > 1;
  const selectedIndex =
    slots.find((slot) => slot.position === 0)?.imageIndex ?? 0;

  useEffect(() => {
    media.forEach((item) => {
      if (item?.kind === "image") {
        void preloadProductDetailImage(item.src);
      }
    });
  }, [media]);

  const settleTrack = useCallback(() => {
    const pending = pendingCommitRef.current;
    pendingCommitRef.current = null;

    setTransitionMs(0);
    setDragOffsetX(0);

    if (pending) {
      setSlots((currentSlots) =>
        settleFeatureTrack(
          currentSlots,
          pending.imageIndex,
          pending.direction,
          media.length
        )
      );
    }
  }, [media.length]);

  const animateTrack = useCallback(
    (fromOffsetX: number, toOffsetX: number, durationMs: number) => {
      // 動く距離がないと transitionend が来ないため、その場で確定させる
      if (Math.abs(toOffsetX - fromOffsetX) < 1) {
        settleTrack();
        return;
      }

      setTransitionMs(durationMs);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDragOffsetX(toOffsetX);
        });
      });
    },
    [settleTrack]
  );

  const goToIndex = useCallback(
    (index: number) => {
      if (
        !hasMultipleMedia ||
        isDragging ||
        transitionMs > 0 ||
        pendingCommitRef.current != null
      ) {
        return;
      }

      const nextIndex = wrapIndex(index, media.length);
      if (nextIndex === selectedIndex) {
        return;
      }

      const navigation = resolveFeatureNavigation(
        selectedIndex,
        nextIndex,
        media.length
      );
      const direction: 1 | -1 = navigation.enterFrom === "right" ? 1 : -1;
      const durationMs = productDetailSlideDurationMs(navigation.steps);
      const nextMedia = media[nextIndex];
      const requestId = ++navigationRequestRef.current;
      const preloadNextMedia = nextMedia?.kind === "image"
        ? preloadProductDetailImage(nextMedia.src)
        : Promise.resolve(true);

      void preloadNextMedia.then(() => {
        if (
          requestId !== navigationRequestRef.current ||
          pendingCommitRef.current != null
        ) {
          return;
        }

        // 差し替え先は画面外の待機スロットなので、入れ替えは見えない
        setSlots((currentSlots) =>
          currentSlots.map((slot) =>
            slot.position === direction
              ? { ...slot, imageIndex: nextIndex }
              : slot
          )
        );

        const width = viewportRef.current?.clientWidth ?? 0;
        pendingCommitRef.current = { imageIndex: nextIndex, direction };
        animateTrack(0, direction === 1 ? -width : width, durationMs);
      });
    },
    [
      animateTrack,
      hasMultipleMedia,
      isDragging,
      media,
      selectedIndex,
      transitionMs,
    ]
  );

  /** 3 枚で画面を覆える範囲に収め、ドラッグ中に隙間が出ないようにする */
  const clampDragOffset = (value: number) => {
    const width = viewportRef.current?.clientWidth ?? 0;
    return width > 0 ? Math.max(-width, Math.min(width, value)) : value;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "touch" ||
      !hasMultipleMedia ||
      isDragging ||
      transitionMs > 0 ||
      pendingCommitRef.current != null ||
      (event.target as Element | null)?.closest?.("button, a")
    ) {
      return;
    }

    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;

    if (swipe.axis === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        swipeRef.current = null;
        return;
      }

      swipe.axis = "x";
      swipe.moved = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (swipe.axis === "x") {
      event.preventDefault();
      setDragOffsetX(clampDragOffset(deltaX));
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const offsetX = clampDragOffset(event.clientX - swipe.startX);
    const wasHorizontalDrag = swipe.axis === "x" && swipe.moved;
    swipeRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);

    if (!wasHorizontalDrag) {
      setDragOffsetX(0);
      return;
    }

    const width = viewportRef.current?.clientWidth ?? 0;
    const threshold = Math.max(48, width * 0.12);

    if (width <= 0 || Math.abs(offsetX) < threshold) {
      animateTrack(offsetX, 0, PRODUCT_DETAIL_SLIDE_MS);
      return;
    }

    const direction: 1 | -1 = offsetX < 0 ? 1 : -1;
    pendingCommitRef.current = {
      imageIndex: wrapIndex(selectedIndex + direction, media.length),
      direction,
    };
    animateTrack(
      offsetX,
      direction === 1 ? -width : width,
      PRODUCT_DETAIL_SLIDE_MS
    );
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const offsetX = clampDragOffset(event.clientX - swipe.startX);
    swipeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    animateTrack(offsetX, 0, PRODUCT_DETAIL_SLIDE_MS);
  };

  const handleTrackTransitionEnd = (
    event: ReactTransitionEvent<HTMLDivElement>
  ) => {
    if (
      event.propertyName !== "transform" ||
      event.target !== event.currentTarget
    ) {
      return;
    }

    settleTrack();
  };

  return (
    <div
      ref={viewportRef}
      className="relative aspect-[13/10] touch-pan-y overflow-hidden bg-[var(--color-line)]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
    >
      {slots.map((slot) => {
        const item = media[slot.imageIndex];
        const isActive = slot.position === 0;

        return (
          <div
            key={slot.id}
            aria-hidden={!isActive}
            className={`pointer-events-none absolute inset-0 ${
              item?.kind === "video" ? "bg-black" : "bg-[var(--color-line)]"
            }`}
            style={{
              transform: `translate3d(calc(${slot.position * 100}% + ${dragOffsetX}px), 0, 0)`,
              transition:
                transitionMs > 0
                  ? `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : "none",
            }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {item?.kind === "image" ? (
              <SiteImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1025px) 33vw, (min-width: 768px) 50vw, 100vw"
                priority={priority && slot.imageIndex === 0}
                className="object-cover object-center"
              />
            ) : item?.kind === "video" ? (
              <ProductDetailFeatureVideo video={item} active={isActive} />
            ) : null}
          </div>
        );
      })}

      {hasMultipleMedia ? (
        <>
          <button
            type="button"
            aria-label="前のFeatureメディアを表示"
            onClick={() => goToIndex(selectedIndex - 1)}
            className="absolute top-1/2 left-[12px] z-10 flex size-[clamp(40px,calc(48px*var(--gap-scale-x)),48px)] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="left" />
          </button>

          <button
            type="button"
            aria-label="次のFeatureメディアを表示"
            onClick={() => goToIndex(selectedIndex + 1)}
            className="absolute top-1/2 right-[12px] z-10 flex size-[clamp(40px,calc(48px*var(--gap-scale-x)),48px)] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="right" />
          </button>

          <ol
            aria-label="Featureメディア"
            className="absolute bottom-[14px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[6px]"
          >
            {media.map((item, index) => (
              <li
                key={`${item?.id ?? "placeholder"}-${index}`}
                className="flex items-center"
              >
                <button
                  type="button"
                  aria-label={`${index + 1}件目のFeatureメディアを表示`}
                  aria-current={index === selectedIndex ? "true" : undefined}
                  onClick={() => goToIndex(index)}
                  className={`block rounded-full opacity-70 transition-[width,height,background-color] ${
                    index === selectedIndex
                      ? "size-[11px] bg-white"
                      : "size-[8px] bg-[#ccc]"
                  }`}
                />
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}

function ProductDetailFeatureCard({
  feature,
  priority,
}: {
  feature: ProductDetailFeature;
  priority: boolean;
}) {
  const { body, notes } = splitFeatureNotes(feature.body);
  const media: ProductDetailFeatureMedia[] = feature.media?.length
    ? feature.media
    : feature.video
      ? [
          {
            id: `${feature.id}-video`,
            kind: "video",
            ...feature.video,
          },
        ]
      : feature.mediaSlots?.length
        ? feature.mediaSlots.map((src, index) =>
            src
              ? {
                  id: `${feature.id}-media-${index}`,
                  kind: "image" as const,
                  src,
                  alt: "",
                }
              : null
          )
        : feature.images?.length
          ? feature.images.map((src, index) => ({
              id: `${feature.id}-image-${index}`,
              kind: "image" as const,
              src,
              alt: "",
            }))
          : feature.image
            ? [
                {
                  id: `${feature.id}-image`,
                  kind: "image" as const,
                  src: feature.image,
                  alt: "",
                },
              ]
            : [];

  return (
    <article className="block">
      {media.length ? (
        <ProductDetailFeatureMediaGallery media={media} priority={priority} />
      ) : (
        <div
          aria-label="画像準備中"
          className="aspect-[13/10] bg-[var(--color-line)]"
        />
      )}

      <div className="mt-[clamp(18px,calc(22px*var(--gap-scale-y)),22px)] flex flex-col px-[calc(8px*var(--gap-scale-x))]">
        <h4 className={productFeatureItemTitleClassName}>
          {feature.title}
        </h4>

        {body ? (
          <p className="mt-[clamp(12px,calc(15px*var(--gap-scale-y)),15px)] whitespace-pre-line font-body-ja text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[clamp(21.47px,calc(23px*var(--text-scale)),23px)] text-[var(--foreground)]">
            {body}
          </p>
        ) : null}

        <ProductNotes
          notes={notes}
          listClassName="mt-[calc(18px*var(--gap-scale-y))]"
        />

        {feature.links?.length ? <ProductFeatureLinks links={feature.links} /> : null}
      </div>
    </article>
  );
}

export function ProductDetailFeatureSection({
  id,
  title,
  features,
  priorityFirst = false,
  hasBottomPadding = true,
}: ProductDetailFeatureSectionProps) {
  if (!features.length) {
    return null;
  }

  const hasFeatureGroups = features.some((feature) => feature.group);
  const groupedFeatures = features.reduce<
    Array<{
      title: string;
      features: ProductDetailFeature[];
    }>
  >((groups, feature) => {
    const groupTitle = feature.group?.trim() ?? "";
    const currentGroup = groups.find((group) => group.title === groupTitle);

    if (currentGroup) {
      currentGroup.features.push(feature);
    } else {
      groups.push({ title: groupTitle, features: [feature] });
    }

    return groups;
  }, []);

  return (
    <section
      id={id}
      className={`scroll-mt-[var(--header-height)] px-[var(--container-x)] pt-[var(--container-y-top)] ${
        hasBottomPadding ? "pb-[var(--container-y-bottom)]" : "pb-0"
      }`}
    >
      <h2 className={`font-heading text-[var(--foreground)] ${productDetailSectionTitleClassName}`}>
        {title}
      </h2>

      {hasFeatureGroups ? (
        <div className="mt-[calc(98px*var(--gap-scale-y))] flex flex-col gap-[clamp(72px,calc(120px*var(--layout-scale-y)),120px)]">
          {groupedFeatures.map((group) => (
            <section key={group.title || "ungrouped"}>
              {group.title ? (
                <h3
                  className={`${
                    /[\u3040-\u30ff\u3400-\u9fff]/.test(group.title)
                      ? "font-body-ja"
                      : "font-ui-en"
                  } text-[clamp(23px,calc(32px*var(--text-scale)),32px)] leading-[clamp(23px,calc(32px*var(--text-scale)),32px)] font-medium text-[var(--foreground)]`}
                >
                  {group.title}
                </h3>
              ) : null}

              <div className={`${group.title ? "mt-[clamp(32px,calc(48px*var(--gap-scale-y)),48px)]" : ""} grid grid-cols-1 gap-x-[calc(52px*var(--gap-scale-x))] gap-y-[clamp(32px,calc(62px*var(--gap-scale-y)),62px)] md:grid-cols-2`}>
                {group.features.map((feature) => (
                  <ProductDetailFeatureCard
                    key={feature.id}
                    feature={feature}
                    priority={
                      priorityFirst &&
                      group === groupedFeatures[0] &&
                      feature === group.features[0]
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-[calc(98px*var(--gap-scale-y))] grid grid-cols-1 gap-x-[calc(52px*var(--gap-scale-x))] gap-y-[clamp(32px,calc(62px*var(--gap-scale-y)),62px)] md:grid-cols-2">
          {features.map((feature, index) => (
            <ProductDetailFeatureCard
              key={feature.id}
              feature={feature}
              priority={priorityFirst && index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
