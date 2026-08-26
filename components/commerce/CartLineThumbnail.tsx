"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { SiteImage } from "@/components/ui/SiteImage";

/** 数量ステッパー + 削除ボタンが収まる最小幅 */
const CONTENT_MIN_WIDTH_PX = 168;

type CartLineThumbnailProps = {
  src?: string | null;
  alt: string;
  sizes: string;
};

export function CartLineThumbnail({ src, alt, sizes }: CartLineThumbnailProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const media = mediaRef.current;
    const row = media?.parentElement;
    const content = media?.nextElementSibling;

    if (!media || !row || !(content instanceof HTMLElement)) {
      return;
    }

    const rowElement = row;
    const contentElement = content;

    function update() {
      const styles = getComputedStyle(rowElement);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const extraSiblings = Array.from(rowElement.children).filter(
        (element) => element !== media && element !== contentElement
      );
      const extraWidth = extraSiblings.reduce(
        (sum, element) => sum + (element as HTMLElement).offsetWidth,
        0
      );
      const gapCount = Math.max(rowElement.children.length - 1, 0);
      const available =
        rowElement.clientWidth -
        gap * gapCount -
        extraWidth -
        CONTENT_MIN_WIDTH_PX;
      const next = Math.max(
        0,
        Math.min(contentElement.offsetHeight, available)
      );
      const rounded = Math.round(next);

      setSize((current) => (current === rounded ? current : rounded));
    }

    const observer = new ResizeObserver(update);
    observer.observe(rowElement);
    observer.observe(contentElement);
    update();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={mediaRef}
      className="relative shrink-0 self-start bg-[#eef1f3]"
      style={
        size == null
          ? { width: 96, height: 96 }
          : { width: size, height: size }
      }
    >
      {src ? (
        <SiteImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
