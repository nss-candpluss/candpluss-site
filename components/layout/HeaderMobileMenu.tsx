import Link from "next/link";
import { createPortal } from "react-dom";

import { footerContent } from "@/data/footer";
import {
  headerMenuCloseButton,
  mobilePrimaryNavigationLinks,
  mobileSecondaryNavigationLinks,
} from "@/data/navigation";
import {
  isContactLinkVisible,
  isMembershipLinkVisible,
  isSocialLinkVisible,
} from "@/lib/site-navigation-visibility";
import { maskGraphicStyle } from "@/lib/maskStyle";

const headerIconClassName = "size-[24px]";

const primaryLinkClassName =
  "font-ui-en text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[clamp(16px,calc(18px*var(--text-scale)),18px)] font-bold text-[var(--foreground)] min-[1024px]:font-semibold";

const secondaryLinkClassName =
  "font-body-ja text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)] text-[var(--foreground)]";

type HeaderMobileMenuProps = {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onExited: () => void;
};

function HeaderMaskGraphic({ src, className }: { src: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`.trim()}
      style={maskGraphicStyle(src)}
    />
  );
}

export function HeaderMobileMenu({ id, isOpen, onClose, onExited }: HeaderMobileMenuProps) {
  function handlePanelTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform" || isOpen) {
      return;
    }

    onExited();
  }

  return createPortal(
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[60]"
    >
      <button
        type="button"
        aria-label={headerMenuCloseButton.label}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`header-mobile-menu-backdrop absolute inset-0 bg-black/50 ${isOpen ? "is-open" : ""} ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      />

      <div
        onTransitionEnd={handlePanelTransitionEnd}
        className={`header-mobile-menu-panel fixed top-0 right-0 z-10 h-[100dvh] w-full max-w-[360px] overflow-y-auto bg-white text-[var(--foreground)] ${isOpen ? "is-open" : ""}`}
      >
        <div className="flex min-h-full flex-col px-6">
          <div className="flex h-[var(--header-height)] shrink-0 items-center justify-end">
            <button
              type="button"
              aria-label={headerMenuCloseButton.label}
              onClick={onClose}
              className="inline-flex cursor-pointer items-center justify-center"
            >
              <HeaderMaskGraphic src={headerMenuCloseButton.iconSrc} className={headerIconClassName} />
            </button>
          </div>

          <nav aria-label="Primary navigation" className="flex flex-col">
            <ul className="flex flex-col gap-[calc(32px*var(--gap-scale-y))]">
              {mobilePrimaryNavigationLinks
                .filter((link) => link.label !== "MEMBERSHIP" || isMembershipLinkVisible())
                .map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={onClose} className={primaryLinkClassName}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto pt-[calc(52px*var(--gap-scale-y))] pb-[calc(144px*var(--layout-scale-y))]">
            <nav aria-label="Secondary navigation">
              <ul className="flex flex-col gap-[calc(16px*var(--gap-scale-y))]">
                {mobileSecondaryNavigationLinks
                  .filter((link) => link.href !== "/contact" || isContactLinkVisible())
                  .map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={onClose} className={secondaryLinkClassName}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav
              aria-label="Social media"
              className="mt-[calc(144px*var(--layout-scale-y))] flex flex-wrap gap-[var(--header-icon-gap)]"
            >
              {footerContent.socialLinks.filter((link) => isSocialLinkVisible(link.label)).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-[var(--foreground)]"
                >
                  <HeaderMaskGraphic src={link.icon} className={headerIconClassName} />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
