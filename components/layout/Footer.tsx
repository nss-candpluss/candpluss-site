import Link from "next/link";

import { hoverUnderlineHoverClassName } from "@/components/ui/TextLink";
import { footerContent } from "@/data/footer";
import { isContactLinkVisible, isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { uiTextRange } from "@/lib/typography";

const snsIconMaskStyle = maskGraphicStyle;

const primaryLinkClassName = `${hoverUnderlineHoverClassName} font-body-ja text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[clamp(13px,calc(14px*var(--text-scale)),14px)] text-[var(--foreground)]`;

const legalLinkClassName = "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[clamp(12px,calc(13px*var(--text-scale)),13px)] text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60";

const navLinkClassName = `font-ui-en ${uiTextRange("14-16")} font-medium text-[var(--foreground)] transition-opacity duration-300 hover:opacity-60`;

const copyrightClassName = "font-ui-en text-[13px] leading-[13px] font-bold text-[var(--foreground)]";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = footerContent.socialLinks.filter((link) => isSocialLinkVisible(link.label));

  return (
    <footer
      data-header-theme="onLight"
      className="bg-white text-[var(--foreground)]"
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

        <div>
          <nav
            aria-label="Footer page links"
            className="flex flex-wrap gap-x-[calc(32px*var(--gap-scale-x))] gap-y-4"
          >
            {footerContent.navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClassName}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="my-[48px] h-px w-full bg-[var(--color-divider)]" aria-hidden="true" />

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
        </div>

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
