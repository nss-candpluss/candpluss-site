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
import { shouldOpenCartPopup } from "@/components/commerce/dialog-panel";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import {
  isHeaderIconLinkVisible,
  isMembershipLinkVisible,
} from "@/lib/site-navigation-visibility";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { hoverUnderlineActiveClassName, hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { maskGraphicStyle } from "@/lib/maskStyle";

const HEADER_THEME_PROBE_Y = 40;
const headerIconClassName = "size-[24px]";

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
  const { cart, openCart } = useCart();
  const { customer } = useCustomer();
  const headerRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<HeaderTheme>("onDark");
  const [mobileMenuState, setMobileMenuState] = useState<{ open: boolean; pathname: string }>({
    open: false,
    pathname: "",
  });
  const isMobileMenuOpen = mobileMenuState.open && mobileMenuState.pathname === pathname;
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);

  useEffect(() => {
    function updateTheme() {
      setTheme(resolveHeaderTheme(headerRef.current, pathname));
    }

    const frameId = window.requestAnimationFrame(updateTheme);
    window.addEventListener("resize", updateTheme, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTheme);
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

  const themeClassName =
    theme === "onDark" ? "text-white" : "text-[var(--foreground)]";
  const badgeClassName =
    theme === "onDark"
      ? "bg-white text-[var(--foreground)]"
      : "bg-[var(--foreground)] text-white";

  return (
    <>
      <header
        ref={headerRef}
        data-active-theme={theme}
        className={`absolute left-0 right-0 top-0 z-50 bg-transparent ${themeClassName}`}
      >
        <div className="grid h-[var(--header-height)] grid-cols-[1fr_auto] items-center px-6 min-[1025px]:grid-cols-[1fr_auto_1fr] min-[1025px]:px-[var(--container-x)]">
          <Link href="/" aria-label="C AND+S" className="inline-flex w-fit items-center">
            <HeaderMaskGraphic
              src="/assets/logos/logo-candpluss.svg"
              className="h-[calc(20px*var(--text-scale))] w-[calc(136px*var(--text-scale))]"
            />
          </Link>

          <nav aria-label="Global navigation" className="hidden min-[1025px]:block">
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
                        className={`${isActive ? hoverUnderlineActiveClassName : hoverUnderlineHoverClassName} text-[14px] leading-[14px]`}
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
                aria-haspopup={link.label === "Cart" ? "dialog" : undefined}
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
                {link.label === "Cart" && cart?.totalQuantity ? (
                  <span
                    className={`font-ui-en absolute top-[-10px] right-[-10px] flex size-[20px] items-center justify-center rounded-full text-[10px] leading-[10px] ${badgeClassName}`}
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
