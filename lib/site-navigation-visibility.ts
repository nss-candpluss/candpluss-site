import { isAccountEnabled } from "@/lib/commerce/account-login";
import {
  isWebPurchaseEnabled,
  type PurchaseChannel,
} from "@/lib/commerce/purchase-channel";

/**
 * ヘッダー / フッターのリンク表示制御。
 * 非公開項目は false のまま。復活時は true に戻す。
 */
export const siteNavigationVisibility = {
  membership: false,
  headerSearch: false,
  headerUser: true,
  headerCart: true,
  contact: true,
  snsFacebook: false,
  snsX: false,
  snsYoutube: true,
  snsPinterest: false,
} as const;

export function isMembershipLinkVisible(): boolean {
  return siteNavigationVisibility.membership;
}

export function isHeaderIconLinkVisible(label: string): boolean {
  switch (label) {
    case "Search":
      return siteNavigationVisibility.headerSearch;
    case "User":
      return siteNavigationVisibility.headerUser;
    case "Cart":
      return siteNavigationVisibility.headerCart;
    default:
      return true;
  }
}

/**
 * 閉じている系統では入口も出さない。出すと行き先が 404 になる。
 *
 * カートは購入の再開（`PUBLIC_WEB_PURCHASE_ENABLED`）、会員は先行リリース
 * （`PUBLIC_ACCOUNT_ENABLED`）と、開くタイミングが別なので判定も分ける。
 * `headerCart` / `headerUser` のフラグは公開後も使うため、ここでは系統だけを見る。
 */
export function isHeaderIconLinkVisibleInChannel(
  label: string,
  channel: PurchaseChannel
): boolean {
  if (label === "Cart" && !isWebPurchaseEnabled(channel)) {
    return false;
  }

  if (label === "User" && !isAccountEnabled(channel)) {
    return false;
  }

  return isHeaderIconLinkVisible(label);
}

export function isContactLinkVisible(): boolean {
  return siteNavigationVisibility.contact;
}

export function isSocialLinkVisible(label: string): boolean {
  switch (label) {
    case "Facebook":
      return siteNavigationVisibility.snsFacebook;
    case "X":
      return siteNavigationVisibility.snsX;
    case "YouTube":
      return siteNavigationVisibility.snsYoutube;
    case "Pinterest":
      return siteNavigationVisibility.snsPinterest;
    default:
      return true;
  }
}
