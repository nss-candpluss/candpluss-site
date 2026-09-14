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
  headerUser: false,
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
 * 購入を止めている系統ではカートへの入口も出さない。
 * `headerCart` のフラグは 10/2 以降も使うため、ここでは系統だけで判断する。
 */
export function isHeaderIconLinkVisibleInChannel(
  label: string,
  channel: PurchaseChannel
): boolean {
  if (label === "Cart" && !isWebPurchaseEnabled(channel)) {
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
