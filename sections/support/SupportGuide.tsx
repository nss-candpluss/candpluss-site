import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { supportContent } from "@/data/support";
import { isContactLinkVisible } from "@/lib/site-navigation-visibility";
import { bodyText, uiText } from "@/lib/typography";

import { SupportAccordion } from "@/sections/support/SupportAccordion";
import { arrowMaskStyle } from "@/lib/maskStyle";

const contactButtonArrowStyle = arrowMaskStyle;

const guideTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(20)}`;
const guideBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;
const contactButtonClassName = `font-body-ja inline-flex items-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] font-semibold text-white ${uiText(16)}`;

export function SupportGuide() {
  const { guide } = supportContent;

  return (
    <section
      data-header-theme="onLight"
      className="bg-white pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] text-[var(--foreground)]"
    >
      <Container>
        <div className="mx-auto w-full max-w-[1050px]">
          <h2 className={guideTitleClassName}>{guide.title}</h2>

          <p
            className={`${guideBodyClassName} mt-[calc(32px*var(--gap-scale-y))] whitespace-pre-line`}
          >
            {guide.body}
          </p>

          <div className="mt-[var(--section-title-gap)]">
            <SupportAccordion items={guide.accordions} />
          </div>

          {isContactLinkVisible() ? (
            <Link
              href={guide.contactButton.href}
              className={`${contactButtonClassName} mt-[var(--section-title-gap)] flex w-full bg-[var(--foreground)] px-[calc(24px*var(--gap-scale-x))] py-[calc(20px*var(--gap-scale-y))]`}
            >
              <span
                aria-hidden="true"
                className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
                style={contactButtonArrowStyle}
              />
              {guide.contactButton.label}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
