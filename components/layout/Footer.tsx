import Link from "next/link";

import { hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { footerContent } from "@/data/footer";
import { isContactLinkVisible, isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

const snsIconMaskStyle = maskGraphicStyle;

const primaryLinkClassName = `${hoverUnderlineHoverClassName} font-body-ja ${uiText(14)} text-[var(--foreground)]`;

const legalLinkClassName = `font-body-ja ${uiText(13)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const copyrightClassName = `font-ui-en font-bold ${uiText(13)} text-[var(--foreground)]`;

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      data-header-theme="onLight"
      className="bg-white text-[var(--foreground)]"
    >
      <div className="px-[var(--container-x)] py-12 md:py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-x-[calc(32px*var(--gap-scale-x))] md:gap-y-0">
          <div className="flex flex-col gap-6 md:gap-8">
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-[calc(32px*var(--gap-scale-x))] gap-y-4"
            >
              {footerContent.primaryLinks
                .filter((link) => link.href !== "/contact" || isContactLinkVisible())
                .map((link) => (
                <Link key={link.href} href={link.href} className={primaryLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <nav
              aria-label="Legal links"
              className="flex flex-wrap gap-x-[calc(32px*var(--gap-scale-x))] gap-y-4 md:hidden"
            >
              {footerContent.legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className={legalLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden flex-wrap items-center gap-x-[calc(32px*var(--gap-scale-x))] gap-y-4 md:flex">
              <p className={copyrightClassName}>
                {footerContent.copyright} {currentYear}
              </p>
              {footerContent.legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className={legalLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <nav
            aria-label="Social media"
            className="flex flex-wrap items-center gap-[var(--header-icon-gap)]"
          >
            {footerContent.socialLinks.filter((link) => isSocialLinkVisible(link.label)).map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-label={link.label}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="block size-[24px] bg-current"
                  style={snsIconMaskStyle(link.icon)}
                />
              </a>
            ))}
          </nav>

          <p className={`${copyrightClassName} md:hidden`}>
            {footerContent.copyright} {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
