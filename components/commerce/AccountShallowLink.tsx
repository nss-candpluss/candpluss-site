"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { shouldHandleAccountShallowClick } from "@/lib/commerce/account-page";

type AccountShallowLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/**
 * 会員ページの中だけで表示を切り替えるリンク。
 *
 * URL は書き換えるがサーバーへは取りに行かない。JavaScript が動く前や、
 * 新しいタブで開く操作では通常のリンクとして遷移するので、リンクとしての
 * 振る舞いは保たれる。
 */
export function AccountShallowLink({
  href,
  onClick,
  ...props
}: AccountShallowLinkProps) {
  return (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (!shouldHandleAccountShallowClick(event)) {
          return;
        }

        event.preventDefault();
        window.history.pushState(null, "", href);
      }}
      {...props}
    />
  );
}
