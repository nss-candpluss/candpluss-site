import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  TEST_AREA_ROOT_PATH,
  channelPath,
  resolvePurchaseChannel,
  showsStatusDisplayOverride,
} from "@/lib/commerce/purchase-channel";
import {
  isHeaderIconLinkVisible,
  isHeaderIconLinkVisibleInChannel,
} from "@/lib/site-navigation-visibility";
import { robotsDisallowPaths } from "@/lib/sitemap";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("resolvePurchaseChannel", () => {
  it("公開ページは public", () => {
    expect(resolvePurchaseChannel("/")).toBe("public");
    expect(resolvePurchaseChannel("/products")).toBe("public");
    expect(resolvePurchaseChannel("/products/moya500")).toBe("public");
    expect(resolvePurchaseChannel("/cart")).toBe("public");
  });

  it("テスト領域は test", () => {
    expect(resolvePurchaseChannel(TEST_AREA_ROOT_PATH)).toBe("test");
    expect(resolvePurchaseChannel("/shopify-test/products")).toBe("test");
    expect(resolvePurchaseChannel("/shopify-test/products/moya500")).toBe("test");
    expect(resolvePurchaseChannel("/shopify-test/cart")).toBe("test");
  });

  // 前方一致だけで判定すると、別ページを誤ってテスト領域扱いしてしまう
  it("先頭が似ているだけのパスは public", () => {
    expect(resolvePurchaseChannel("/shopify-testing")).toBe("public");
    expect(resolvePurchaseChannel("/products/shopify-test")).toBe("public");
  });
});

describe("channelPath", () => {
  it("公開ページはそのまま、テスト領域は領域内に留める", () => {
    expect(channelPath("public", "/products/moya500")).toBe("/products/moya500");
    expect(channelPath("test", "/products/moya500")).toBe(
      "/shopify-test/products/moya500"
    );
    expect(channelPath("test", "/cart")).toBe("/shopify-test/cart");
  });

  it("テスト領域のパスを渡しても二重に付かない結果になる", () => {
    expect(resolvePurchaseChannel(channelPath("test", "/products"))).toBe("test");
  });

  it("`/` 始まりでないパスは弾く", () => {
    expect(() => channelPath("test", "products")).toThrow();
  });
});

describe("発売予定ラベルの出し分け", () => {
  it("公開ページだけに出す", () => {
    expect(showsStatusDisplayOverride("public")).toBe(true);
    expect(showsStatusDisplayOverride("test")).toBe(false);
  });

  it("ラベルと一覧カードが同じ判定を使う", () => {
    expect(readSource("components/products/ProductStatusLabel.tsx")).toContain(
      "useStatusDisplayOverrideHandle"
    );
    expect(readSource("components/products/ProductCard.tsx")).toContain(
      "useStatusDisplayOverrideHandle"
    );
  });
});

describe("テスト領域の保護", () => {
  it("proxy の matcher がテスト領域を覆っている", () => {
    expect(readSource("proxy.ts")).toContain(`"${TEST_AREA_ROOT_PATH}/:path*"`);
  });

  it("Basic 認証は環境変数が未設定の本番で通さない", () => {
    const source = readSource("proxy.ts");

    expect(source).toContain("TEST_AREA_BASIC_USER");
    expect(source).toContain("TEST_AREA_BASIC_PASSWORD");
    expect(source).toContain('process.env.NODE_ENV === "production"');
  });

  it("robots で Disallow にしている", () => {
    expect(robotsDisallowPaths).toContain(TEST_AREA_ROOT_PATH);
  });

  // proxy は output: export で動かない。認証なしのテスト領域が配信される
  it("静的書き出しからテスト領域と proxy を外している", () => {
    const source = readSource("scripts/build-static.mjs");

    expect(source).toContain('"app/shopify-test"');
    expect(source).toContain('"proxy.ts"');
  });

  it("テスト領域は構造化データを出さない", () => {
    expect(readSource("app/shopify-test/products/page.tsx")).not.toContain(
      "JsonLd"
    );
    expect(
      readSource("app/shopify-test/products/[handle]/page.tsx")
    ).not.toContain("JsonLd");
  });
});

describe("カートの画面は 2 系統に分けない", () => {
  it("公開ページとテスト領域が同じコンポーネントを使う", () => {
    expect(readSource("app/cart/page.tsx")).toContain("CartPageContent");
    expect(readSource("app/shopify-test/cart/page.tsx")).toContain(
      "CartPageContent"
    );
  });
});

describe("カートへの入口", () => {
  it("購入を止めている系統ではヘッダーのカートを出さない", () => {
    expect(isHeaderIconLinkVisibleInChannel("Cart", "public")).toBe(false);
    expect(isHeaderIconLinkVisibleInChannel("Cart", "test")).toBe(true);
  });

  // 系統を見るのはカートだけ。他のアイコンは従来のフラグに従う
  it("カート以外の判定は変えない", () => {
    for (const channel of ["public", "test"] as const) {
      expect(isHeaderIconLinkVisibleInChannel("Search", channel)).toBe(
        isHeaderIconLinkVisible("Search")
      );
      expect(isHeaderIconLinkVisibleInChannel("User", channel)).toBe(
        isHeaderIconLinkVisible("User")
      );
    }
  });

  it("ヘッダーが系統込みで判定している", () => {
    const source = readSource("components/layout/Header.tsx");

    expect(source).toContain("isHeaderIconLinkVisibleInChannel(link.label, channel)");
    expect(source).toContain("channelPath(channel, link.href)");
  });

  // アイコンを消すだけでは URL 直打ちで入れてしまう
  it("公開ページの /cart は閉じ、テスト領域は開いたまま", () => {
    const source = readSource("app/cart/layout.tsx");

    expect(source).toContain('isWebPurchaseEnabled("public")');
    expect(source).toContain("notFound()");
    expect(readSource("app/shopify-test/cart/page.tsx")).not.toContain(
      "notFound"
    );
  });
});
