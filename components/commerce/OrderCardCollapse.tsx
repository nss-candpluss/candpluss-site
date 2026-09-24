"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { uiText } from "@/lib/typography";

/** これしか隠れないなら、畳んでも読む手間が増えるだけ */
const COLLAPSE_MIN_HIDDEN_PX = 80;

/** 切れ目をぼかす帯の高さ */
const FADE_HEIGHT_PX = 120;

/**
 * 折りたたんだときに見せる高さを測る。
 *
 * 2 つ目の商品画像が半分見えるところで切ると、まだ続きがあることが伝わる。
 * 商品が 1 点だけの注文でも、2 つ目があったらどこになるかを計算して、
 * 注文どうしで畳んだ高さが揃うようにする。
 */
function previewHeight(content: HTMLElement) {
  const lines = content.querySelectorAll<HTMLElement>("[data-order-line]");
  const firstLine = lines[0];

  if (!firstLine) {
    return null;
  }

  const contentTop = content.getBoundingClientRect().top;
  const image = firstLine.firstElementChild;
  const halfImage =
    (image instanceof HTMLElement ? image.offsetHeight : 0) / 2;
  const secondLine = lines[1];

  if (secondLine) {
    return secondLine.getBoundingClientRect().top - contentTop + halfImage;
  }

  const rowGap = firstLine.parentElement
    ? Number.parseFloat(getComputedStyle(firstLine.parentElement).rowGap) || 0
    : 0;
  const firstRect = firstLine.getBoundingClientRect();

  return firstRect.bottom - contentTop + rowGap + halfImage;
}

/**
 * 注文カードの中身を折りたたむ。
 *
 * 注文 1 件が縦に長いので、既定では畳んでおいて一覧性を優先する。
 */
export function OrderCardCollapse({ children }: { children: ReactNode }) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const measure = () => {
      const height = previewHeight(content);

      setCollapsedHeight(
        height !== null &&
          content.scrollHeight - height >= COLLAPSE_MIN_HIDDEN_PX
          ? Math.round(height)
          : null
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(content);
    measure();

    return () => observer.disconnect();
  }, []);

  const isCollapsed = collapsedHeight !== null && !isOpen;

  return (
    <>
      {/*
        畳んでいる間だけ高さを止める。中身の並びは変えない。
        overflow を持たせることで、中身の上マージンが外に抜けないようにもしている。
      */}
      <div
        className="relative overflow-hidden"
        id={contentId}
        ref={contentRef}
        style={isCollapsed ? { maxHeight: collapsedHeight } : undefined}
      >
        {children}
        {isCollapsed ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_bottom,transparent,#fff)]"
            style={{ height: FADE_HEIGHT_PX }}
          />
        ) : null}
      </div>

      {collapsedHeight === null ? null : (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className={`border-b border-current font-body-ja ${uiText(14)}`}
          >
            {isOpen ? "閉じる" : "すべて表示"}
          </button>
        </div>
      )}
    </>
  );
}
