"use client";

import { SiteImage } from "@/components/ui/SiteImage";
import { useLayoutEffect, useRef } from "react";

import { TextLink } from "@/components/ui/TextLink";
import { topHeroContent } from "@/data/home";
import {
  applyHeroVisualsToElements,
  clearHeroInlineVisuals,
  getHeroScrollProgress,
  scheduleHeroBurstSync,
  supportsHeroScrollCss,
  updateHeroScrollEndVar,
} from "@/lib/heroScrollVisuals";
import { assetPath } from "@/lib/assetPath";
import { bodyText, sectionTitle67ClassName } from "@/lib/typography";

const HERO_LAYER_IMAGE_CLASS = "object-cover object-center";

export function HomeHero() {
  const titleLayerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const titleLayer = titleLayerRef.current;
    const overlay = overlayRef.current;
    const section = titleLayer?.closest<HTMLElement>("[data-hero-section]");
    const copy = section?.querySelector<HTMLElement>("[data-home-hero-copy]");
    const body = section?.querySelector<HTMLElement>("[data-home-hero-body]");

    if (!section || !titleLayer || !overlay) {
      return;
    }

    if (supportsHeroScrollCss()) {
      clearHeroInlineVisuals(section, overlay, titleLayer);
      section.dataset.heroScrollMode = "css";

      const syncScrollEnd = () => {
        updateHeroScrollEndVar(section);
      };

      syncScrollEnd();

      const resizeObserver = new ResizeObserver(syncScrollEnd);
      resizeObserver.observe(section);
      if (copy) {
        resizeObserver.observe(copy);
      }
      if (body) {
        resizeObserver.observe(body);
      }
      window.addEventListener("resize", syncScrollEnd);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", syncScrollEnd);
      };
    }

    section.dataset.heroScrollMode = "js";
    let scrollTicking = false;

    const syncHeroScrollState = (allowSnapshot = false) => {
      const progress = getHeroScrollProgress(section, { allowSnapshot });
      applyHeroVisualsToElements(section, overlay, titleLayer, progress);
    };

    window.__heroScrollSync = () => {
      syncHeroScrollState(true);
    };

    syncHeroScrollState();
    scheduleHeroBurstSync("hero:mount", (source, allowSnapshot) => {
      syncHeroScrollState(allowSnapshot);
    });

    const handleScroll = () => {
      if (scrollTicking) {
        return;
      }

      scrollTicking = true;
      window.requestAnimationFrame(() => {
        syncHeroScrollState();
        scrollTicking = false;
      });
    };

    const handlePageShow = () => {
      scheduleHeroBurstSync(
        "hero:pageshow",
        (source, allowSnapshot) => {
          syncHeroScrollState(allowSnapshot);
        },
        true
      );
    };

    const handleResize = () => {
      syncHeroScrollState();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncHeroScrollState();
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("pageshow", handlePageShow);

    resizeObserver.observe(section);
    if (copy) {
      resizeObserver.observe(copy);
    }
    if (body) {
      resizeObserver.observe(body);
    }

    return () => {
      if (window.__heroScrollSync) {
        delete window.__heroScrollSync;
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pageshow", handlePageShow);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div
        data-home-hero-background
        data-header-theme="onDark"
        className="sticky top-0 z-0 h-screen overflow-hidden bg-black"
      >
        <div className="absolute inset-0 z-0">
          <SiteImage
            src={topHeroContent.backgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className={HERO_LAYER_IMAGE_CLASS}
          />
        </div>

        <div
          ref={titleLayerRef}
          data-hero-title-layer
          className="hero-title-layer pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 md:px-6 will-change-[transform,opacity]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(topHeroContent.titleImageSp)}
            alt={topHeroContent.titleAlt}
            className="h-auto w-[88vw] max-w-none object-contain md:w-[94vw] min-[1025px]:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(topHeroContent.titleImage)}
            alt={topHeroContent.titleAlt}
            className="hidden h-auto w-[88vw] max-w-none object-contain md:w-[94vw] min-[1025px]:block"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-20">
          <SiteImage
            src={topHeroContent.foregroundImage}
            alt=""
            fill
            sizes="100vw"
            priority
            className={HERO_LAYER_IMAGE_CLASS}
          />
        </div>

        <div
          ref={overlayRef}
          className="hero-overlay pointer-events-none absolute inset-0 z-30"
          aria-hidden="true"
        />
      </div>

      <section
        data-home-hero-copy
        data-header-theme="onDark"
        className="relative z-10 -mt-[50px] min-h-[50svh] px-[var(--container-x)] pb-[20vh]"
      >
        <div className="flex flex-col items-center text-center text-white">
          <h2 className={`${sectionTitle67ClassName} font-heading`}>
            {topHeroContent.beginning.title}
          </h2>
          <p
            data-home-hero-body
            className={`font-body-ja mt-[calc(98px*var(--gap-scale-y))] ${bodyText(18)}`}
          >
            {topHeroContent.beginning.bodyLines.map((line, index, lines) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <TextLink
            href={topHeroContent.beginning.link.href}
            className="mt-[calc(60px*var(--gap-scale-y))] text-white"
          >
            {topHeroContent.beginning.link.label}
          </TextLink>
        </div>
      </section>
    </>
  );
}
