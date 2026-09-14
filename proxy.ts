import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

/**
 * Shopify 購入テスト用の領域（`/shopify-test`）を Basic 認証で閉じる。
 *
 * matcher はビルド時に静的解析されるため定数を書く必要がある。
 * `TEST_AREA_ROOT_PATH` との一致は `tests/commerce/purchase-channel.test.ts`
 * で担保する。
 */
export const config = {
  matcher: "/shopify-test/:path*",
};

const WWW_AUTHENTICATE = 'Basic realm="Shopify test", charset="UTF-8"';

function equalsInConstantTime(input: string, expected: string): boolean {
  const inputBytes = Buffer.from(input);
  const expectedBytes = Buffer.from(expected);

  return (
    inputBytes.length === expectedBytes.length &&
    timingSafeEqual(inputBytes, expectedBytes)
  );
}

function isAuthorized(
  request: NextRequest,
  user: string,
  password: string
): boolean {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Basic ")) {
    return false;
  }

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString(
    "utf8"
  );
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    return false;
  }

  return (
    equalsInConstantTime(decoded.slice(0, separatorIndex), user) &&
    equalsInConstantTime(decoded.slice(separatorIndex + 1), password)
  );
}

export function proxy(request: NextRequest) {
  const user = process.env.TEST_AREA_BASIC_USER;
  const password = process.env.TEST_AREA_BASIC_PASSWORD;

  /**
   * 環境変数の設定漏れでテスト領域が誰でも見える状態になるのを防ぐ。
   * ローカル開発では設定なしで通す。
   */
  if (!user || !password) {
    return process.env.NODE_ENV === "production"
      ? new NextResponse("Not Found", { status: 404 })
      : NextResponse.next();
  }

  if (isAuthorized(request, user, password)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": WWW_AUTHENTICATE },
  });
}
