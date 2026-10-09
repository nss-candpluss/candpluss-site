import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  ACCOUNT_SESSION_REFRESH_PATH,
  accountSessionRefreshHref,
  loginHintFromEmail,
  resolveCustomerAccountCallbackUrl,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";
import { isPublicSiteOpen } from "@/lib/commerce/purchase-channel";

describe("会員画面の置き場所", () => {
  // 公開ページの購入を止めている間はテスト領域だけに置く
  it("公開ページが閉じている間はテスト領域、開いたら /account を指す", () => {
    const base = isPublicSiteOpen() ? "/account" : "/shopify-test/account";

    expect(ACCOUNT_BASE_PATH).toBe(base);
    expect(ACCOUNT_LOGIN_PATH).toBe(`${base}/login`);
  });
});

describe("safeAccountReturnTo", () => {
  it("allows same-origin relative paths", () => {
    expect(safeAccountReturnTo("/shopify-test/cart")).toBe("/shopify-test/cart");
  });

  it("rejects protocol-relative and missing values", () => {
    expect(safeAccountReturnTo("//evil.example")).toBe(ACCOUNT_BASE_PATH);
    expect(safeAccountReturnTo("https://evil.example")).toBe(ACCOUNT_BASE_PATH);
    expect(safeAccountReturnTo(undefined)).toBe(ACCOUNT_BASE_PATH);
  });
});

describe("loginHintFromEmail", () => {
  it("returns a trimmed email", () => {
    expect(loginHintFromEmail("  member@example.com  ")).toBe(
      "member@example.com"
    );
  });

  it("ignores invalid values", () => {
    expect(loginHintFromEmail("not-an-email")).toBeUndefined();
    expect(loginHintFromEmail("")).toBeUndefined();
  });
});

describe("resolveCustomerAccountCallbackUrl", () => {
  const productionCallback = "https://candpluss.camp/account/authorize";

  it("keeps the production callback on the public origin", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "https://candpluss.camp/account/login/start"
      )
    ).toBe(productionCallback);
  });

  it("returns to localhost so local login cookies stay on the same origin", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "http://localhost:3000/shopify-test/account"
      )
    ).toBe("http://localhost:3000/account/authorize");
  });

  it("returns to the ngrok origin so tunnel login can complete", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "https://mosaic-lubricate-salute.ngrok-free.dev/shopify-test/account"
      )
    ).toBe(
      "https://mosaic-lubricate-salute.ngrok-free.dev/account/authorize"
    );
  });

  it("prefers forwarded host when ngrok keeps request.url on localhost", () => {
    expect(
      resolveCustomerAccountCallbackUrl(
        productionCallback,
        "http://localhost:3000/account/login/start",
        new Headers({
          "x-forwarded-host": "mosaic-lubricate-salute.ngrok-free.dev",
          "x-forwarded-proto": "https",
        })
      )
    ).toBe(
      "https://mosaic-lubricate-salute.ngrok-free.dev/account/authorize"
    );
  });
});

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

/*
  アクセストークンは短時間で切れるが、Cookie は 30 日残る。
  期限切れの扱いがページごとに食い違うと、会員画面とログインページが
  送り合って ERR_TOO_MANY_REDIRECTS になる。
*/
describe("期限切れのログイン状態", () => {
  it("ログインページは期限内のときだけ会員画面へ戻す", () => {
    const source = readSource("components/commerce/AccountLoginContent.tsx");

    expect(source).toContain("getLiveCustomerTokenSession()");
    expect(source).not.toContain("getCustomerTokenSession()");
  });

  it("会員画面と領収書は、更新できるなら更新のルートへ送る", () => {
    for (const path of [
      "components/commerce/AccountPageContent.tsx",
      "components/commerce/AccountReceiptContent.tsx",
    ]) {
      const source = readSource(path);

      expect(source).toContain("hasRefreshableCustomerTokenSession()");
      expect(source).toContain("accountSessionRefreshHref(");
    }
  });

  it("更新できなければ Cookie を消してからログインページへ送る", () => {
    const source = readSource("app/account/refresh/route.ts");

    expect(source.indexOf("clearCustomerTokenSession()")).toBeGreaterThan(-1);
    expect(source.indexOf("clearCustomerTokenSession()")).toBeLessThan(
      source.indexOf("new URL(ACCOUNT_LOGIN_PATH, origin)")
    );
  });

  it("更新のあとの戻り先は同じオリジンに限る", () => {
    const source = readSource("app/account/refresh/route.ts");

    expect(source).toContain("safeAccountReturnTo(");
    expect(source).toContain("requested.origin === new URL(origin).origin");
  });

  it("戻り先はクエリごと渡す", () => {
    expect(accountSessionRefreshHref("/account/receipt?order=a%2Fb")).toBe(
      `${ACCOUNT_SESSION_REFRESH_PATH}?returnTo=${encodeURIComponent(
        "/account/receipt?order=a%2Fb"
      )}`
    );
    expect(ACCOUNT_SESSION_REFRESH_PATH).toBe("/account/refresh");
  });
});

describe("ログアウトと id_token", () => {
  // Shopify のログアウトは id_token_hint が必須。欠けるとエラー画面で止まる
  it("トークン更新で id_token を失わない", () => {
    const source = readSource("lib/shopify/customer-session.ts");

    expect(source).toContain("idToken: refreshed.idToken ?? session.idToken");
    expect(source).toContain(
      "refreshToken: refreshed.refreshToken ?? session.refreshToken"
    );
    // 更新する場所ごとに引き継ぎを書くと、どこかで漏れる
    for (const path of [
      "app/api/shopify/customer/route.ts",
      "app/account/refresh/route.ts",
    ]) {
      const routeSource = readSource(path);
      expect(routeSource).toContain("refreshCustomerTokenSession(session)");
      expect(routeSource).not.toContain("refreshCustomerToken(");
    }
  });

  it("ログアウト後は会員ログインページへ戻す", () => {
    const source = readSource("app/account/logout/route.ts");

    expect(source).toContain("new URL(ACCOUNT_LOGIN_PATH, origin)");
    expect(source).toContain("loginUrl.toString()");
    expect(source).not.toContain('new URL("/", origin)');
  });

  it("id_token が無いときは Shopify へ送らずログインページへ戻す", () => {
    const source = readSource("app/account/logout/route.ts");

    expect(source).toContain("if (!session?.idToken)");
    expect(source.indexOf("if (!session?.idToken)")).toBeLessThan(
      source.indexOf("getCustomerLogoutUrl(")
    );
  });
});
