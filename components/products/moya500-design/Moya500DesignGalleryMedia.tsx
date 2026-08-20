"use client";

import { useEffect, useRef, useState } from "react";

import type { Moya500DesignGalleryItem } from "@/components/products/moya500-design/gallery-media";
import { isMoya500ImagePreloaded } from "@/components/products/moya500-design/image-preload";
import { SiteImage } from "@/components/ui/SiteImage";
import { assetPath } from "@/lib/assetPath";

type Moya500DesignGalleryMediaProps = {
  item: Moya500DesignGalleryItem;
  /** playback: 再生 / preview: 1コマ目表示のみ（再生しない） */
  mode?: "preview" | "playback";
  priority?: boolean;
  sizes: string;
  alt?: string;
  className?: string;
  useThumbnail?: boolean;
  onImageLoad?: (image: HTMLImageElement) => void;
};

function pauseOtherGalleryVideos(current: HTMLVideoElement) {
  document
    .querySelectorAll<HTMLVideoElement>("video[data-moya500-gallery-video]")
    .forEach((node) => {
      if (node !== current && !node.paused) {
        node.pause();
      }
    });
}

/** サムネ・再生準備中の下敷き用。動画と同じ先頭フレーム画像を使う */
function Moya500DesignVideoPoster({
  posterSrc,
  className,
}: {
  posterSrc: string;
  className: string;
}) {
  return (
    <SiteImage
      src={posterSrc}
      alt=""
      fill
      sizes="100vw"
      draggable={false}
      className={className}
    />
  );
}

function Moya500DesignVideoMedia({
  item,
  mode,
  className,
  useThumbnail,
}: {
  item: Extract<Moya500DesignGalleryItem, { kind: "video" }>;
  mode: "preview" | "playback";
  className: string;
  useThumbnail: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = assetPath(item.src);
  const posterSrc = useThumbnail ? item.thumbnailPoster : item.poster;
  const [isPlayingVisible, setIsPlayingVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mode !== "playback") {
      return;
    }

    let cancelled = false;

    const revealThenPlay = () => {
      if (cancelled) {
        return;
      }

      // 再生前の同じフレームを表示してから動かすことで、
      // iOS Safari の poster → 再生フレーム切替を見せない
      setIsPlayingVisible(true);
      pauseOtherGalleryVideos(video);
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          void video.play().catch(() => {
            // 自動再生拒否時は先頭フレームのまま
          });
        });
      });
    };

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (video.readyState >= 2) {
      revealThenPlay();
    } else {
      video.addEventListener("loadeddata", revealThenPlay, { once: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", revealThenPlay);
      video.pause();
    };
  }, [mode, videoSrc]);

  if (mode === "preview") {
    return (
      <Moya500DesignVideoPoster
        posterSrc={posterSrc}
        className={className}
      />
    );
  }

  return (
    <>
      {/* 動画と同じ先頭フレームを下に敷き、iOS の切替を隠す */}
      <Moya500DesignVideoPoster
        posterSrc={posterSrc}
        className={className}
      />
      <video
        key={`play-${videoSrc}`}
        ref={videoRef}
        className={`absolute inset-0 size-full ${className} ${
          isPlayingVisible ? "opacity-100" : "opacity-0"
        }`}
        src={`${videoSrc}#t=0.001`}
        poster={assetPath(posterSrc)}
        muted
        playsInline
        loop
        preload="auto"
        controls={false}
        draggable={false}
        data-moya500-gallery-video
      />
    </>
  );
}

function Moya500DesignImageMedia({
  item,
  priority,
  sizes,
  alt,
  className,
  useThumbnail,
  onImageLoad,
}: {
  item: Extract<Moya500DesignGalleryItem, { kind: "image" }>;
  priority: boolean;
  sizes: string;
  alt?: string;
  className: string;
  useThumbnail: boolean;
  onImageLoad?: (image: HTMLImageElement) => void;
}) {
  const [isFullImageVisible, setIsFullImageVisible] = useState(
    useThumbnail || isMoya500ImagePreloaded(item.src)
  );

  if (useThumbnail) {
    return (
      <SiteImage
        src={item.thumbnailSrc}
        alt={alt ?? item.alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={className}
        onLoad={(event) => onImageLoad?.(event.currentTarget)}
      />
    );
  }

  return (
    <>
      <SiteImage
        src={item.thumbnailSrc}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={className}
      />
      <SiteImage
        src={item.src}
        alt={alt ?? item.alt}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={`${className} transition-opacity duration-200 ${
          isFullImageVisible ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(event) => {
          setIsFullImageVisible(true);
          onImageLoad?.(event.currentTarget);
        }}
      />
    </>
  );
}

export function Moya500DesignGalleryMedia({
  item,
  mode = "preview",
  priority = false,
  sizes,
  alt,
  className = "pointer-events-none object-cover object-center",
  useThumbnail = false,
  onImageLoad,
}: Moya500DesignGalleryMediaProps) {
  if (item.kind === "video") {
    return (
      <Moya500DesignVideoMedia
        key={item.id}
        item={item}
        mode={mode}
        className={className}
        useThumbnail={useThumbnail}
      />
    );
  }

  return (
    <Moya500DesignImageMedia
      key={item.id}
      item={item}
      priority={priority}
      sizes={sizes}
      alt={alt}
      className={className}
      useThumbnail={useThumbnail}
      onImageLoad={onImageLoad}
    />
  );
}

export function Moya500DesignVideoThumbBadge() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25"
    >
      <span className="flex size-[22px] items-center justify-center rounded-full bg-white/90">
        <span className="ml-[2px] border-y-[5px] border-l-[8px] border-y-transparent border-l-[var(--foreground)]" />
      </span>
    </span>
  );
}
