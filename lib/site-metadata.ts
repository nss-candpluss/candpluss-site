import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

type PageOgType = "website" | "article";

export type CreatePageMetadataInput = {
  title?: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
  ogType?: PageOgType;
};

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
  image = siteConfig.ogImage,
  index = true,
  ogType = "website",
}: CreatePageMetadataInput): Metadata {
  const canonical = canonicalPath(path);
  const pageTitle = title ?? siteConfig.name;

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
      // 寸法が分かるのは共通 OG 画像のみ。商品・News の個別画像は寸法を持たないため省略する
      images: [
        image === siteConfig.ogImage
          ? {
              url: image,
              width: siteConfig.ogImageWidth,
              height: siteConfig.ogImageHeight,
            }
          : { url: image },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [image],
    },
  };
}
