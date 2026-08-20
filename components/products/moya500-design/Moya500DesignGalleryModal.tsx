"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { ProductGalleryChevron } from "@/components/products/ProductGalleryControls";
import { Moya500DesignGalleryMedia } from "@/components/products/moya500-design/Moya500DesignGalleryMedia";
import {
  MOYA500_ZOOM_IN_CURSOR,
  MOYA500_ZOOM_OUT_CURSOR,
} from "@/components/products/moya500-design/gallery-cursors";
import type { Moya500DesignGalleryItem } from "@/components/products/moya500-design/gallery-media";
import { uiText } from "@/lib/typography";

const MIN_SCALE = 1;
const CLICK_ZOOM_SCALE = 1.8;
const MAX_PINCH_SCALE = 3;

type Moya500DesignGalleryModalProps = {
  isOpen: boolean;
  items: Moya500DesignGalleryItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function ZoomableMedia({ item }: { item: Moya500DesignGalleryItem }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startPosition: { x: number; y: number };
    startCenter: { x: number; y: number };
  } | null>(null);
  const suppressZoomClickRef = useRef(false);
  const lastPointerTypeRef = useRef<string>("mouse");
  const intrinsicSizeRef = useRef({ width: 0, height: 0 });
  const scaleRef = useRef(MIN_SCALE);
  const positionRef = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(MIN_SCALE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mediaBoxSize, setMediaBoxSize] = useState<{
    width: number | string;
    height: number | string;
  }>({ width: "100%", height: "100%" });
  const zoomCursor =
    scale > MIN_SCALE ? MOYA500_ZOOM_OUT_CURSOR : MOYA500_ZOOM_IN_CURSOR;

  const getPanBounds = (nextScale: number) => {
    const stage = stageRef.current;
    if (!stage) {
      return { maxX: 0, maxY: 0 };
    }

    let contentWidth = stage.clientWidth;
    let contentHeight = stage.clientHeight;
    const intrinsicSize = intrinsicSizeRef.current;

    if (
      item.kind === "image" &&
      intrinsicSize.width > 0 &&
      intrinsicSize.height > 0
    ) {
      const mediaAspect = intrinsicSize.width / intrinsicSize.height;
      const stageAspect = stage.clientWidth / stage.clientHeight;

      if (mediaAspect > stageAspect) {
        contentWidth = stage.clientHeight * mediaAspect;
      } else {
        contentHeight = stage.clientWidth / mediaAspect;
      }
    }

    return {
      maxX: Math.max(0, (contentWidth * nextScale - stage.clientWidth) / 2),
      maxY: Math.max(0, (contentHeight * nextScale - stage.clientHeight) / 2),
    };
  };

  const clampPosition = (x: number, y: number, nextScale = scale) => {
    const { maxX, maxY } = getPanBounds(nextScale);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    suppressZoomClickRef.current = false;
    lastPointerTypeRef.current = event.pointerType;

    if (
      event.button !== 0 ||
      (event.target as Element | null)?.closest?.("button")
    ) {
      return;
    }

    if (event.pointerType === "touch") {
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (pointersRef.current.size >= 2) {
        const [first, second] = Array.from(pointersRef.current.values());
        pinchRef.current = {
          startDistance: Math.max(
            1,
            Math.hypot(second.x - first.x, second.y - first.y)
          ),
          startScale: scaleRef.current,
          startPosition: positionRef.current,
          startCenter: {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
          },
        };
        dragRef.current = null;
        suppressZoomClickRef.current = true;
        setIsDragging(true);
        return;
      }
    }

    const { maxX, maxY } = getPanBounds(scaleRef.current);
    const canPan =
      scaleRef.current > MIN_SCALE ||
      (event.pointerType === "touch" && (maxX > 0 || maxY > 0));

    if (!canPan) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    setIsDragging(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === "touch" &&
      pointersRef.current.has(event.pointerId)
    ) {
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pinch = pinchRef.current;
      if (pinch && pointersRef.current.size >= 2) {
        const [first, second] = Array.from(pointersRef.current.values());
        const distance = Math.hypot(
          second.x - first.x,
          second.y - first.y
        );
        const nextScale = Math.max(
          MIN_SCALE,
          Math.min(
            MAX_PINCH_SCALE,
            pinch.startScale * (distance / pinch.startDistance)
          )
        );
        const currentCenter = {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        };
        const stageRect = stageRef.current?.getBoundingClientRect();

        if (stageRect) {
          const stageCenter = {
            x: stageRect.left + stageRect.width / 2,
            y: stageRect.top + stageRect.height / 2,
          };
          const contentPoint = {
            x:
              (pinch.startCenter.x -
                stageCenter.x -
                pinch.startPosition.x) /
              pinch.startScale,
            y:
              (pinch.startCenter.y -
                stageCenter.y -
                pinch.startPosition.y) /
              pinch.startScale,
          };
          const nextPosition = clampPosition(
            currentCenter.x - stageCenter.x - contentPoint.x * nextScale,
            currentCenter.y - stageCenter.y - contentPoint.y * nextScale,
            nextScale
          );

          scaleRef.current = nextScale;
          positionRef.current = nextPosition;
          setScale(nextScale);
          setPosition(nextPosition);
        }

        suppressZoomClickRef.current = true;
        event.preventDefault();
        return;
      }
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) {
      return;
    }

    suppressZoomClickRef.current = true;
    const nextPosition = clampPosition(
      drag.originX + deltaX,
      drag.originY + deltaY,
      scaleRef.current
    );
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      pointersRef.current.delete(event.pointerId);

      if (pinchRef.current) {
        pinchRef.current = null;
        const remainingPointer = pointersRef.current.entries().next().value as
          | [number, { x: number; y: number }]
          | undefined;

        const { maxX, maxY } = getPanBounds(scaleRef.current);
        if (
          remainingPointer &&
          (scaleRef.current > MIN_SCALE || maxX > 0 || maxY > 0)
        ) {
          const [pointerId, point] = remainingPointer;
          dragRef.current = {
            pointerId,
            startX: point.x,
            startY: point.y,
            originX: positionRef.current.x,
            originY: positionRef.current.y,
          };
          setIsDragging(true);
        } else {
          dragRef.current = null;
          setIsDragging(false);
        }
      }
    }

    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as Element | null)?.closest?.("button")) {
      return;
    }

    if (lastPointerTypeRef.current === "touch") {
      suppressZoomClickRef.current = false;
      return;
    }

    if (suppressZoomClickRef.current) {
      suppressZoomClickRef.current = false;
      return;
    }

    const nextScale = scale > MIN_SCALE ? MIN_SCALE : CLICK_ZOOM_SCALE;
    scaleRef.current = nextScale;
    positionRef.current = { x: 0, y: 0 };
    setScale(nextScale);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={stageRef}
      className="relative size-full touch-none overflow-hidden bg-[#eef1f3]"
      style={{ cursor: isDragging ? "grabbing" : zoomCursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleStageClick}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: mediaBoxSize.width,
          height: mediaBoxSize.height,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="relative size-full will-change-transform"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging ? "none" : "transform 220ms ease-out",
          }}
        >
          <Moya500DesignGalleryMedia
            item={item}
            mode="playback"
            sizes="100vw"
            alt={item.alt}
            className="pointer-events-none object-cover object-center"
            onImageLoad={(image) => {
              const stage = stageRef.current;
              const intrinsicSize = {
                width: image.naturalWidth,
                height: image.naturalHeight,
              };
              intrinsicSizeRef.current = intrinsicSize;

              if (!stage || !intrinsicSize.width || !intrinsicSize.height) {
                return;
              }

              const mediaAspect = intrinsicSize.width / intrinsicSize.height;
              const stageAspect = stage.clientWidth / stage.clientHeight;

              if (mediaAspect > stageAspect) {
                setMediaBoxSize({
                  width: stage.clientHeight * mediaAspect,
                  height: stage.clientHeight,
                });
              } else {
                setMediaBoxSize({
                  width: stage.clientWidth,
                  height: stage.clientWidth / mediaAspect,
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function Moya500DesignGalleryModal({
  isOpen,
  items,
  selectedIndex,
  onSelect,
  onClose,
}: Moya500DesignGalleryModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedItem = items[selectedIndex];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        onSelect(wrapIndex(selectedIndex - 1, items.length));
      }

      if (event.key === "ArrowRight") {
        onSelect(wrapIndex(selectedIndex + 1, items.length));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, items.length, onClose, onSelect, selectedIndex]);

  if (!isOpen || !selectedItem) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="商品画像ギャラリー"
      className="fixed inset-0 z-[100] bg-white text-[var(--foreground)]"
    >
      <div className="relative size-full overflow-hidden">
        <ZoomableMedia
          key={`${selectedIndex}-${selectedItem.src}`}
          item={selectedItem}
        />
      </div>

      <p
        className={`pointer-events-none fixed top-[12px] left-[12px] z-20 bg-black/70 px-[8px] py-[4px] font-ui-en text-white ${uiText(13)}`}
      >
        {selectedIndex + 1} / {items.length}
      </p>

      <div className="fixed bottom-[24px] left-[22px] z-20 flex items-center gap-[12px]">
          <button
            type="button"
            aria-label="前の画像"
            onClick={() =>
              onSelect(wrapIndex(selectedIndex - 1, items.length))
            }
            className="flex size-[48px] items-center justify-center rounded-full border border-[#ccc] bg-white/80 [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="left" />
          </button>
          <button
            type="button"
            aria-label="次の画像"
            onClick={() =>
              onSelect(wrapIndex(selectedIndex + 1, items.length))
            }
            className="flex size-[48px] items-center justify-center rounded-full border border-[#ccc] bg-white/80 [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <ProductGalleryChevron direction="right" />
          </button>
      </div>

      <button
        ref={closeButtonRef}
        type="button"
        aria-label="ギャラリーを閉じる"
        onClick={onClose}
        className="fixed top-[12px] right-[12px] z-20 flex size-[48px] items-center justify-center rounded-full border border-[#ccc] bg-white/90 [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="size-[12px]"
        >
          <path
            d="M1 1L11 11M11 1L1 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
    </div>
  );
}
