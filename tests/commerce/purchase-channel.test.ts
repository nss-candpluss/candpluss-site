import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { headerIconLinks } from "@/data/navigation";
import {
  ACCOUNT_BASE_PATH,
  isAccountEnabled,
} from "@/lib/commerce/account-login";
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

describe("カートページはテスト領域だけに置く", () => {
  it("公開ページ側の /cart は持たない", () => {
    expect(existsSync(join(rootDir, "app/cart"))).toBe(false);
  });

  it("テスト領域の確認用ページは残す", () => {
    expect(readSource("app/shopify-test/cart/page.tsx")).toContain(
      "CartPageContent"
    );
  });
});

describe("会員画面はリリースまでテスト領域だけで開く", () => {
  // アイコンを消すだけでは URL 直打ちで入れてしまう
  it("公開ページ側は閉じている", () => {
    const source = readSource("app/account/layout.tsx");

    expect(source).toContain('isAccountEnabled("public")');
    expect(source).toContain("notFound()");
  });

  // コールバック URL は Shopify 側の設定と固定で紐づくので消せない。
  // ルートハンドラはレイアウトを通らないので、閉じている間も動く。
  it("OAuth のエンドポイントは /account 配下に残す", () => {
    for (const path of [
      "app/account/authorize/route.ts",
      "app/account/login/start/route.ts",
      "app/account/logout/route.ts",
    ]) {
      expect(existsSync(join(rootDir, path))).toBe(true);
    }
  });

  // 会員は購入の再開とは別タイミングで先行リリースする
  it("会員画面の置き場所は会員のフラグだけで決まる", () => {
    expect(ACCOUNT_BASE_PATH).toBe(
      isAccountEnabled("public") ? "/account" : `${TEST_AREA_ROOT_PATH}/account`
    );
    expect(isAccountEnabled("test")).toBe(true);
  });

  it("公開ページとテスト領域が同じコンポーネントを使う", () => {
    expect(readSource("app/account/page.tsx")).toContain("AccountPageContent");
    expect(readSource("app/shopify-test/account/page.tsx")).toContain(
      "AccountPageContent"
    );
    expect(readSource("app/account/login/page.tsx")).toContain(
      "AccountLoginContent"
    );
    expect(readSource("app/shopify-test/account/login/page.tsx")).toContain(
      "AccountLoginContent"
    );
  });

  // Shopify のサインイン画面は置き換えられず、メールもそちらで入力する。
  // 自前の案内ページを挟むと同じ入力を二度させることになる。
  it("未ログインは案内ページを挟まず Shopify へ直接送る", () => {
    expect(
      readSource("components/commerce/AccountPageContent.tsx")
    ).toContain("redirect(ACCOUNT_LOGIN_START_PATH)");
  });

  // クライアントのログイン判定を待つと、読み込み直後に押したとき
  // ログイン済みでも Shopify を経由して戻る遠回りになる
  it("ユーザーアイコンの行き先はログイン状態によらずマイページ", () => {
    const source = readSource("components/layout/Header.tsx");

    expect(source).toContain("href={ACCOUNT_BASE_PATH}");
    expect(source).not.toContain("useCustomer");
    // 判定のためだけに毎回サーバーへ行かせない
    expect(source).toContain("prefetch={false}");
  });

  // 領収書も公開側とテスト領域で同じものを使う
  it("領収書は両系統にあり、同じコンポーネントを使う", () => {
    expect(readSource("app/account/receipt/page.tsx")).toContain(
      "AccountReceiptContent"
    );
    expect(
      readSource("app/shopify-test/account/receipt/page.tsx")
    ).toContain("AccountReceiptContent");
  });

  it("テスト領域の会員画面は閉じない", () => {
    expect(
      existsSync(join(rootDir, "app/shopify-test/account/layout.tsx"))
    ).toBe(false);
  });

  // 行き先を直書きすると、公開再開時に戻し漏れる
  it("会員画面への行き先は ACCOUNT_BASE_PATH に寄せる", () => {
    for (const path of [
      "app/account/authorize/route.ts",
      "app/account/login/start/route.ts",
      "app/api/shopify/customer/profile/route.ts",
      "app/api/shopify/customer/address/route.ts",
      "components/layout/Header.tsx",
    ]) {
      const source = readSource(path);

      expect(source).toContain("@/lib/commerce/account-login");
      expect(source).not.toMatch(/["'`]\/account(\/login)?["'?]/);
    }
  });
});

describe("カートと会員への入口", () => {
  it("購入を止めている系統ではヘッダーのカートを出さない", () => {
    expect(isHeaderIconLinkVisibleInChannel("Cart", "public")).toBe(false);
    expect(isHeaderIconLinkVisibleInChannel("Cart", "test")).toBe(true);
  });

  // 会員は購入とは別のフラグで開くので、カートとは独立して判定する
  it("ヘッダーのユーザーアイコンは会員フラグに従う", () => {
    expect(isHeaderIconLinkVisibleInChannel("User", "public")).toBe(
      isAccountEnabled("public")
    );
    expect(isHeaderIconLinkVisibleInChannel("User", "test")).toBe(true);
  });

  // 系統を見るのはカートと会員だけ。他のアイコンは従来のフラグに従う
  it("カートと会員以外の判定は変えない", () => {
    for (const channel of ["public", "test"] as const) {
      expect(isHeaderIconLinkVisibleInChannel("Search", channel)).toBe(
        isHeaderIconLinkVisible("Search")
      );
    }
  });

  it("ヘッダーが系統込みで判定している", () => {
    const source = readSource("components/layout/Header.tsx");

    expect(source).toContain("isHeaderIconLinkVisibleInChannel(link.label, channel)");
  });

  // 遷移先を持たせると ⌘クリックや新しいタブで存在しないページに飛べてしまう
  it("ヘッダーのカートはリンクではなくポップアップを開くボタン", () => {
    expect(headerIconLinks.some((link) => link.label === "Cart")).toBe(true);
    expect(
      headerIconLinks.some((link) => link.label === "Cart" && "href" in link)
    ).toBe(false);
    expect(readSource("components/layout/Header.tsx")).toContain(
      'aria-haspopup="dialog"'
    );
  });
});
