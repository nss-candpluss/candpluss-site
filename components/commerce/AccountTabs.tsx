import Link from "next/link";
import type { ReactNode } from "react";

import {
  ACCOUNT_PAGE_TABS,
  accountPageTabHref,
  type AccountPageTabId,
} from "@/lib/commerce/account-page";
import { HoverUnderlineText } from "@/components/ui/TextLink";
import { uiText } from "@/lib/typography";

type AccountTabsProps = {
  activeTabId: AccountPageTabId;
  search: string;
  children: ReactNode;
};

/** クリックで `?tab=` を付けてサーバー側で中身を切り替える */
export function AccountTabs({
  activeTabId,
  search,
  children,
}: AccountTabsProps) {
  return (
    <div className="mt-[var(--section-title-gap)]">
      <nav aria-label="アカウントメニュー" className="flex justify-center overflow-x-auto">
        <ul className="flex gap-x-[clamp(16px,calc(38px*var(--gap-scale-x)),38px)] pb-[calc(4/14*1em+1px)]">
          {ACCOUNT_PAGE_TABS.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <li key={tab.id} className="shrink-0">
                <Link
                  href={accountPageTabHref(tab.id, search)}
                  scroll={false}
                  prefetch={false}
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
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-[calc(52px*var(--gap-scale-y))]">{children}</div>
    </div>
  );
}
