import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

/**
 * 商品ページも website のままにする。og:type=product は Next.js の
 * openGraph.type に無く、metadata の other で出すと `property=` ではなく
 * `name="og:type"` になって Facebook が読まないため、有効な og:type が
 * 消えて現状より悪くなる。商品情報は JSON-LD の Product で伝える。
 */
type PageOgType = "website" | "article";

/** 寸法を渡せると Facebook / LINE が初回クロールで画像を確定できる */
export type PageOgImage = {
  url: string;
  width?: number;
  height?: number;
};

export type CreatePageMetadataInput = {
  title?: string;
  description: string;
  path: string;
  image?: string | PageOgImage;
  index?: boolean;
  ogType?: PageOgType;
};

const defaultOgImage: PageOgImage = {
  url: siteConfig.ogImage,
  width: siteConfig.ogImageWidth,
  height: siteConfig.ogImageHeight,
};

function resolveOgImage(image: CreatePageMetadataInput["image"]): PageOgImage {
  if (!image) {
    return defaultOgImage;
  }

  return typeof image === "string" ? { url: image } : image;
}

function canonicalPath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Path must start with /: ${path}`);
  }

  return path === "/" ? "/" : path.replace(/\/$/, "");
}

/** JSON-LD / 絶対 URL 用。http(s) はそのまま返す */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(canonicalPath(pathOrUrl), `${siteConfig.url}/`).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  index = true,
  ogType = "website",
}: CreatePageMetadataInput): Metadata {
  const canonical = canonicalPath(path);
  const pageTitle = title ?? siteConfig.name;
  const ogImage = resolveOgImage(image);

  return {
    ...(title !== undefined ? { title } : {}),
    description,
    alternates: {
      canonical,
    },
    ...(index
      ? {}
      : {
          robots: {
            index: false,
            follow: false,
            googleBot: {
              index: false,
              follow: false,
            },
          },
        }),
    openGraph: {
      type: ogType,
      locale: "ja_JP",
      siteName: siteConfig.name,
      title: pageTitle,
      description,
      url: canonical,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImage.url],
    },
  };
}
