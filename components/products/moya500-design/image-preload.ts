"use client";

import { assetPath } from "@/lib/assetPath";

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

const preloadCache = new Map<string, Promise<boolean>>();
const loadedImageSources = new Set<string>();

export function isConstrainedGalleryConnection() {
  const connection = (navigator as NavigatorWithConnection).connection;
  if (!connection) {
    return false;
  }

  return (
    connection.saveData === true ||
    connection.effectiveType === "slow-2g" ||
    connection.effectiveType === "2g" ||
    connection.effectiveType === "3g"
  );
}

export function preloadMoya500Image(src: string): Promise<boolean> {
  const resolvedSrc = assetPath(src);
  const cached = preloadCache.get(resolvedSrc);
  if (cached) {
    return cached;
  }

  const request = new Promise<boolean>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      void image
        .decode()
        .catch(() => undefined)
        .finally(() => {
          loadedImageSources.add(resolvedSrc);
          resolve(true);
        });
    };
    image.onerror = () => resolve(false);
    image.src = resolvedSrc;
  }).then((loaded) => {
    if (!loaded) {
      preloadCache.delete(resolvedSrc);
    }
    return loaded;
  });

  preloadCache.set(resolvedSrc, request);
  return request;
}

export function isMoya500ImagePreloaded(src: string) {
  return loadedImageSources.has(assetPath(src));
}

export function uniqueImageSources(sources: string[]) {
  return Array.from(new Set(sources));
}
