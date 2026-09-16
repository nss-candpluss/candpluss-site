import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cartLineTitleClassName } from "@/lib/typography";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("カートのサムネイル", () => {
  // 行ごとに測ると、バリエーション名の有無や商品名の折り返しで大きさがばらつく
  it("カート内で一番高い行に全行を合わせる", () => {
    const source = readSource("components/commerce/use-cart-thumbnail-size.ts");

    expect(source).toContain("tallestContent = Math.max(");
    expect(source).toContain("narrowestAvailable = Math.min(");
    expect(source).toContain("--cart-thumbnail-size");
  });

  // 高さ基準だけだと、行の幅が狭いスマホで画像が横幅の半分近くを占める
  it("画像が分け合う幅の 1/3 を超えないようにする", () => {
    const source = readSource("components/commerce/use-cart-thumbnail-size.ts");

    expect(source).toContain("MAX_WIDTH_RATIO = 1 / 3");
    expect(source).toContain("sharedWidth * MAX_WIDTH_RATIO");
  });

  it("サムネイル自身は大きさを持たず CSS 変数を参照する", () => {
    const source = readSource("components/commerce/CartLineThumbnail.tsx");

    expect(source).toContain("size-[var(--cart-thumbnail-size)]");
    expect(source).not.toContain("ResizeObserver");
  });

  // 片方だけ変数を配り忘れるとサムネイルが消える
  it("ポップアップとカートページの両方がリストに大きさを配る", () => {
    for (const path of [
      "components/commerce/CartDialog.tsx",
      "components/commerce/CartPageContent.tsx",
    ]) {
      const source = readSource(path);

      expect(source).toContain("useCartThumbnailSize");
      expect(source).toContain("ref={thumbnailListRef}");
      expect(source).toContain("style={thumbnailStyle}");
    }
  });
});

describe("カートの商品名", () => {
  // 商品名は 2 行に折り返すため、UI テキストの font-size = line-height だと詰まる
  it("行間を font-size より広く取る", () => {
    expect(cartLineTitleClassName).toContain(
      "leading-[clamp(21px,calc(24px*var(--text-scale)),24px)]"
    );
  });

  it("ポップアップとカートページで同じ指定を使う", () => {
    for (const path of [
      "components/commerce/CartDialog.tsx",
      "components/commerce/CartPageContent.tsx",
    ]) {
      expect(readSource(path)).toContain("cartLineTitleClassName");
    }
  });
});
