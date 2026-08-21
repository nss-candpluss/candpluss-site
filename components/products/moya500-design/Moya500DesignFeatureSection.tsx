"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { preloadMoya500Image } from "@/components/products/moya500-design/image-preload";
import {
  MOYA500_DESIGN_SLIDE_MS,
  moya500DesignSlideDurationMs,
} from "@/components/products/moya500-design/slide-timing";
import { ProductFeatureLinks } from "@/components/products/ProductFeatureLinks";
import { ProductGalleryChevron } from "@/components/products/ProductGalleryControls";
import { ProductNotes } from "@/components/products/ProductNotes";
import { SiteImage } from "@/components/ui/SiteImage";
import { assetPath } from "@/lib/assetPath";
import { splitFeatureNotes } from "@/lib/products/feature-notes";
import type { ProductFeature } from "@/types/product";

export type Moya500DesignFeature = ProductFeature & {
  group?: "Fabric" | "Flame" | "Structure" | "Parts";
  images?: string[];
  mediaSlots?: (string | null)[];
  video?: {
    src: string;
    poster?: string;
  };
  links?: Array<{
    label: string;
    href?: string;
  }>;
};

type Moya500DesignFeatureSectionProps = {
  id: string;
  title: "Material" | "Feature";
  features: Moya500DesignFeature[];
  priorityFirst?: boolean;
  hasBottomPadding?: boolean;
};

type FeatureSlideEnterFrom = "left" | "right";

type FeatureSlideLayer = {
  key: string;
  image: string | null;
  role: "incoming" | "outgoing" | "settled";
  enterFrom: FeatureSlideEnterFrom;
};

function wrapIndex(index: number, length: number) {
  return length > 0 ? ((index % length) + length) % length : 0;
}

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

function featureSlideClassName(layer: FeatureSlideLayer) {
  if (layer.role === "settled") {
    return "";
  }

  if (layer.role === "incoming") {
    return layer.enterFrom === "left"
      ? "moya500-design-feature-in-left"
      : "moya500-design-feature-in-right";
  }

  return layer.enterFrom === "left"
    ? "moya500-design-feature-out-right"
    : "moya500-design-feature-out-left";
}

function Moya500DesignFeatureVideo({
  video,
}: {
  video: NonNullable<Moya500DesignFeature["video"]>;
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

      if (!isVisible || document.visibilityState === "hidden") {
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
  }, [videoSrc]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={video.poster ? assetPath(video.poster) : undefined}
      autoPlay
      muted
      playsInline
      loop
      preload="auto"
      controls={false}
      className="absolute inset-0 size-full object-contain object-center"
    />
  );
}

function Moya500DesignFeatureImageGallery({
  images,
  priority,
}: {
  images: (string | null)[];
  priority: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideLayers, setSlideLayers] = useState<FeatureSlideLayer[]>(() => [
    {
      key: `settled-0-${images[0] ?? "placeholder"}`,
      image: images[0],
      role: "settled",
      enterFrom: "right",
    },
  ]);
  const [backdropImage, setBackdropImage] = useState(images[0]);
  const [slideMs, setSlideMs] = useState(MOYA500_DESIGN_SLIDE_MS);
  const slideSeqRef = useRef(0);
  const selectionRequestRef = useRef(0);
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    axis: "x" | "y" | null;
  } | null>(null);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    images.forEach((image) => {
      if (image) {
        void preloadMoya500Image(image);
      }
    });
  }, [images]);

  const selectImage = useCallback(
    (
      index: number,
      navigationOverride?: {
        enterFrom: FeatureSlideEnterFrom;
        steps: number;
      }
    ) => {
      const nextIndex = wrapIndex(index, images.length);
      if (nextIndex === selectedIndex) {
        return;
      }

      const currentImage = images[selectedIndex];
      const nextImage = images[nextIndex];

      const navigation =
        navigationOverride ??
        resolveFeatureNavigation(selectedIndex, nextIndex, images.length);
      const durationMs = moya500DesignSlideDurationMs(navigation.steps);
      const requestId = ++selectionRequestRef.current;

      const preloadNextImage = nextImage
        ? preloadMoya500Image(nextImage)
        : Promise.resolve(true);

      void preloadNextImage.then(() => {
        if (requestId !== selectionRequestRef.current) {
          return;
        }

        const sequence = ++slideSeqRef.current;
        setSlideMs(durationMs);
        setSelectedIndex(nextIndex);
        setSlideLayers((layers) => {
          const settledLayer = layers.find(
            (layer) =>
              layer.role === "settled" && layer.image === currentImage
          );

          return [
            settledLayer
              ? {
                  ...settledLayer,
                  role: "outgoing",
                  enterFrom: navigation.enterFrom,
                }
              : {
                  key: `out-${sequence}-${currentImage ?? "placeholder"}`,
                  image: currentImage,
                  role: "outgoing",
                  enterFrom: navigation.enterFrom,
                },
            {
              key: `in-${sequence}-${nextImage ?? "placeholder"}`,
              image: nextImage,
              role: "incoming",
              enterFrom: navigation.enterFrom,
            },
          ];
        });
      });
    },
    [images, selectedIndex]
  );

  const selectRelativeImage = (offset: -1 | 1) => {
    selectImage(selectedIndex + offset, {
      enterFrom: offset < 0 ? "left" : "right",
      steps: offset,
    });
  };

  const handleIncomingAnimationEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
    layer: FeatureSlideLayer
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    setBackdropImage(layer.image);
    setSlideLayers((layers) => {
      const incoming = layers.find(
        (currentLayer) =>
          currentLayer.key === layer.key && currentLayer.role === "incoming"
      );

      return incoming
        ? [
            {
              ...incoming,
              role: "settled",
            },
          ]
        : layers;
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "touch" ||
      slideLayers.some((layer) => layer.role !== "settled")
    ) {
      return;
    }

    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;

    if (!swipe.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8) {
      swipe.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      if (swipe.axis === "x") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (swipe.axis === "x") {
      event.preventDefault();
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    swipeRef.current = null;
    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (
      swipe.axis === "x" &&
      Math.abs(deltaX) >= 40 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      selectRelativeImage(deltaX < 0 ? 1 : -1);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    swipeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="relative aspect-[13/10] touch-pan-y overflow-hidden bg-[var(--color-line)]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
    >
      {backdropImage ? (
        <SiteImage
          src={backdropImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          priority={priority}
          aria-hidden="true"
          className="pointer-events-none object-cover object-center"
        />
      ) : null}

      {slideLayers.map((layer) => (
        <div
          key={layer.key}
          aria-hidden={layer.role === "outgoing"}
          className={`absolute inset-0 ${featureSlideClassName(layer)}`}
          style={
            layer.role === "settled"
              ? undefined
              : { animationDuration: `${slideMs}ms` }
          }
          onAnimationEnd={
            layer.role === "incoming"
              ? (event) => handleIncomingAnimationEnd(event, layer)
              : undefined
          }
        >
          {layer.image ? (
            <SiteImage
              src={layer.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              priority={priority && selectedIndex === 0}
              className="object-cover object-center"
            />
          ) : null}
        </div>
      ))}

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            aria-label="前のFeature画像を表示"
            onClick={() => selectRelativeImage(-1)}
            className="absolute top-1/2 left-[12px] z-10 flex size-[clamp(40px,calc(48px*var(--gap-scale-x)),48px)] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="left" />
          </button>

          <button
            type="button"
            aria-label="次のFeature画像を表示"
            onClick={() => selectRelativeImage(1)}
            className="absolute top-1/2 right-[12px] z-10 flex size-[clamp(40px,calc(48px*var(--gap-scale-x)),48px)] -translate-y-1/2 items-center justify-center rounded-full border border-[#ccc] bg-white/80 text-[var(--foreground)] [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="right" />
          </button>

          <ol
            aria-label="Feature画像"
            className="absolute bottom-[14px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[6px]"
          >
            {images.map((image, index) => (
              <li
                key={`${image ?? "placeholder"}-${index}`}
                className="flex items-center"
              >
                <button
                  type="button"
                  aria-label={`${index + 1}枚目のFeature画像を表示`}
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
        </>
      ) : null}
    </div>
  );
}

function Moya500DesignFeatureCard({
  feature,
  priority,
}: {
  feature: Moya500DesignFeature;
  priority: boolean;
}) {
  const { body, notes } = splitFeatureNotes(feature.body);

  return (
    <article className="block">
      {feature.video ? (
        <div className="relative aspect-[13/10] overflow-hidden bg-black">
          <Moya500DesignFeatureVideo video={feature.video} />
        </div>
      ) : feature.mediaSlots?.length ? (
        <Moya500DesignFeatureImageGallery
          images={feature.mediaSlots}
          priority={priority}
        />
      ) : feature.images?.length ? (
        <Moya500DesignFeatureImageGallery
          images={feature.images}
          priority={priority}
        />
      ) : feature.image ? (
        <div className="relative aspect-[13/10] overflow-hidden bg-[var(--color-line)]">
          <SiteImage
            src={feature.image}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            priority={priority}
            className="object-cover object-center"
          />
        </div>
      ) : (
        <div
          aria-label="画像準備中"
          className="aspect-[13/10] bg-[var(--color-line)]"
        />
      )}

      <div className="mt-[clamp(18px,calc(22px*var(--gap-scale-y)),22px)] flex flex-col px-[calc(8px*var(--gap-scale-x))]">
        <h4
          className="min-w-0 font-body-ja text-[clamp(16px,calc(14.845px+0.308vw),18px)] leading-[clamp(22px,calc(26px*var(--text-scale)),26px)] font-bold text-[var(--foreground)]"
        >
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

export function Moya500DesignFeatureSection({
  id,
  title,
  features,
  priorityFirst = false,
  hasBottomPadding = true,
}: Moya500DesignFeatureSectionProps) {
  if (!features.length) {
    return null;
  }

  const hasFeatureGroups = features.some((feature) => feature.group);
  const groupedFeatures = features.reduce<
    Array<{
      title: NonNullable<Moya500DesignFeature["group"]>;
      features: Moya500DesignFeature[];
    }>
  >((groups, feature) => {
    if (!feature.group) {
      return groups;
    }

    const groupTitle = feature.group;
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
      <style>{`
        @keyframes moya500-design-feature-in-left {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes moya500-design-feature-in-right {
          from { transform: translate3d(100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes moya500-design-feature-out-left {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }
        @keyframes moya500-design-feature-out-right {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(100%, 0, 0); }
        }
        .moya500-design-feature-in-left,
        .moya500-design-feature-in-right,
        .moya500-design-feature-out-left,
        .moya500-design-feature-out-right {
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
        }
        .moya500-design-feature-in-left {
          animation-name: moya500-design-feature-in-left;
        }
        .moya500-design-feature-in-right {
          animation-name: moya500-design-feature-in-right;
        }
        .moya500-design-feature-out-left {
          animation-name: moya500-design-feature-out-left;
        }
        .moya500-design-feature-out-right {
          animation-name: moya500-design-feature-out-right;
        }
      `}</style>

      <h2 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-[clamp(38px,calc(24.13px+3.7vw),62px)] text-[var(--foreground)]">
        {title}
      </h2>

      {hasFeatureGroups ? (
        <div className="mt-[calc(98px*var(--gap-scale-y))] flex flex-col gap-[clamp(72px,calc(120px*var(--layout-scale-y)),120px)]">
          {groupedFeatures.map((group) => (
            <section key={group.title}>
              <h3 className="font-ui-en text-[clamp(23px,calc(32px*var(--text-scale)),32px)] leading-[clamp(23px,calc(32px*var(--text-scale)),32px)] font-medium text-[var(--foreground)]">
                {group.title}
              </h3>

              <div className="mt-[clamp(32px,calc(48px*var(--gap-scale-y)),48px)] grid grid-cols-1 gap-x-[calc(52px*var(--gap-scale-x))] gap-y-[clamp(32px,calc(62px*var(--gap-scale-y)),62px)] md:grid-cols-2 min-[1024px]:grid-cols-3">
                {group.features.map((feature) => (
                  <Moya500DesignFeatureCard
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
        <div className="mt-[calc(98px*var(--gap-scale-y))] grid grid-cols-1 gap-x-[calc(52px*var(--gap-scale-x))] gap-y-[clamp(32px,calc(62px*var(--gap-scale-y)),62px)] md:grid-cols-2 min-[1024px]:grid-cols-3">
          {features.map((feature, index) => (
            <Moya500DesignFeatureCard
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
