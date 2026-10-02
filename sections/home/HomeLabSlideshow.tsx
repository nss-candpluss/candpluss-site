"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { ProductGalleryControls } from "@/components/products/ProductGalleryControls";
import { SiteImage } from "@/components/ui/SiteImage";

const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_MIN_PX = 48;
const SWIPE_VIEWPORT_RATIO = 0.12;

type HomeLabSlideshowProps = {
  slides: readonly string[];
};

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function withNeighbors(indices: Set<number>, index: number, length: number) {
  const next = new Set(indices);
  next.add(index);
  next.add(wrapIndex(index + 1, length));
  next.add(wrapIndex(index - 1, length));
  return next;
}

export function HomeLabSlideshow({ slides }: HomeLabSlideshowProps) {
  const total = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [mountedIndices, setMountedIndices] = useState(() => new Set([0]));
  const [isInView, setIsInView] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(
    null
  );

  const goTo = useCallback(
    (index: number) => {
      const nextIndex = wrapIndex(index, total);
      if (nextIndex === activeIndex) {
        return;
      }

      setPreviousIndex(activeIndex);
      setActiveIndex(nextIndex);
      setMountedIndices((indices) => withNeighbors(indices, nextIndex, total));
    },
    [activeIndex, total]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setMountedIndices((indices) => withNeighbors(indices, activeIndex, total));
        }
      },
      { rootMargin: "50% 0px" }
    );
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [activeIndex, total]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (total < 2 || !isInView || !isPageVisible) {
      return;
    }

    // activeIndex が変わるたびに張り直すため、手動操作後も 5 秒数え直しになる
    const timerId = window.setTimeout(() => goTo(activeIndex + 1), AUTOPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timerId);
  }, [activeIndex, goTo, isInView, isPageVisible, total]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || total < 2) {
      return;
    }

    if ((event.target as Element | null)?.closest?.("button, a")) {
      return;
    }

    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    swipeRef.current = null;

    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    const width = viewportRef.current?.clientWidth ?? 0;
    const threshold = Math.max(SWIPE_MIN_PX, width * SWIPE_VIEWPORT_RATIO);

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    // 左へスワイプ → 次へ / 右へスワイプ → 前へ
    goTo(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
  };

  const handlePointerCancel = () => {
    swipeRef.current = null;
  };

  return (
    <div
      ref={viewportRef}
      className="relative h-svh w-full touch-pan-y overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="absolute inset-0 isolate">
        {slides.map((src, index) => {
          if (!mountedIndices.has(index)) {
            return null;
          }

          const isActive = index === activeIndex;
          const isPrevious = index === previousIndex;

          // 新しい画像の読み込み・フェード中も、直前の画像を下に残して黒抜けを防ぐ
          const layerClassName = isActive
            ? "z-20 opacity-100 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
            : isPrevious
              ? "z-10 opacity-100"
              : "z-0 opacity-0";

          return (
            <div
              key={src}
              aria-hidden={isActive ? undefined : true}
              className={`absolute inset-0 ${layerClassName}`}
            >
              <SiteImage
                src={src}
                alt=""
                fill
                sizes="100vw"
                unoptimized
                loading={index === 0 ? undefined : "eager"}
                draggable={false}
                className="object-cover object-center select-none"
              />
            </div>
          );
        })}
      </div>

      <div className="pointer-coarse:hidden">
        <ProductGalleryControls
          hasImages={total > 1}
          onPrevious={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
        />
      </div>

      {total > 1 ? (
        <ol
          aria-label="LABO画像"
          className="absolute bottom-[14px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[6px] min-[1025px]:bottom-[clamp(16px,2.2vh,26px)]"
        >
          {slides.map((src, index) => (
            <li key={src} className="flex items-center">
              <button
                type="button"
                aria-label={`${index + 1}枚目の画像を表示`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => goTo(index)}
                className={`block rounded-full opacity-70 transition-[width,height,background-color] ${
                  index === activeIndex ? "size-[11px] bg-white" : "size-[8px] bg-[#ccc]"
                }`}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
