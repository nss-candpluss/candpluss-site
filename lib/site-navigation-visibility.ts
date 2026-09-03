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
  snsYoutube: false,
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
