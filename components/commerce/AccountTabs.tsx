"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { AccountShallowLink } from "@/components/commerce/AccountShallowLink";
import {
  ACCOUNT_PAGE_TABS,
  accountPageTabHref,
  resolveAccountPageTabId,
  type AccountPageTabId,
} from "@/lib/commerce/account-page";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import { uiText } from "@/lib/typography";

type AccountTabsProps = {
  panels: Record<AccountPageTabId, ReactNode>;
};

/**
 * 開いているタブは URL の `?tab=` で表す。
 *
 * 会員情報は全タブ分をまとめて 1 回で取っているので、タブを移るたびに
 * サーバーへ取りに行く必要がない。中身はすべて描画しておき、ここでは
 * 表示の切り替えだけを行う。
 */
export function AccountTabs({ panels }: AccountTabsProps) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const activeTabId = resolveAccountPageTabId({ search });

  return (
    <div className="mt-[var(--section-title-gap)]">
      <nav aria-label="アカウントメニュー" className="flex justify-center overflow-x-auto">
        <ul className="flex gap-x-[clamp(16px,calc(38px*var(--gap-scale-x)),38px)] pb-[calc(4/14*1em+1px)]">
          {ACCOUNT_PAGE_TABS.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <li key={tab.id} className="shrink-0">
                <AccountShallowLink
                  href={accountPageTabHref(tab.id, search)}
                  aria-current={isActive ? "page" : undefined}
                  className={`whitespace-nowrap transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--foreground)]"
                      : "text-[var(--color-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <HoverUnderlineText
                    variant={isActive ? "active" : "hover"}
                    className={`font-body-ja ${uiText(16)}`}
                  >
                    {tab.label}
                  </HoverUnderlineText>
                </AccountShallowLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-[calc(52px*var(--gap-scale-y))]">
        {ACCOUNT_PAGE_TABS.map((tab) => (
          <div key={tab.id} hidden={tab.id !== activeTabId}>
            {panels[tab.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
