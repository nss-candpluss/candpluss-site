"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  globalNavigationLinks,
  headerIconLinks,
  headerMenuButton,
} from "@/data/navigation";
import { useCart } from "@/components/commerce/CartProvider";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import {
  isHeaderIconLinkVisible,
  isMembershipLinkVisible,
} from "@/lib/site-navigation-visibility";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { hoverUnderlineActiveClassName, hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

const HEADER_HIDE_THRESHOLD = 100;
/** この位置より上ではブレンドヘッダーをフェードアウト（トップ固定ヘッダーと重なる前） */
const HEADER_BLEND_FADE_END = 180;
const SCROLL_DIRECTION_THRESHOLD = 4;
const HEADER_THEME_PROBE_Y = 40;
const headerIconClassName = "size-[24px]";

function getScrollBlendOpacity(scrollY: number): number {
  if (scrollY >= HEADER_BLEND_FADE_END) {
    return 1;
  }

  if (scrollY <= HEADER_HIDE_THRESHOLD) {
    return 0;
  }

  return (scrollY - HEADER_HIDE_THRESHOLD) / (HEADER_BLEND_FADE_END - HEADER_HIDE_THRESHOLD);
}

type HeaderTheme = "onDark" | "onLight";

type HeaderMaskGraphicProps = {
  src: string;
  className: string;
};

function HeaderMaskGraphic({ src, className }: HeaderMaskGraphicProps) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`.trim()}
      style={maskGraphicStyle(src)}
    />
  );
}

function isProductDetailPath(pathname: string): boolean {
  return /^\/products\/[^/]+$/.test(pathname);
}

function isGlobalNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveHeaderTheme(header: HTMLElement | null, pathname: string): HeaderTheme {
  if (isProductDetailPath(pathname)) {
    return "onLight";
  }

  const previousPointerEvents = header?.style.pointerEvents ?? "";

  if (header) {
    header.style.pointerEvents = "none";
  }

  const target = document.elementFromPoint(window.innerWidth / 2, HEADER_THEME_PROBE_Y);
  const section = target?.closest("[data-header-theme]");
  const theme = section?.getAttribute("data-header-theme");

  if (header) {
    header.style.pointerEvents = previousPointerEvents;
  }

  return theme === "onLight" ? "onLight" : "onDark";
}

export function Header() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { customer } = useCustomer();
  const headerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isAtPageTop, setIsAtPageTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [theme, setTheme] = useState<HeaderTheme>("onDark");
  const [mobileMenuState, setMobileMenuState] = useState<{ open: boolean; pathname: string }>({
    open: false,
    pathname: "",
  });
  const isMobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === pathname;
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const isVisibleRef = useRef(true);
  const isAtPageTopRef = useRef(true);
  const themeRef = useRef<HeaderTheme>("onDark");
  const lastScrollY = useRef(0);
  const scrollYRef = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    function getScrollY() {
      return Math.max(window.scrollY || document.documentElement.scrollTop || 0, 0);
    }

    function setHeaderVisible(nextIsVisible: boolean) {
      if (isVisibleRef.current === nextIsVisible) {
        return;
      }

      isVisibleRef.current = nextIsVisible;
      setIsVisible(nextIsVisible);
    }

    function setPageTop(nextIsAtPageTop: boolean) {
      if (isAtPageTopRef.current === nextIsAtPageTop) {
        return;
      }

      isAtPageTopRef.current = nextIsAtPageTop;
      setIsAtPageTop(nextIsAtPageTop);
    }

    function setScrollPosition(nextScrollY: number) {
      if (Math.abs(scrollYRef.current - nextScrollY) < 0.5) {
        return;
      }

      scrollYRef.current = nextScrollY;
      setScrollY(nextScrollY);
    }

    function setHeaderTheme(nextTheme: HeaderTheme) {
      if (themeRef.current === nextTheme) {
        return;
      }

      themeRef.current = nextTheme;
      setTheme(nextTheme);
    }

    lastScrollY.current = getScrollY();

    function updateHeader() {
      const currentScrollY = getScrollY();
      const scrollDelta = currentScrollY - lastScrollY.current;

      const atPageTop = currentScrollY < HEADER_HIDE_THRESHOLD;

      if (atPageTop) {
        setHeaderVisible(true);
      } else if (Math.abs(scrollDelta) > SCROLL_DIRECTION_THRESHOLD) {
        setHeaderVisible(scrollDelta < 0);
      }

      setPageTop(atPageTop);
      setScrollPosition(currentScrollY);

      lastScrollY.current = currentScrollY;

      if (atPageTop) {
        setHeaderTheme(resolveHeaderTheme(headerRef.current, pathname));
      }
      ticking.current = false;
    }

    function scheduleHeaderUpdate() {
      if (ticking.current) {
        return;
      }

      ticking.current = true;
      window.requestAnimationFrame(updateHeader);
    }

    scheduleHeaderUpdate();

    window.addEventListener("scroll", scheduleHeaderUpdate, { passive: true });
    window.addEventListener("resize", scheduleHeaderUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleHeaderUpdate);
      window.removeEventListener("resize", scheduleHeaderUpdate);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuState((prev) => ({ ...prev, open: false }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuMounted]);

  function openMobileMenu() {
    setMobileMenuState({ open: true, pathname });
    setIsMobileMenuMounted(true);
  }

  function closeMobileMenu() {
    setMobileMenuState((prev) => ({ ...prev, open: false }));
  }

  function handleMobileMenuExited() {
    setIsMobileMenuMounted(false);
  }

  /** ページトップ（scrollY < 100px）は従来のテーマ切替、スクロール後に再表示されたヘッダーは difference で背景に追従 */
  const usesScrollBlend = !isAtPageTop && isVisible;
  const scrollBlendOpacity = usesScrollBlend ? getScrollBlendOpacity(scrollY) : 1;
  const headerOpacity = usesScrollBlend ? scrollBlendOpacity : 1;
  const isHeaderInteractive = headerOpacity > 0.05 && (isAtPageTop || isVisible);
  const themeClassName = usesScrollBlend
    ? "mix-blend-difference text-white"
    : theme === "onDark"
      ? "text-white"
      : "text-[var(--foreground)]";
  const badgeClassName = usesScrollBlend
    ? "isolate bg-white text-[var(--foreground)]"
    : theme === "onDark"
      ? "bg-white text-[var(--foreground)]"
      : "bg-[var(--foreground)] text-white";

  return (
    <>
      <header
        ref={headerRef}
        data-active-theme={theme}
        data-scroll-blend={usesScrollBlend ? "true" : "false"}
        className={`fixed left-0 right-0 top-0 z-50 bg-transparent transition-[transform,opacity,color] duration-300 ease-out ${themeClassName} ${
          isHeaderInteractive ? "" : "pointer-events-none"
        }`}
        style={{
          transform: isAtPageTop || isVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: headerOpacity,
        }}
      >
      <div className="grid h-[var(--header-height)] grid-cols-[1fr_auto] items-center px-6 transition-colors duration-300 ease-out min-[1024px]:grid-cols-[1fr_auto_1fr] min-[1024px]:px-[var(--container-x)]">
        <Link href="/" aria-label="C AND+S" className="inline-flex w-fit items-center">
          <HeaderMaskGraphic
            src="/assets/logos/logo-candpluss.svg"
            className="h-[calc(20px*var(--text-scale))] w-[calc(136px*var(--text-scale))]"
          />
        </Link>

        <nav aria-label="Global navigation" className="hidden min-[1024px]:block">
          <ul className="font-ui-en flex items-center gap-[var(--header-nav-gap)] font-medium">
            {globalNavigationLinks
              .filter((link) => link.label !== "MEMBERSHIP" || isMembershipLinkVisible())
              .map((link) => {
              const isActive = isGlobalNavLinkActive(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`${isActive ? hoverUnderlineActiveClassName : hoverUnderlineHoverClassName} ${uiText(14)}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-[var(--header-icon-gap)]">
          {headerIconLinks.filter((link) => isHeaderIconLinkVisible(link.label)).map((link) => (
            <Link
              key={link.href}
              href={
                link.label === "User" && customer
                  ? "/account"
                  : link.href
              }
              aria-label={link.label}
              className={`relative items-center justify-center ${
                link.label === "Search" ? "hidden min-[1024px]:inline-flex" : "inline-flex"
              }`}
            >
              <HeaderMaskGraphic src={link.iconSrc} className={headerIconClassName} />
              {link.label === "Cart" && cart?.totalQuantity ? (
                <span
                  className={`font-ui-en absolute top-[calc(-8px*var(--text-scale))] right-[calc(-8px*var(--text-scale))] flex size-[calc(16px*var(--text-scale))] items-center justify-center rounded-full ${uiText(10)} ${badgeClassName}`}
                >
                  {Math.min(cart.totalQuantity, 99)}
                </span>
              ) : null}
            </Link>
          ))}

          <button
            type="button"
            aria-label={headerMenuButton.label}
            aria-expanded={isMobileMenuOpen}
            aria-controls="header-mobile-menu"
            onClick={openMobileMenu}
            className="relative inline-flex size-[24px] cursor-pointer items-center justify-center"
          >
            <span className="absolute h-px w-[24px] -translate-y-[calc(5px*var(--text-scale))] bg-current" />
            <span className="absolute h-px w-[24px] translate-y-[calc(5px*var(--text-scale))] bg-current" />
          </button>
        </div>
      </div>
      </header>

      {isMobileMenuMounted ? (
        <HeaderMobileMenu
          id="header-mobile-menu"
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          onExited={handleMobileMenuExited}
        />
      ) : null}
    </>
  );
}
