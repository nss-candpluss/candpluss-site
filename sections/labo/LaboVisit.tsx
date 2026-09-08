import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { footerContent } from "@/data/footer";
import { laboVisitContent } from "@/data/labo";
import { fullSpanClassName, twoColumnFeatureSpanClassName } from "@/lib/layout";
import { arrowMaskStyle, maskGraphicStyle } from "@/lib/maskStyle";
import {
  isContactLinkVisible,
  isSocialLinkVisible,
} from "@/lib/site-navigation-visibility";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

const contactButtonClassName = `font-body-ja inline-flex w-full items-center justify-center gap-x-[calc(8px*var(--gap-scale-x))] gap-y-[calc(8px*var(--gap-scale-y))] font-semibold text-white ${uiText(16)} bg-[var(--foreground)] px-[calc(32px*var(--gap-scale-x))] py-[calc(32px*var(--layout-scale-y))] min-[1025px]:py-[calc(18px*var(--gap-scale-y))]`;

const lineLink = footerContent.socialLinks.find((link) => link.label === "LINE");

export function LaboVisit() {
  const { title, label, body, notes, lineButton, contactButton } = laboVisitContent;
  const showLine = Boolean(lineLink) && isSocialLinkVisible("LINE");
  const showForm = isContactLinkVisible();
  const buttonSpanClassName =
    showLine && showForm ? twoColumnFeatureSpanClassName : fullSpanClassName;

  return (
    <section
      data-header-theme="onLight"
      data-labo-visit
      className="bg-[var(--background)] pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] text-[var(--foreground)]"
    >
      <Container>
        <div>
          <p className={`font-ui-en font-medium opacity-[0.65] ${uiText(18)}`}>
            {label}
          </p>
          <h2
            className={`mt-[calc(32px*var(--gap-scale-y))] font-heading ${sectionTitle62ClassName}`}
          >
            {title}
          </h2>
        </div>

        <p
          className={`mt-[calc(98px*var(--layout-scale-y))] font-body-ja ${bodyText(16)}`}
        >
          {body}
        </p>

        <ul className="mt-[calc(42px*var(--gap-scale-y))] flex flex-col gap-[calc(12px*var(--gap-scale-y))]">
          {notes.map((note) => (
            <li
              key={note}
              className={`font-body-ja text-[var(--color-muted)] ${bodyText(14)}`}
            >
              {note}
            </li>
          ))}
        </ul>

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
                {lineButton.label}
              </a>
            ) : null}

            {showForm ? (
              <Link
                href={contactButton.href}
                className={`${contactButtonClassName} ${buttonSpanClassName}`}
              >
                <span
                  aria-hidden="true"
                  className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
                  style={arrowMaskStyle}
                />
                {contactButton.label}
              </Link>
            ) : null}
          </SiteGrid>
        ) : null}
      </Container>
    </section>
  );
}
