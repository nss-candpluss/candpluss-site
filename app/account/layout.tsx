import { notFound } from "next/navigation";

import { isAccountEnabled } from "@/lib/commerce/account-login";

/**
 * 会員機能をリリースするまで公開ページの会員画面は閉じる。ヘッダーのアイコンを
 * 消すだけでは URL 直打ちや履歴から入れてしまう。
 *
 * テスト領域の `/shopify-test/account` は別ルートなので開いたまま。OAuth の
 * ルートハンドラ（`authorize` / `login/start` / `logout`）はレイアウトを
 * 通らないため、閉じている間も Shopify のコールバックを受けられる。
 */
const isPublicAccountOpen = isAccountEnabled("public");

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isPublicAccountOpen) {
    notFound();
  }

  return children;
}
