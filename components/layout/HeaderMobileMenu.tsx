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
import { uiText } from "@/lib/typography";

const headerIconClassName = "size-[24px]";

const primaryLinkClassName =
  `font-ui-en ${uiText(18)} font-bold text-[var(--foreground)] min-[1025px]:font-semibold`;

const secondaryLinkClassName =
  `font-body-ja ${uiText(13)} text-[var(--foreground)]`;

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
        className={`header-mobile-menu-panel fixed top-0 right-0 z-10 flex h-dvh max-h-dvh w-full max-w-[360px] flex-col bg-white text-[var(--foreground)] ${isOpen ? "is-open" : ""}`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6">
          <div className="flex min-h-full shrink-0 flex-col">
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

            <nav aria-label="Primary navigation" className="flex shrink-0 flex-col">
              <ul className="flex flex-col gap-[clamp(12px,3.5dvh,calc(32px*var(--gap-scale-y)))]">
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

            <div className="mt-auto flex shrink-0 flex-col pb-[max(env(safe-area-inset-bottom),clamp(16px,4dvh,calc(32px*var(--layout-scale-y))))]">
              <nav aria-label="Secondary navigation">
                <ul className="flex flex-col gap-[clamp(8px,2dvh,calc(16px*var(--gap-scale-y)))]">
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
                className="mt-[clamp(16px,3dvh,calc(24px*var(--gap-scale-y)))] flex flex-wrap gap-[var(--header-icon-gap)]"
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
      </div>
    </div>,
    document.body,
  );
}
