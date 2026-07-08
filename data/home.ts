export const topHeroContent = {
  backgroundImage: "/images/hero/hero-bg.webp",
  foregroundImage: "/images/hero/hero-foreground.webp",
  titleImage: "/images/hero/hero-title.svg",
  titleImageSp: "/images/hero/sp-hero-title.svg",
  titleAlt: "Find your soul. Touch the ground.",
  beginningImage: "/images/hero/our-beginning.webp",
  beginning: {
    label: "OUR BEGINNING",
    titleLine1: "Add new value",
    titleLine2Lead: "to the",
    titleLine2Rest: "camping experience.",
    bodyLines: [
      "C AND+S は、アウトドアを愛する少数のメンバーから生まれました。",
      "ひとりひとり異なるライフスタイルや趣味嗜好。美しくも厳しく変化する日本の四季。",
      "さまざまなスタイルへの調和と厳しい自然環境の中でも安心して使い続けられる品質を求め、",
      "キャンプという体験に、新たな価値を加える。",
      "その想いが、C AND+Sの始まりです。",
    ],
    link: {
      label: "CONCEPT",
      href: "/concept",
    },
  },
} as const;

export const homeFeatureLinks = [
  {
    id: "products",
    title: "ALL PRODUCTS",
    href: "/products",
    image: "/images/home/home-link-products.webp",
  },
  {
    id: "quality",
    title: "QUALITY",
    href: "/quality",
    image: "/images/home/home-link-quality.webp",
  },
] as const;

export const homeProductLinks = [
  {
    id: "moya500",
    title: "MOYA500",
    href: "/products/moya500",
    image: "/images/home/home-link-moya500.webp",
  },
  {
    id: "nokuta",
    title: "NOKUTA",
    href: "/products/nokuta",
    image: "/images/home/home-link-nokuta.webp",
  },
  {
    id: "zigstake",
    title: "ZIG STAKE20",
    href: "/products/zig-stake20",
    image: "/images/home/home-link-zigstake20.webp",
  },
  {
    id: "inner-mesh",
    title: "MOYA500 MESH INNER",
    href: "/products/moya500-mesh-inner-tent",
    image: "/images/home/home-link-inner-mesh.webp",
  },
] as const;

export const homeLabContent = {
  title: "Fukuoka Lab.",
  backgroundImage: "/images/home/home-link-lab.webp",
  link: {
    label: "ABOUT US",
    href: "/company",
  },
} as const;

export const homeSupportContent = {
  heading: "Lifetime Warranty",
  label: "C AND+Sの製品保証",
  body: `長く使い続けられる品質と使い心地を追求する。
その想いは、デザイン、設計、素材の選定などの製品開発からはじまり、製品をご購入いただいた後も同じです。
私たちC AND+Sは、修理や部品交換を通じて、お客様が製品とともに過ごす時間を支え続けます。`,
  image: "/images/home/home-image-support.webp",
  link: {
    label: "SUPPORT",
    href: "/support",
  },
} as const;
