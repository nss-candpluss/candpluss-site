"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteImage } from "@/components/ui/SiteImage";
import { useLayoutEffect, useRef } from "react";

import { TextLink } from "@/components/ui/TextLink";
import { homeLabContent } from "@/data/home";
import {
  DESKTOP_POINTER_MEDIA_QUERY,
  matchesDesktopPointerMediaQuery,
} from "@/lib/motion/should-enable-smooth-scroll";
import { sectionTitle62ClassName } from "@/lib/typography";

const LAB_HOLD_RATIO = 0.12;
const LAB_ZOOM_RATIO = 0.56;
const LAB_END_HOLD_RATIO = 0.22;
const LAB_SCROLL_LENGTH_RATIO = 1.15;
const LAB_SCALE_START = 1.06;
const LAB_SCALE_END = 1.02;
const LAB_Y_END = -24;

function getLabScrollLength() {
  return window.innerHeight * LAB_SCROLL_LENGTH_RATIO;
}

function clearSectionScrollHeight(section: HTMLElement) {
  section.style.height = "";
}

export function HomeLab() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const refreshScrollTriggerRef = useRef(() => {});

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const background = backgroundRef.current;

    if (!section || !background) {
      return;
    }

    let context: gsap.Context | null = null;

    const teardownLabScroll = () => {
      context?.revert();
      context = null;
      gsap.set(background, { scale: LAB_SCALE_START, y: 0, force3D: true });
      clearSectionScrollHeight(section);
    };

    const setupLabScroll = () => {
      teardownLabScroll();

      if (!matchesDesktopPointerMediaQuery()) {
        ScrollTrigger.refresh();
        return;
      }

      const scrollLength = getLabScrollLength();
      section.style.height = `calc(100svh + ${scrollLength}px)`;

      context = gsap.context(() => {
        gsap.set(background, { scale: LAB_SCALE_START, y: 0, force3D: true });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getLabScrollLength()}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(background, {
            scale: LAB_SCALE_START,
            y: 0,
            ease: "none",
            duration: LAB_HOLD_RATIO,
            force3D: true,
          })
          .to(background, {
            scale: LAB_SCALE_END,
            y: LAB_Y_END,
            ease: "none",
            duration: LAB_ZOOM_RATIO,
            force3D: true,
          })
          .to(background, {
            scale: LAB_SCALE_END,
            y: LAB_Y_END,
            ease: "none",
            duration: LAB_END_HOLD_RATIO,
            force3D: true,
          });
      }, section);

      ScrollTrigger.refresh();
    };

    refreshScrollTriggerRef.current = setupLabScroll;

    const mediaQuery = gsap.matchMedia();

    mediaQuery.add(DESKTOP_POINTER_MEDIA_QUERY, () => {
      setupLabScroll();

      return () => {
        teardownLabScroll();
      };
    });

    const handleResize = () => {
      setupLabScroll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      refreshScrollTriggerRef.current = () => {};
      window.removeEventListener("resize", handleResize);
      mediaQuery.revert();
      teardownLabScroll();
    };
  }, []);

  return (
    <section ref={sectionRef} data-header-theme="onDark" className="relative">
      <div ref={stageRef} className="h-svh w-full overflow-hidden [@media(pointer:coarse)]:relative sticky top-0">
        <div
          ref={backgroundRef}
          className="absolute -inset-[10%] origin-center [@media(pointer:fine)_and_(min-width:768px)]:will-change-transform"
        >
          <SiteImage
            src={homeLabContent.backgroundImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            onLoad={() => refreshScrollTriggerRef.current()}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] px-[var(--container-x)] text-white">
          <h2 className={`font-heading ${sectionTitle62ClassName}`}>{homeLabContent.title}</h2>
          <TextLink href={homeLabContent.link.href} className="self-start">
            {homeLabContent.link.label}
          </TextLink>
        </div>
      </div>
    </section>
  );
}
