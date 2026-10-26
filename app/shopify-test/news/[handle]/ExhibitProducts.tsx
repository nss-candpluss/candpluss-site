"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ProductGalleryControls } from "@/components/products/ProductGalleryControls";
import { SiteImage } from "@/components/ui/SiteImage";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import type { TestNewsProductItem } from "@/data/news-test";
import { arrowMaskStyle } from "@/lib/maskStyle";
import {
  startBoundLenis,
  stopBoundLenis,
} from "@/lib/motion/setup-lenis-scroll-trigger";
import { bodyText, uiText, uiTextRange } from "@/lib/typography";

/** 「初公開」「参考出展」で幅を揃えるため、4 文字が収まる固定幅にする */
const productTagBaseClassName =
  "inline-flex h-[1.5em] w-[5.25em] shrink-0 items-center justify-center rounded-[3px] border border-[var(--color-new)] font-body-ja font-normal !text-[clamp(11px,calc(12px*var(--text-scale)),12px)] !leading-none";

const productTagVariantClassName = {
  初公開: "text-[var(--color-new)]",
  参考出展: "bg-[var(--color-new)] text-white",
} as const satisfies Record<NonNullable<TestNewsProductItem["tag"]>, string>;

const focusRingClassName =
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

function ProductGallery({ images, name }: { images: readonly string[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (nextIndex: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const wrapped = (nextIndex + images.length) % images.length;
      track.scrollTo({ left: wrapped * track.clientWidth, behavior: "smooth" });
    },
    [images.length]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goTo(index - 1);
      }

      if (event.key === "ArrowRight") {
        goTo(index + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, index]);

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            setIndex(Math.round(track.scrollLeft / track.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, imageIndex) => (
            <div
              key={`${src}-${imageIndex}`}
              className="relative aspect-video w-full shrink-0 snap-center bg-[var(--color-line)]"
            >
              <SiteImage
                src={src}
                alt={`${name} ${imageIndex + 1}枚目`}
                fill
                sizes="(min-width: 800px) 720px, 100vw"
                priority={imageIndex === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <ProductGalleryControls
          hasImages={images.length > 1}
          onPrevious={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
        />

        <p
          aria-live="polite"
          className={`pointer-events-none absolute right-[12px] bottom-[12px] bg-black/70 px-[8px] py-[4px] font-ui-en text-white ${uiText(13)}`}
        >
          {index + 1} / {images.length}
        </p>
      </div>

      {/* 商品ページのサムネイルと同じく、画像 70px + 枠までの余白 4px で、選択中だけ枠線を出す */}
      <ul
        aria-label="画像サムネイル"
        className="mt-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)] flex list-none gap-[2px] leading-none"
      >
        {images.map((src, imageIndex) => {
          const isSelected = imageIndex === index;

          return (
            <li
              key={`${src}-${imageIndex}`}
              className="aspect-square w-[min(78px,calc((100%-8px)/5))] shrink-0"
            >
              <button
                type="button"
                aria-label={`${imageIndex + 1}枚目の画像を表示`}
                aria-pressed={isSelected}
                onClick={() => goTo(imageIndex)}
                className={`relative block size-full overflow-hidden ${focusRingClassName}`}
              >
                <span className="absolute inset-[4px] block overflow-hidden bg-[var(--color-line)]">
                  <SiteImage
                    src={src}
                    alt=""
                    fill
                    sizes="70px"
                    className="pointer-events-none object-cover"
                  />
                </span>
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 border border-black"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductDialog({
  item,
  onClose,
}: {
  item: TestNewsProductItem;
  onClose: () => void;
}) {
  const titleId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    stopBoundLenis();
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Lenis が止まっていても、背景の wheel / touchmove は既定動作でスクロールするため止める
    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      const scroller = scrollerRef.current;
      if (scroller && event.target instanceof Node && scroller.contains(event.target)) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      startBoundLenis();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", preventBackgroundScroll);
      window.removeEventListener("touchmove", preventBackgroundScroll);
      previousFocus?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-[max(16px,env(safe-area-inset-top))]">
      <button
        type="button"
        aria-label="閉じる"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full w-full max-w-[800px] flex-col overflow-hidden rounded-[16px] bg-white text-[var(--foreground)] shadow-[0_8px_32px_rgba(25,25,25,0.14)]"
      >
        {/*
          data-lenis-prevent: Lenis は window の wheel / touchmove を preventDefault するため、
          付けないとポップアップ内がスクロールできない。
        */}
        <div
          ref={scrollerRef}
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-[clamp(16px,calc(40px*var(--layout-scale-x)),40px)] pt-[72px] pb-[clamp(32px,calc(48px*var(--gap-scale-y)),48px)]"
        >
          <ProductGallery images={item.gallery} name={item.name} />

          <h2
            id={titleId}
            className={`mt-[clamp(32px,calc(48px*var(--gap-scale-y)),48px)] font-body-ja font-semibold ${uiText(24)}`}
          >
            {item.name}
          </h2>
          <p
            className={`mt-[clamp(20px,calc(32px*var(--gap-scale-y)),32px)] font-body-ja font-semibold ${uiText(15)}`}
          >
            {item.catchcopy}
          </p>
          <p
            className={`mt-[clamp(10px,calc(14px*var(--gap-scale-y)),14px)] font-body-ja ${bodyText(14)}`}
          >
            {item.description}
          </p>
          {item.href ? (
            <Link
              href={item.href}
              className={`group mt-[clamp(24px,calc(36px*var(--gap-scale-y)),36px)] inline-flex items-center gap-x-[calc(8px*var(--gap-scale-x))] font-ui-en font-semibold ${uiText(15)}`}
            >
              {/* TextLink（文字 18px / 矢印 24px）と同じ比率で、文字サイズに追従させる */}
              <span
                aria-hidden="true"
                className="size-[calc(4/3*1em)] shrink-0 bg-current"
                style={arrowMaskStyle}
              />
              <HoverUnderlineText variant="groupHover">商品詳細ページへ</HoverUnderlineText>
            </Link>
          ) : null}
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className={`absolute top-[16px] right-[16px] z-10 flex size-[40px] items-center justify-center rounded-full border border-[#ccc] bg-white [-webkit-tap-highlight-color:transparent] ${focusRingClassName}`}
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" className="size-[12px]">
            <path d="M1 1L11 11M11 1L1 11" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

export function ExhibitProducts({ items }: { items: readonly TestNewsProductItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeDialog = useCallback(() => setOpenIndex(null), []);
  const openItem = openIndex === null ? null : items[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-[max(8px,calc(10px*var(--gap-scale-x)))] gap-y-[clamp(28px,calc(40px*var(--gap-scale-y)),40px)] min-[768px]:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.name}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setOpenIndex(index)}
              className={`group block w-full cursor-pointer text-left ${focusRingClassName}`}
            >
              <span className="relative block aspect-[6/5] overflow-hidden bg-[var(--color-line)]">
                {item.image ? (
                  <SiteImage
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 980px) 320px, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                ) : null}
              </span>
              <span
                className={`mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] block font-body-ja text-[var(--color-muted)] ${uiText(12)}`}
              >
                {item.category}
              </span>
              <span
                className={`mt-[clamp(6px,calc(8px*var(--gap-scale-y)),8px)] flex flex-wrap items-center gap-x-[calc(10px*var(--gap-scale-x))] gap-y-[6px] font-body-ja font-semibold text-[var(--foreground)] ${uiTextRange("14-16")}`}
              >
                {item.tag ? (
                  <span
                    className={`${productTagBaseClassName} ${productTagVariantClassName[item.tag]}`}
                  >
                    {item.tag}
                  </span>
                ) : null}
                <span>{item.name}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openItem ? <ProductDialog item={openItem} onClose={closeDialog} /> : null}
    </>
  );
}
