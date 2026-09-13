import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const source = readFileSync(
  join(rootDir, "components/products/product-detail/ProductDetailView.tsx"),
  "utf8"
);

describe("商品詳細のバリアントと URL の同期", () => {
  // クエリ名は Shopify のオプション名から決める（Color → color / Size → size）
  it("クエリ名をハードコードせず Shopify のオプション名から導く", () => {
    expect(source).toContain("getProductVariantParamName(product)");
    expect(source).not.toContain('get("color")');
    expect(source).not.toContain('searchParams.set("color"');
  });

  it("URL のバリアント指定を読んで初期選択に反映する", () => {
    expect(source).toContain("get(\n      variantParamName\n    )");
    expect(source).toContain("resolveProductVariantId(product, variantIdFromUrl)");
  });

  // 選択した状態のまま URL を共有・ブックマークできるようにする
  it("バリアント変更時にクエリを書き戻す", () => {
    expect(source).toContain("syncVariantIdToUrl(variantParamName, variantId)");
    expect(source).toContain("url.searchParams.set(paramName, variantId)");
  });

  // 色クリックごとに履歴が増えて戻るボタンが使いづらくなるのを避ける
  it("履歴を増やさないよう replaceState を使う", () => {
    expect(source).toContain("window.history.replaceState");
    expect(source).not.toContain("pushState");
  });

  // 単一バリアント商品に ?color=default-title が付かないようにする
  it("選択肢がない商品ではクエリを付けない", () => {
    expect(source).toContain("isPlaceholderProductVariantId(variantId)");
    expect(source).toContain("url.searchParams.delete(paramName)");
  });

  // basePath や他のクエリ・ハッシュを壊さない
  it("現在の URL を基点に書き換える", () => {
    expect(source).toContain("new URL(window.location.href)");
    expect(source).toContain("${url.pathname}${url.search}${url.hash}");
  });
});
