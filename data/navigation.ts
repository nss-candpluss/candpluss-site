export const globalNavigationLinks = [
  { label: "PRODUCTS", href: "/products" },
  { label: "CONCEPT", href: "/concept" },
  { label: "LABO", href: "/labo" },
  { label: "SUPPORT", href: "/support" },
  { label: "MEMBERSHIP", href: "/account" },
] as const;

export const mobilePrimaryNavigationLinks = [
  { label: "HOME", href: "/" },
  ...globalNavigationLinks,
] as const;

export const mobileSecondaryNavigationLinks = [
  { label: "ショッピングガイド", href: "/shopping-guide" },
  { label: "お問い合わせ", href: "/contact" },
  { label: "会社情報", href: "/company" },
  { label: "特定商取引法に基づく表記", href: "/legal/commercial-transactions" },
  { label: "利用規約", href: "/legal/terms" },
  { label: "プライバシーポリシー", href: "/legal/privacy-policy" },
  { label: "Cookieについて", href: "/legal/cookie-policy" },
] as const;

export const headerIconLinks = [
  {
    label: "Search",
    href: "/search",
    iconSrc: "/assets/icons/icon-search.svg",
  },
  {
    label: "User",
    href: "/account/login",
    iconSrc: "/assets/icons/icon-user.svg",
  },
  {
    label: "Cart",
    href: "/cart",
    iconSrc: "/assets/icons/icon-cart.svg",
  },
] as const;

export const headerMenuButton = {
  label: "Open menu",
  iconSrc: "/assets/icons/icon-menu.svg",
} as const;

export const headerMenuCloseButton = {
  label: "Close menu",
  iconSrc: "/assets/icons/icon-close.svg",
} as const;
