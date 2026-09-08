import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { footerContent } from "@/data/footer";
import { supportContent } from "@/data/support";
import { fullSpanClassName, twoColumnFeatureSpanClassName } from "@/lib/layout";
import { arrowMaskStyle, maskGraphicStyle } from "@/lib/maskStyle";
import {
  isContactLinkVisible,
  isSocialLinkVisible,
} from "@/lib/site-navigation-visibility";
import { bodyText, uiText } from "@/lib/typography";

import { SupportAccordion } from "@/sections/support/SupportAccordion";

const contactButtonArrowStyle = arrowMaskStyle;

const contactButtonClassName = `font-body-ja inline-flex w-full items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] font-semibold text-white ${uiText(16)} bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] min-[1025px]:py-[calc(18px*var(--gap-scale-y))]`;

const phoneHeadingClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;
const phoneNumberClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(24)}`;
const phoneBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const lineLink = footerContent.socialLinks.find((link) => link.label === "LINE");

export function SupportGuide() {
  const { guide } = supportContent;
  const showLine = Boolean(lineLink) && isSocialLinkVisible("LINE");
  const showForm = isContactLinkVisible();
  const buttonSpanClassName =
    showLine && showForm ? twoColumnFeatureSpanClassName : fullSpanClassName;

  return (
    <section
      data-header-theme="onLight"
      data-support-guide
      className="relative z-20 bg-white pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] text-[var(--foreground)]"
    >
      <Container>
        <div className="mx-auto w-full max-w-[1050px]">
          <SupportAccordion items={guide.accordions} />

          {showLine || showForm ? (
            <SiteGrid className="mt-[var(--section-title-gap)] gap-[calc(32px*var(--gap-scale-x))]">
              {showLine && lineLink ? (
                <a
                  href={lineLink.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${contactButtonClassName} ${buttonSpanClassName}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
                    style={maskGraphicStyle(lineLink.icon)}
                  />
                  {guide.lineButton.label}
                </a>
              ) : null}

              {showForm ? (
                <Link
                  href={guide.contactButton.href}
                  className={`${contactButtonClassName} ${buttonSpanClassName}`}
                >
                  <span
                    aria-hidden="true"
                    className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
                    style={contactButtonArrowStyle}
                  />
                  {guide.contactButton.label}
                </Link>
              ) : null}
            </SiteGrid>
          ) : null}

          <section className="mt-[calc(60px*var(--gap-scale))]">
            <h2 className={phoneHeadingClassName}>{guide.phoneSection.title}</h2>
            <p className={`mt-[calc(24px*var(--gap-scale))] ${phoneNumberClassName}`}>
              <a href={`tel:${guide.phoneSection.phoneNumber}`}>
                {guide.phoneSection.phoneNumber}
              </a>
            </p>
            <p className={`mt-[calc(16px*var(--gap-scale))] ${phoneBodyClassName}`}>
              {guide.phoneSection.hours}
            </p>
            <p className={`mt-[calc(8px*var(--gap-scale-y))] ${phoneBodyClassName}`}>
              {guide.phoneSection.note}
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
