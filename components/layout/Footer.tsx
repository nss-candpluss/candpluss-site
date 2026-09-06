import Link from "next/link";

import { hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { footerContent } from "@/data/footer";
import { isContactLinkVisible, isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { uiText } from "@/lib/typography";

const snsIconMaskStyle = maskGraphicStyle;

const primaryLinkClassName = `font-body-ja ${uiText(14)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const legalLinkClassName = `font-body-ja ${uiText(13)} text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const navLinkClassName = `${hoverUnderlineHoverClassName} font-ui-en ${uiText(16)} font-medium text-[var(--foreground)]`;

const copyrightClassName = `font-ui-en ${uiText(13)} font-bold text-[var(--foreground)]`;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = footerContent.socialLinks.filter((link) => isSocialLinkVisible(link.label));

  return (
    <footer
      data-header-theme="onLight"
      className="border-t border-[var(--color-divider)] bg-white text-[var(--foreground)]"
    >
      <div className="flex flex-col gap-6 px-[var(--container-x)] py-12 md:gap-8 md:py-16">
        <Link
          href={footerContent.logo.href}
          aria-label={footerContent.logo.label}
          className="inline-flex w-fit items-center"
        >
          <span
            aria-hidden="true"
            className="block h-[calc(32px*var(--text-scale))] w-[calc(130px*var(--text-scale))] shrink-0 bg-current"
            style={maskGraphicStyle(footerContent.logo.src)}
          />
        </Link>

        <nav
          aria-label="Footer page links"
          className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:gap-x-[calc(32px*var(--gap-scale-x))]"
        >
          {footerContent.navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClassName}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav
          aria-label="Footer navigation"
          className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:gap-x-[calc(32px*var(--gap-scale-x))]"
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
          className="flex flex-col gap-y-4 md:hidden"
        >
          {footerContent.legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className={legalLinkClassName}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-x-[calc(32px*var(--gap-scale-x))]">
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

          <nav
            aria-label="Social media"
            className="flex flex-wrap items-center gap-[var(--header-icon-gap)]"
          >
            {socialLinks.map((link) => (
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
                  className="block size-[28px] bg-current"
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
