"use client";

import { useEffect, useRef } from "react";

import {
  Moya500DesignGalleryMedia,
  Moya500DesignVideoThumbBadge,
} from "@/components/products/moya500-design/Moya500DesignGalleryMedia";
import {
  galleryItemKey,
  type Moya500DesignGalleryItem,
} from "@/components/products/moya500-design/gallery-media";

/** PC版の「枠線1px + 余白3px」と同じ、画像までの総インセット */
const THUMB_IMAGE_INSET_PX = 4;
const THUMB_GAP = "clamp(0px, calc(2px * var(--gap-scale-x)), 2px)";
/** 画面内に見える枚数（6枚目は半分） */
const THUMB_VISIBLE_COUNT = 5.5;
/** 5.5枚表示時に画面内へ入るギャップ数 */
const THUMB_VISIBLE_GAPS = 5;

/** 左右余白を除いた領域に 5.5 枚分が入るスロット幅 */
const THUMB_SLOT_WIDTH = `calc((100vw - 2 * var(--container-x) - ${THUMB_VISIBLE_GAPS} * ${THUMB_GAP}) / ${THUMB_VISIBLE_COUNT})`;

type Moya500DesignThumbnailStripHorizontalProps = {
  items: Moya500DesignGalleryItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function Moya500DesignThumbnailStripHorizontal({
  items,
  selectedIndex,
  onSelect,
}: Moya500DesignThumbnailStripHorizontalProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = selectedRef.current;
    const list = listRef.current;

    if (!button || !list) {
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const nextLeft =
      list.scrollLeft +
      (buttonRect.left - listRect.left) -
      (listRect.width - buttonRect.width) / 2;

    list.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: "smooth",
    });
  }, [selectedIndex]);

  return (
    <aside aria-label="商品画像サムネイル" className="w-full shrink-0 bg-[var(--background)]">
      <ul
        ref={listRef}
        className="flex shrink-0 overflow-x-auto px-[var(--container-x)] py-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: THUMB_GAP }}
      >
        {items.map((item, itemIndex) => {
          const isSelected = itemIndex === selectedIndex;

          return (
            <li
              key={`${galleryItemKey(item)}-${itemIndex}`}
              className="shrink-0"
              style={{ width: THUMB_SLOT_WIDTH }}
            >
              <button
                ref={isSelected ? selectedRef : undefined}
                type="button"
                aria-label={
                  item.kind === "video"
                    ? `${itemIndex + 1}枚目の動画を表示`
                    : `${itemIndex + 1}枚目の画像を表示`
                }
                aria-pressed={isSelected}
                onClick={() => onSelect(itemIndex)}
                className="relative aspect-square w-full overflow-hidden bg-transparent"
              >
                <span
                  className="absolute block overflow-hidden"
                  style={{ inset: THUMB_IMAGE_INSET_PX }}
                >
                  <Moya500DesignGalleryMedia
                    item={item}
                    mode="preview"
                    sizes="18vw"
                    alt=""
                    className="pointer-events-none object-cover"
                    useThumbnail
                  />
                  {item.kind === "video" ? (
                    <Moya500DesignVideoThumbBadge />
                  ) : null}
                </span>
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 border border-black"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
