"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/** 数量ステッパー + 削除ボタンが収まる最小幅 */
const CONTENT_MIN_WIDTH_PX = 168;
/**
 * 画像と商品情報が分け合う幅のうち、画像が占めてよい割合の上限。
 *
 * 高さ基準だけだと、行の幅が狭いスマホで画像が横幅の半分近くまで広がる。
 * 幅に余裕がある PC では高さ基準が先に効くため、この上限は働かない。
 */
const MAX_WIDTH_RATIO = 1 / 3;
/** 計測前の初期値。SSR と初回描画で同じ値を使う */
const FALLBACK_SIZE_PX = 96;

/**
 * カートのサムネイルは、隣の商品情報と同じ高さの正方形にする。
 *
 * 行ごとに高さを測ると、バリエーション名の有無や商品名の折り返しで情報量が
 * 変わり、商品ごとに画像の大きさがばらつく。カート内で一番高い行に全行を
 * 合わせることで、行間で大きさを揃える。
 *
 * 行が増減すると観測対象がずれるので、`lineCount` で計測をやり直す。
 */
export function useCartThumbnailSize(lineCount: number) {
  const listRef = useRef<HTMLUListElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    function rowParts(row: Element) {
      const media = row.firstElementChild;
      const content = media?.nextElementSibling;

      return media instanceof HTMLElement && content instanceof HTMLElement
        ? { media, content }
        : null;
    }

    function measure() {
      let tallestContent = 0;
      let narrowestAvailable = Number.POSITIVE_INFINITY;

      for (const row of Array.from(list!.children)) {
        const parts = rowParts(row);

        if (!parts) {
          continue;
        }

        tallestContent = Math.max(tallestContent, parts.content.offsetHeight);

        // 画像が広がれる幅は、画像と商品情報が分け合っている幅が基準。行全体から
        // 引くと、カートページのモバイルのように価格が別の行へ回り込む
        // レイアウトで負の値になり、画像が潰れる。
        const sharedWidth =
          parts.media.offsetWidth + parts.content.offsetWidth;

        narrowestAvailable = Math.min(
          narrowestAvailable,
          sharedWidth - CONTENT_MIN_WIDTH_PX,
          sharedWidth * MAX_WIDTH_RATIO
        );
      }

      const next = Math.round(
        Math.max(0, Math.min(tallestContent, narrowestAvailable))
      );

      setSize((current) => (current === next ? current : next));
    }

    const observer = new ResizeObserver(measure);
    observer.observe(list);

    for (const row of Array.from(list.children)) {
      const parts = rowParts(row);

      if (parts) {
        observer.observe(parts.content);
      }
    }

    measure();

    return () => observer.disconnect();
  }, [lineCount]);

  const thumbnailStyle = {
    "--cart-thumbnail-size": `${size ?? FALLBACK_SIZE_PX}px`,
  } as CSSProperties;

  return { listRef, thumbnailStyle };
}
