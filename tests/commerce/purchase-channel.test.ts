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

  /*
    Shopify のサインイン画面は新規と既存が一体で、こちらからは
    どちらなのか分からない。はじめての方にだけ規約を読んでもらうには、
    その手前に自前の入口を挟むしかない。
  */
  it("未ログインは入口のページを挟んでから Shopify へ送る", () => {
    expect(readSource("components/commerce/AccountPageContent.tsx")).toContain(
      "redirect(ACCOUNT_LOGIN_PATH)"
    );
    expect(
      readSource("components/commerce/AccountReceiptContent.tsx")
    ).toContain("redirect(ACCOUNT_LOGIN_PATH)");
  });

  /*
    ログイン状態はサーバーで見るので、押してから中身が決まるまで間がある。
    その間フッターが繰り上がると、画面が一度潰れて見える。
  */
  it("会員まわりは待っている間も画面の高さを保つ", () => {
    /*
      どのページも `main` をひとつ持つので、無い間だけ高さを取る。
      `:empty` では見分けられない。React の目印が常に残っていて空にならない。

      `loading.tsx` は置かない。これ自体で足りるうえ、
      あれを置くと Suspense の境目ができて、隠れたページの写しが
      DOM に残る（`h1`・`main`・フォームが二重になる）。
    */
    expect(readSource("app/layout.tsx")).toContain("not-has-[main]:min-h-svh");
  });

  it("入口では道を分け、はじめての方だけ規約を読ませてから進める", () => {
    const source = readSource("components/commerce/AccountLoginContent.tsx");
    const gateSource = readSource("components/commerce/AccountConsentGate.tsx");

    // 登録済みの方はそのまま Shopify へ。規約で足止めしない
    expect(source).toContain("登録済みの方");
    expect(source).toContain("はじめての方");
    expect(source).toContain('action="/account/login/start"');
    // 会員登録の規定は利用規約の中にあるので、読ませるのはこの 2 つ
    expect(source).toContain("termsContent");
    expect(source).toContain("privacyPolicyContent");
    // ログイン済みならこの入口は素通りさせる
    expect(source).toContain("redirect(returnTo)");

    /*
      読み終わるまでチェックできず、チェックするまで進めない。
      読まずに通り抜ける道を作らない。
    */
    expect(gateSource).toContain("disabled={!canAgree}");
    expect(gateSource).toContain("disabled={!hasAgreed}");
    expect(gateSource).toContain("onScroll");
    // 枠より中身が短いときに読み終われなくなるので、その場でも見る
    expect(gateSource).toContain("SCROLL_END_TOLERANCE");
    // キーボードだけでも枠を送れるようにする
    expect(gateSource).toContain("tabIndex={0}");
    /*
      慣性スクロールはページ全体の wheel を受け取って打ち消す。
      渡さないようにしないと枠の中が動かず、読み終われない＝同意できない。
      効くのは PC 幅だけなので、スマホでは症状が出ない。
    */
    expect(gateSource).toContain("data-lenis-prevent");
    // 見張れない環境で締め出さない
    expect(gateSource).toContain("<noscript>");
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
