"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { SiteImage } from "@/components/ui/SiteImage";

import { laboContent } from "@/data/labo";
import { assetPath } from "@/lib/assetPath";
import { subscribeMotionReady } from "@/lib/motion/motion-ready";
import { getScrollTriggerScroller } from "@/lib/motion/scroll-trigger-scroller";
import { bodyText, conceptStoryTitleClassName, uiText } from "@/lib/typography";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BACKGROUND_SCALE = 1.25;
const OVERLAY_END_OPACITY = 1;

export function LaboHero() {
  const copyRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { hero } = laboContent;

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const copy = copyRef.current;
    const image = imageRef.current;
    const overlay = overlayRef.current;

    if (!copy || !image || !overlay) {
      return;
    }

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let context: gsap.Context | null = null;
    let setupFrameId = 0;

    const getPanDistance = () => {
      const frame = image.parentElement;

      if (!frame) {
        return 0;
      }

      return -(Math.max(image.offsetHeight - frame.offsetHeight, 0));
    };

    const setup = () => {
      context?.revert();
      context = null;

      context = gsap.context(() => {
        gsap.set(image, { y: 0 });
        gsap.set(overlay, { opacity: 0 });

        if (reducedMotion.matches) {
          return;
        }

        gsap
          .timeline({
            scrollTrigger: {
              trigger: copy,
              scroller: getScrollTriggerScroller(),
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(
            image,
            {
              y: getPanDistance,
              ease: "none",
              force3D: true,
            },
            0
          )
          .to(
            overlay,
            {
              opacity: OVERLAY_END_OPACITY,
              ease: "none",
            },
            0
          );
      });

      ScrollTrigger.refresh();
    };

    const scheduleSetup = () => {
      cancelAnimationFrame(setupFrameId);
      setupFrameId = requestAnimationFrame(setup);
    };

    const unsubscribeMotionReady = subscribeMotionReady(scheduleSetup);
    reducedMotion.addEventListener("change", scheduleSetup);
    queueMicrotask(scheduleSetup);

    return () => {
      cancelAnimationFrame(setupFrameId);
      reducedMotion.removeEventListener("change", scheduleSetup);
      unsubscribeMotionReady();
      context?.revert();
    };
  }, []);

  return (
    <>
      <div
        data-labo-hero-background
        className="pointer-events-none sticky top-0 z-0 h-lvh overflow-hidden"
        aria-hidden="true"
      >
        <div
          ref={imageRef}
          data-labo-hero-image
          className="absolute inset-x-0 top-0 will-change-transform"
          style={{ height: `${BACKGROUND_SCALE * 100}%` }}
        >
          <SiteImage
            src={hero.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <div
          ref={overlayRef}
          data-labo-hero-overlay
          className="absolute inset-0 bg-black opacity-0"
        />
      </div>

      <section
        ref={copyRef}
        data-header-theme="onDark"
        data-labo-hero
        data-labo-hero-copy
        className="relative z-10 -mt-[100lvh] min-h-lvh text-white"
      >
        <div className="relative z-10 mx-auto w-full max-w-[1050px] px-[var(--container-x)] pb-[var(--container-y-bottom)] text-center">
          <div className="flex h-[50svh] w-full items-end">
            <h1 className={`w-full font-heading ${conceptStoryTitleClassName}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetPath(hero.titleLogo)}
                alt={hero.title}
                className="mx-auto inline-block h-auto w-[min(100%,calc(0.71em*814.088/72.001))] brightness-0 invert"
              />
            </h1>
          </div>
          <p
            className={`mt-[calc(32px*var(--gap-scale-y))] font-ui-en font-medium opacity-[0.65] ${uiText(18)}`}
          >
            {hero.label}
          </p>

          <div
            className={`mt-[var(--section-title-gap)] flex flex-col gap-y-[calc(15.75px*var(--text-scale))]`}
          >
            {hero.body.split("\n\n").map((paragraph) => (
              <p
                key={paragraph}
                className={`whitespace-pre-line font-body-ja ${bodyText(18)}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
