"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  Moya500DesignGalleryMedia,
  Moya500DesignVideoThumbBadge,
} from "@/components/products/moya500-design/Moya500DesignGalleryMedia";
import {
  galleryItemKey,
  type Moya500DesignGalleryItem,
} from "@/components/products/moya500-design/gallery-media";
import {
  MOYA500_DESIGN_SLIDE_MS,
  moya500DesignSlideDurationMs,
} from "@/components/products/moya500-design/slide-timing";
import { shouldDisplayGalleryNavigation } from "@/lib/products/gallery";

const VISIBLE_COUNT = 5;
const THUMB_SIZE_PX = 70;
const THUMB_PADDING_PX = 3;
const THUMB_BORDER_PX = 1;
/** 外枠込みのスロットサイズ（画像70 + 余白3×2 + 枠線1×2 = 78） */
const THUMB_SLOT_PX =
  THUMB_SIZE_PX + (THUMB_PADDING_PX + THUMB_BORDER_PX) * 2;

export type Moya500DesignSelectMeta = {
  durationMs: number;
  steps: number;
};

export type Moya500DesignThumbnailStripHandle = {
  goToIndex: (index: number) => void;
};

type Moya500DesignThumbnailStripProps = {
  items: Moya500DesignGalleryItem[];
  selectedIndex: number;
  onSelect: (index: number, meta: Moya500DesignSelectMeta) => void;
};

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <span
      aria-hidden="true"
      className={`block size-[9px] border-t border-l border-current ${
        direction === "up" ? "rotate-45 translate-y-[2px]" : "-rotate-135 -translate-y-[2px]"
      }`}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

/** 選択位置に応じた先頭インデックス。末尾 VISIBLE_COUNT 枚は最上段固定にしない */
function scrollForSelection(selectedIndex: number, length: number) {
  const maxScroll = Math.max(0, length - VISIBLE_COUNT);
  return clamp(selectedIndex, 0, maxScroll);
}

export const Moya500DesignThumbnailStrip = forwardRef<
  Moya500DesignThumbnailStripHandle,
  Moya500DesignThumbnailStripProps
>(function Moya500DesignThumbnailStrip(
  { items, selectedIndex, onSelect },
  ref
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const itemRef = useRef<HTMLLIElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    originOffset: number;
    moved: boolean;
  } | null>(null);
  const animatingRef = useRef(false);
  const selectedIndexRef = useRef(selectedIndex);

  const maxScroll = useMemo(
    () => Math.max(0, items.length - VISIBLE_COUNT),
    [items.length]
  );
  const settledScroll = scrollForSelection(selectedIndex, items.length);

  const [stepPx, setStepPx] = useState(0);
  const [gapPx, setGapPx] = useState(8);
  const [offsetY, setOffsetY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const [transitionMs, setTransitionMs] = useState(MOYA500_DESIGN_SLIDE_MS);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const settledOffset = -settledScroll * stepPx;
  const transformY = isDragging || isAnimating ? offsetY : settledOffset;

  const measure = useCallback(() => {
    const item = itemRef.current;
    const track = trackRef.current;

    if (!item || !track) {
      return;
    }

    const itemHeight = item.getBoundingClientRect().height;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.rowGap || styles.gap || "8") || 8;
    const nextStep = itemHeight + gap;

    setStepPx(nextStep);
    setGapPx(gap);
  }, []);

  useLayoutEffect(() => {
    measure();

    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [measure, items.length]);

  const finishMove = useCallback(() => {
    animatingRef.current = false;
    setIsAnimating(false);
    setDisableTransition(false);
    setTransitionMs(MOYA500_DESIGN_SLIDE_MS);
  }, []);

  const runOffsetTransition = useCallback(
    (fromOffset: number, toOffset: number, durationMs: number) => {
      animatingRef.current = true;
      setIsAnimating(true);
      setTransitionMs(durationMs);
      setDisableTransition(true);
      setOffsetY(fromOffset);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisableTransition(false);
          setOffsetY(toOffset);
        });
      });
    },
    []
  );

  const animateToIndex = useCallback(
    (
      targetIndex: number,
      options?: {
        fromScroll?: number;
        /** ドラッグ離し位置など、実際の開始 offset（px） */
        fromOffset?: number;
      }
    ) => {
      if (!items.length || animatingRef.current) {
        return;
      }

      const currentIndex = selectedIndexRef.current;
      const nextIndex = clamp(targetIndex, 0, items.length - 1);
      const fromScroll =
        options?.fromScroll ?? scrollForSelection(currentIndex, items.length);
      const toScroll = scrollForSelection(nextIndex, items.length);
      const toOffset = -toScroll * stepPx;
      const fromOffset =
        options?.fromOffset ?? -fromScroll * stepPx;
      const scrollSteps = toScroll - fromScroll;
      const selectSteps = nextIndex - currentIndex;
      const offsetDelta = toOffset - fromOffset;

      // 選択もスクロールも変わらないが、ドラッグ途中位置からの復帰だけ必要な場合
      if (nextIndex === currentIndex && Math.abs(offsetDelta) > 0.5 && stepPx) {
        const durationMs = moya500DesignSlideDurationMs(1);
        runOffsetTransition(fromOffset, toOffset, durationMs);
        return;
      }

      if (nextIndex === currentIndex) {
        return;
      }

      const motionSteps =
        scrollSteps !== 0 ? scrollSteps : selectSteps !== 0 ? selectSteps : 0;
      const durationMs = moya500DesignSlideDurationMs(
        motionSteps === 0 ? 1 : motionSteps
      );
      const stepsMeta =
        motionSteps === 0
          ? nextIndex > currentIndex
            ? 1
            : -1
          : motionSteps;

      if (!stepPx || Math.abs(offsetDelta) <= 0.5) {
        onSelect(nextIndex, { durationMs, steps: stepsMeta });
        return;
      }

      // onSelect より先に animating へ入れ、settledOffset への瞬間ジャンプを防ぐ
      runOffsetTransition(fromOffset, toOffset, durationMs);
      onSelect(nextIndex, { durationMs, steps: stepsMeta });
    },
    [items.length, onSelect, runOffsetTransition, stepPx]
  );

  const animateStep = useCallback(
    (direction: -1 | 1) => {
      if (!items.length) {
        return;
      }

      const currentIndex = selectedIndexRef.current;
      const fromScroll = scrollForSelection(currentIndex, items.length);

      // 端: リスト端まで長くスライドして折り返す（循環表示はしない）
      if (direction === -1 && currentIndex === 0) {
        animateToIndex(items.length - 1, { fromScroll });
        return;
      }

      if (direction === 1 && currentIndex === items.length - 1) {
        animateToIndex(0, { fromScroll });
        return;
      }

      animateToIndex(currentIndex + direction, { fromScroll });
    },
    [animateToIndex, items.length]
  );

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!items.length) {
        return;
      }

      animateToIndex(wrapIndex(nextIndex, items.length));
    },
    [animateToIndex, items.length]
  );

  useImperativeHandle(ref, () => ({ goToIndex }), [goToIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") {
        return;
      }

      if (!animatingRef.current) {
        return;
      }

      finishMove();
    };

    track.addEventListener("transitionend", handleTransitionEnd);
    return () => track.removeEventListener("transitionend", handleTransitionEnd);
  }, [finishMove]);

  const selectFromPoint = (clientX: number, clientY: number) => {
    const target = document.elementFromPoint(clientX, clientY);
    const button = target?.closest<HTMLElement>("[data-thumb-index]");

    if (!button) {
      return;
    }

    const nextIndex = Number(button.dataset.thumbIndex);

    if (Number.isNaN(nextIndex)) {
      return;
    }

    animateToIndex(nextIndex);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (animatingRef.current || !stepPx || event.button !== 0) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      originOffset: settledOffset,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - drag.startY;

    if (!drag.moved && Math.abs(deltaY) > 4) {
      drag.moved = true;
      setIsDragging(true);
      setDisableTransition(true);
      setOffsetY(drag.originOffset);
    }

    if (!drag.moved) {
      return;
    }

    const minOffset = -maxScroll * stepPx;
    const maxOffset = 0;
    setOffsetY(clamp(drag.originOffset + deltaY, minOffset, maxOffset));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - drag.startY;
    const minOffset = -maxScroll * stepPx;
    const currentOffset = clamp(drag.originOffset + deltaY, minOffset, 0);
    const wasDragging = drag.moved;
    const fromScroll = settledScroll;
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!wasDragging) {
      setIsDragging(false);
      setDisableTransition(false);
      selectFromPoint(event.clientX, event.clientY);
      return;
    }

    if (!stepPx) {
      setIsDragging(false);
      setDisableTransition(false);
      return;
    }

    const snappedScroll = clamp(Math.round(-currentOffset / stepPx), 0, maxScroll);

    // 離した位置を保持したまま isDragging を終える（settledOffset へ一瞬戻るのを防ぐ）
    setOffsetY(currentOffset);
    setIsAnimating(true);
    setDisableTransition(true);
    setIsDragging(false);

    // スナップ先の最上段画像を選択。アニメはドラッグ離し位置から開始
    animateToIndex(snappedScroll, {
      fromScroll,
      fromOffset: currentOffset,
    });

    // 選択もオフセットも変わらずアニメ未開始なら、一時フラグを戻す
    if (!animatingRef.current) {
      setIsAnimating(false);
      setDisableTransition(false);
    }
  };

  const viewportHeight =
    stepPx > 0
      ? stepPx * Math.min(VISIBLE_COUNT, Math.max(items.length, 1)) - gapPx
      : undefined;
  const showGalleryNavigation = shouldDisplayGalleryNavigation(items.length);

  return (
    <aside
      aria-label="商品画像サムネイル"
      className="flex min-h-0 flex-col items-center justify-start px-[clamp(7px,0.8vw,14px)] py-[clamp(12px,2vh,24px)]"
    >
      {showGalleryNavigation ? (
      <button
        type="button"
        aria-label="前の画像を表示"
        onClick={() => animateStep(-1)}
        className="flex size-8 shrink-0 items-center justify-center"
      >
        <Chevron direction="up" />
      </button>
      ) : null}

      <div
        ref={viewportRef}
        className="relative my-[clamp(8px,1.2vh,16px)] touch-none overflow-hidden"
        style={{ width: THUMB_SLOT_PX, height: viewportHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <ul
          ref={trackRef}
          className="flex flex-col gap-[clamp(6px,1vh,12px)] will-change-transform"
          style={{
            width: THUMB_SLOT_PX,
            transform: `translate3d(0, ${transformY}px, 0)`,
            transition:
              disableTransition || isDragging
                ? "none"
                : `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {items.map((item, itemIndex) => {
            const isSelected = itemIndex === selectedIndex;
            const isMeasureTarget = itemIndex === 0;

            return (
              <li
                key={`${galleryItemKey(item)}-${itemIndex}`}
                ref={isMeasureTarget ? itemRef : undefined}
                className="flex shrink-0 items-center justify-center"
                style={{ width: THUMB_SLOT_PX, height: THUMB_SLOT_PX }}
              >
                <button
                  type="button"
                  data-thumb-index={itemIndex}
                  aria-label={
                    item.kind === "video"
                      ? `${itemIndex + 1}枚目の動画を表示`
                      : `${itemIndex + 1}枚目の画像を表示`
                  }
                  aria-pressed={isSelected}
                  className={`relative box-border flex cursor-grab items-center justify-center overflow-hidden border-solid bg-transparent active:cursor-grabbing ${
                    isSelected ? "border-black" : "border-transparent"
                  }`}
                  style={{
                    width: THUMB_SLOT_PX,
                    height: THUMB_SLOT_PX,
                    padding: THUMB_PADDING_PX,
                    borderWidth: THUMB_BORDER_PX,
                  }}
                >
                  <span
                    className="relative block shrink-0 overflow-hidden"
                    style={{ width: THUMB_SIZE_PX, height: THUMB_SIZE_PX }}
                  >
                    <Moya500DesignGalleryMedia
                      item={item}
                      mode="preview"
                      sizes={`${THUMB_SIZE_PX}px`}
                      alt=""
                      className="pointer-events-none object-cover"
                      useThumbnail
                    />
                    {item.kind === "video" ? (
                      <Moya500DesignVideoThumbBadge />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {showGalleryNavigation ? (
      <button
        type="button"
        aria-label="次の画像を表示"
        onClick={() => animateStep(1)}
        className="flex size-8 shrink-0 items-center justify-center"
      >
        <Chevron direction="down" />
      </button>
      ) : null}
    </aside>
  );
});
