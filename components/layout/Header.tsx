"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type Ref } from "react";

import {
  globalNavigationLinks,
  headerIconLinks,
  headerMenuButton,
} from "@/data/navigation";
import { useCart } from "@/components/commerce/CartProvider";
import { shouldOpenCartPopup } from "@/components/commerce/dialog-panel";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import {
  isHeaderIconLinkVisible,
  isMembershipLinkVisible,
} from "@/lib/site-navigation-visibility";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { SiteNavLink } from "@/components/layout/SiteNavLink";
import { hoverUnderlineActiveClassName, hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { uiText } from "@/lib/typography";
import {
  resolveScrollHeaderFadeAheadPx,
  resolveScrollHeaderVisibility,
} from "@/lib/header-scroll";
import {
  fallbackHeaderTheme,
  headerThemeFromAttribute,
  headerThemeProbeY,
  isHeaderOnScreen,
  isProductDetailPath,
  type HeaderTheme,
} from "@/lib/header-theme";
import { maskGraphicStyle } from "@/lib/maskStyle";

const headerIconClassName = "size-[24px]";

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

function isGlobalNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveHeaderTheme(
  header: HTMLElement | null,
  pathname: string,
  { matchBackground = false }: { matchBackground?: boolean } = {}
): HeaderTheme {
  if (!matchBackground && isProductDetailPath(pathname)) {
    return "onLight";
  }

  const previousPointerEvents = header?.style.pointerEvents ?? "";

  if (header) {
    header.style.pointerEvents = "none";
  }

  const rect = header?.getBoundingClientRect();
  const probeY = rect
    ? headerThemeProbeY(rect.top, window.innerHeight)
    : headerThemeProbeY(0, window.innerHeight);
  const target = document.elementFromPoint(window.innerWidth / 2, probeY);
  const section = target?.closest("[data-header-theme]");
  const theme = section?.getAttribute("data-header-theme");

  if (header) {
    header.style.pointerEvents = previousPointerEvents;
  }

  return headerThemeFromAttribute(theme, pathname);
}

type HeaderBarProps = {
  headerRef: Ref<HTMLElement>;
  pathname: string;
  theme: HeaderTheme;
  variant: "page" | "scroll";
  isScrollVisible: boolean;
  isMobileMenuOpen: boolean;
  cartQuantity: number;
  customer: unknown;
  openCart: () => void;
  openMobileMenu: () => void;
};

function HeaderBar({
  headerRef,
  pathname,
  theme,
  variant,
  isScrollVisible,
  isMobileMenuOpen,
  cartQuantity,
  customer,
  openCart,
  openMobileMenu,
}: HeaderBarProps) {
  const isHidden = variant === "scroll" ? !isScrollVisible : isScrollVisible;
  const themeClassName =
    theme === "onDark" ? "text-white" : "text-[var(--foreground)]";
  const badgeClassName =
    theme === "onDark"
      ? "bg-white text-[var(--foreground)]"
      : "bg-[var(--foreground)] text-white";
  const positionClassName =
    variant === "page"
      ? "absolute left-0 right-0 top-0 z-50 bg-transparent"
      : `header-scroll fixed left-0 right-0 top-0 z-50 bg-transparent${
          isScrollVisible ? " is-visible" : ""
        }`;

  return (
    <header
      ref={headerRef}
      data-active-theme={theme}
      data-header-variant={variant}
      aria-hidden={isHidden}
      inert={isHidden}
      className={`${positionClassName} ${themeClassName}`}
    >
      <div className="grid h-[var(--header-height)] grid-cols-[1fr_auto] items-center px-6 min-[1025px]:grid-cols-[1fr_auto_1fr] min-[1025px]:px-[var(--container-x)]">
        <SiteNavLink href="/" aria-label="C AND+S" className="inline-flex w-fit items-center">
          <HeaderMaskGraphic
            src="/assets/logos/logo-candpluss.svg"
            className="h-[calc(20px*var(--text-scale))] w-[calc(136px*var(--text-scale))]"
          />
        </SiteNavLink>

        <nav aria-label="Global navigation" className="hidden min-[1025px]:block">
          <ul className="font-ui-en flex items-center gap-[var(--header-nav-gap)] font-medium">
            {globalNavigationLinks
              .filter((link) => link.label !== "MEMBERSHIP" || isMembershipLinkVisible())
              .map((link) => {
                const isActive = isGlobalNavLinkActive(pathname, link.href);

                return (
                  <li key={link.href}>
                    <SiteNavLink
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`${isActive ? hoverUnderlineActiveClassName : hoverUnderlineHoverClassName} ${uiText(14)}`}
                    >
                      {link.label}
                    </SiteNavLink>
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
              aria-haspopup={link.label === "Cart" ? "dialog" : undefined}
              tabIndex={isHidden ? -1 : undefined}
              onClick={
                link.label === "Cart"
                  ? (event) => {
                      if (!shouldOpenCartPopup(event)) {
                        return;
                      }

                      event.preventDefault();
                      openCart();
                    }
                  : undefined
              }
              className={`relative items-center justify-center ${
                link.label === "Search" ? "hidden min-[1025px]:inline-flex" : "inline-flex"
              }`}
            >
              <HeaderMaskGraphic src={link.iconSrc} className={headerIconClassName} />
              {link.label === "Cart" && cartQuantity ? (
                <span
                  className={`font-ui-en absolute top-[-10px] right-[-10px] flex size-[20px] items-center justify-center rounded-full text-[10px] leading-[10px] ${badgeClassName}`}
                >
                  {Math.min(cartQuantity, 99)}
                </span>
              ) : null}
            </Link>
          ))}

          <button
            type="button"
            aria-label={headerMenuButton.label}
            aria-expanded={isMobileMenuOpen}
            aria-controls="header-mobile-menu"
            tabIndex={isHidden ? -1 : undefined}
            onClick={openMobileMenu}
            className="relative inline-flex size-[24px] cursor-pointer items-center justify-center"
          >
            <span className="absolute h-px w-[24px] -translate-y-[calc(5px*var(--text-scale))] bg-current" />
            <span className="absolute h-px w-[24px] translate-y-[calc(5px*var(--text-scale))] bg-current" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Header() {
  const pathname = usePathname();
  const { cart, openCart } = useCart();
  const { customer } = useCustomer();
  const pageHeaderRef = useRef<HTMLElement>(null);
  const scrollHeaderRef = useRef<HTMLElement>(null);
  const scrollYRef = useRef(0);
  const scrollVisibleRef = useRef(false);
  const [pageTheme, setPageTheme] = useState<HeaderTheme>(() => fallbackHeaderTheme(pathname));
  const [scrollTheme, setScrollTheme] = useState<HeaderTheme>(() => fallbackHeaderTheme(pathname));
  const [isScrollHeaderVisible, setIsScrollHeaderVisible] = useState(false);
  const [headerPathname, setHeaderPathname] = useState(pathname);

  if (headerPathname !== pathname) {
    setHeaderPathname(pathname);
    setPageTheme(fallbackHeaderTheme(pathname));
    setScrollTheme(fallbackHeaderTheme(pathname));
    setIsScrollHeaderVisible(false);
  }

  const [mobileMenuState, setMobileMenuState] = useState<{ open: boolean; pathname: string }>({
    open: false,
    pathname: "",
  });
  const isMobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === pathname;
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const cartQuantity = cart?.totalQuantity ?? 0;

  useEffect(() => {
    let frameId = 0;

    scrollYRef.current = window.scrollY;
    scrollVisibleRef.current = false;

    function update() {
      const pageHeader = pageHeaderRef.current;
      const rect = pageHeader?.getBoundingClientRect();
      const scrollY = window.scrollY;
      const nextVisible = resolveScrollHeaderVisibility({
        originalHeaderBottom: rect?.bottom ?? 0,
        fadeAheadPx: resolveScrollHeaderFadeAheadPx(pageHeader?.offsetHeight ?? 80),
        scrollY,
        previousScrollY: scrollYRef.current,
        isCurrentlyVisible: scrollVisibleRef.current,
      });

      scrollYRef.current = scrollY;

      if (nextVisible !== scrollVisibleRef.current) {
        scrollVisibleRef.current = nextVisible;
        setIsScrollHeaderVisible(nextVisible);
      }

      if (
        rect &&
        isHeaderOnScreen(rect.top, rect.bottom, window.innerHeight)
      ) {
        setPageTheme(resolveHeaderTheme(pageHeader, pathname));
      }

      if (nextVisible) {
        setScrollTheme(
          resolveHeaderTheme(scrollHeaderRef.current, pathname, { matchBackground: true })
        );
      }
    }

    function scheduleUpdate() {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        update();
      });
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("pageshow", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("pageshow", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
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

  const headerBarProps = {
    pathname,
    isScrollVisible: isScrollHeaderVisible,
    isMobileMenuOpen,
    cartQuantity,
    customer,
    openCart,
    openMobileMenu,
  };

  return (
    <>
      <HeaderBar
        headerRef={pageHeaderRef}
        theme={pageTheme}
        variant="page"
        {...headerBarProps}
      />
      <HeaderBar
        headerRef={scrollHeaderRef}
        theme={scrollTheme}
        variant="scroll"
        {...headerBarProps}
      />

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
