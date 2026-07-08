"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { MaskedImage } from "@/components/ui/MaskedImage";
import { TextLinkContent, textLinkLayoutClassName } from "@/components/ui/TextLink";
import { homeProductLinks } from "@/data/home";

const HORIZONTAL_HOLD_RATIO = 0.22;
const HORIZONTAL_SCROLL_RATIO = 0.56;
const HORIZONTAL_END_HOLD_RATIO = 0.22;

/** PC 向けピン留め横スクロール（1024px 以上・fine pointer） */
const PRODUCT_LINKS_PINNED_SCROLL_QUERY = "(pointer: fine) and (min-width: 1024px)";

function matchesProductLinksPinnedScrollQuery(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(PRODUCT_LINKS_PINNED_SCROLL_QUERY).matches;
}

function getViewportWidth(track: HTMLElement) {
  return track.parentElement?.clientWidth ?? document.documentElement.clientWidth;
}

function getHorizontalMetrics(track: HTMLElement) {
  const viewportWidth = getViewportWidth(track);
  const trackStyles = window.getComputedStyle(track);
  const paddingRight = Number.parseFloat(trackStyles.paddingRight) || 0;
  const lastCard = track.lastElementChild as HTMLElement | null;

  if (!lastCard) {
    return { endX: 0, scrollDistance: 0 };
  }

  const endX = Math.min(
    0,
    viewportWidth - paddingRight - lastCard.offsetLeft - lastCard.offsetWidth
  );
  const scrollDistance = Math.abs(endX);

  return { endX, scrollDistance };
}

function needsHorizontalScroll(track: HTMLElement) {
  return getHorizontalMetrics(track).scrollDistance > 0;
}

function getPinnedScrollLength(track: HTMLElement) {
  const { scrollDistance } = getHorizontalMetrics(track);

  if (scrollDistance <= 0) {
    return 0;
  }

  const viewportHeight = window.innerHeight;
  const horizontalScrollLength = scrollDistance * 1.35;

  return (
    viewportHeight * (HORIZONTAL_HOLD_RATIO + HORIZONTAL_END_HOLD_RATIO) +
    horizontalScrollLength
  );
}

function clearSectionScrollHeight(section: HTMLElement) {
  section.style.height = "";
}

export function HomeProductLinks() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const refreshScrollTriggerRef = useRef(() => {});

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const track = trackRef.current;

    if (!section || !track) {
      return;
    }

    const mediaQuery = gsap.matchMedia();
    let context: gsap.Context | null = null;

    const teardownHorizontalScroll = () => {
      context?.revert();
      context = null;
      gsap.set(track, { x: 0 });
      clearSectionScrollHeight(section);
    };

    const setupHorizontalScroll = () => {
      teardownHorizontalScroll();

      if (!matchesProductLinksPinnedScrollQuery()) {
        ScrollTrigger.refresh();
        return;
      }

      if (!needsHorizontalScroll(track)) {
        ScrollTrigger.refresh();
        return;
      }

      const scrollLength = getPinnedScrollLength(track);
      section.style.height = `calc(100svh + ${scrollLength}px)`;

      context = gsap.context(() => {
        gsap.set(track, { x: 0, force3D: true });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getPinnedScrollLength(track)}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(track, { x: 0, ease: "none", duration: HORIZONTAL_HOLD_RATIO, force3D: true })
          .to(track, {
            x: () => getHorizontalMetrics(track).endX,
            ease: "none",
            duration: HORIZONTAL_SCROLL_RATIO,
            force3D: true,
          })
          .to(track, {
            x: () => getHorizontalMetrics(track).endX,
            ease: "none",
            duration: HORIZONTAL_END_HOLD_RATIO,
            force3D: true,
          });
      }, section);

      ScrollTrigger.refresh();
    };

    refreshScrollTriggerRef.current = setupHorizontalScroll;

    mediaQuery.add(PRODUCT_LINKS_PINNED_SCROLL_QUERY, () => {
      setupHorizontalScroll();

      return () => {
        teardownHorizontalScroll();
      };
    });

    window.addEventListener("resize", setupHorizontalScroll);

    return () => {
      refreshScrollTriggerRef.current = () => {};
      window.removeEventListener("resize", setupHorizontalScroll);
      mediaQuery.revert();
      teardownHorizontalScroll();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-header-theme="onLight"
      className="relative bg-[#f5f5f5]"
    >
      <div
        ref={stageRef}
        className="w-full bg-[#f5f5f5] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] min-[1024px]:sticky min-[1024px]:top-0 min-[1024px]:h-svh min-[1024px]:py-0"
      >
        <div className="home-product-links-scroll relative w-full min-[1024px]:absolute min-[1024px]:inset-x-0 min-[1024px]:top-[calc((100svh-67svh)/2)] min-[1024px]:h-[67svh]">
          <div
            ref={trackRef}
            className="flex w-max items-center gap-[var(--product-links-gap)] pl-0 pr-[var(--container-x)] min-[1024px]:h-full min-[1024px]:px-[var(--container-x)] [@media(pointer:fine)_and_(min-width:1024px)]:will-change-transform"
          >
            {homeProductLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="home-product-links-card group relative block aspect-[226/301] w-[70vw] shrink-0 overflow-hidden min-[1024px]:h-full min-[1024px]:w-auto"
              >
                <MaskedImage
                  src={item.image}
                  alt=""
                  aspectClassName="h-full w-full"
                  sizes="(min-width: 1024px) 30vw, 70vw"
                  onLoad={() => refreshScrollTriggerRef.current()}
                />
                <div
                  className="absolute inset-0 bg-[rgba(0,0,0,0.15)]"
                  aria-hidden="true"
                />
                <span
                  className={`absolute bottom-5 right-5 text-white min-[1024px]:bottom-8 min-[1024px]:right-8 ${textLinkLayoutClassName}`}
                >
                  <TextLinkContent>{item.title}</TextLinkContent>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
