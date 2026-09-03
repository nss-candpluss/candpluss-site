export const topHeroContent = {
  backgroundImage: "/images/hero/hero-bg.webp",
  foregroundImage: "/images/hero/hero-foreground.webp",
  titleImage: "/images/hero/hero-title.svg",
  titleImageSp: "/images/hero/sp-hero-title.svg",
  titleAlt: "Find your soul. Touch the ground.",
  beginning: {
    title: "Camp + Something.",
    bodyLines: [
      "キャンプと、大切なものをつなぐ。",
      "C AND+Sは、道具と空間を通して、人それぞれの大切な“Something”とキャンプをつなぎます。",
      "自然の中で過ごす時間を、もっと心地よく、美しく、自由に。",
      "What’s Your + S ?",
    ],
    link: {
      label: "CONCEPT",
      href: "/concept",
    },
  },
} as const;

const MAIN_PRODUCT_DUMMY_IMAGE = "/images/products/_shared/placeholder.webp";

export const homeMainProducts = {
  title: "Main Products",
  items: [
    {
      id: "moya500",
      title: "MOYA500",
      caption: "THE GRAND DOME SHELTER.",
      href: "/products/moya500",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
    {
      id: "moya420",
      title: "MOYA420",
      caption: "THE GRAND DOME SHELTER.",
      href: "/products/moya420",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
    {
      id: "nokuta",
      title: "NOKUTA",
      caption: "PROTECTION UNDER THE SKY.",
      href: "/products/nokuta",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
    {
      id: "zig-stake",
      title: "ZIG STAKE",
      caption: "BUILT TO HOLD.",
      href: "/products/zig-stake20",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
    {
      id: "kenju",
      title: "KENJU",
      caption: "STRENGTH MEETS VERSATILITY.",
      href: "/products/kenju",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
    {
      id: "zig-hummer",
      title: "ZIG HUMMER",
      caption: "THE FORGED DRIVING TOOL",
      href: "/products/zig-hummer",
      image: MAIN_PRODUCT_DUMMY_IMAGE,
    },
  ],
  link: {
    label: "ALL PRODUCTS",
    href: "/products",
  },
} as const;

export const homeFeatureLinks = [
  {
    id: "labo",
    title: "LABO",
    href: "/labo",
    image: MAIN_PRODUCT_DUMMY_IMAGE,
  },
  {
    id: "support",
    title: "SUPPORT",
    href: "/support",
    image: MAIN_PRODUCT_DUMMY_IMAGE,
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
  backgroundImage: "/images/home/home-link-lab.webp",
} as const;
