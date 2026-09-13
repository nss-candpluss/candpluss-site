import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const source = readFileSync(
  join(rootDir, "components/products/product-detail/ProductDetailView.tsx"),
  "utf8"
);

describe("商品詳細のカラーと URL の同期", () => {
  it("URL の ?color= を読んで初期カラーに反映する", () => {
    expect(source).toContain('get("color")');
    expect(source).toContain("resolveProductVariantId(product, variantIdFromUrl)");
  });

  // 選択したカラーのまま URL を共有・ブックマークできるようにする
  it("カラー変更時に ?color= を書き戻す", () => {
    expect(source).toContain("syncVariantIdToUrl(variantId)");
    expect(source).toContain('url.searchParams.set("color", variantId)');
  });

  // 色クリックごとに履歴が増えて戻るボタンが使いづらくなるのを避ける
  it("履歴を増やさないよう replaceState を使う", () => {
    expect(source).toContain("window.history.replaceState");
    expect(source).not.toContain("pushState");
  });

  // 単一バリアント商品に ?color=default-title が付かないようにする
  it("選択肢がない商品では ?color= を付けない", () => {
    expect(source).toContain("isPlaceholderProductVariantId(variantId)");
    expect(source).toContain('url.searchParams.delete("color")');
  });

  // basePath や他のクエリ・ハッシュを壊さない
  it("現在の URL を基点に書き換える", () => {
    expect(source).toContain("new URL(window.location.href)");
    expect(source).toContain("${url.pathname}${url.search}${url.hash}");
  });
});
