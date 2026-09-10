import { Container } from "@/components/ui/Container";
import { footerContent } from "@/data/footer";
import { supportContent } from "@/data/support";
import { supportContactPageContent } from "@/data/support-contact";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { bodyText, sectionTitle62ClassName, uiText } from "@/lib/typography";

import { SupportAccordion } from "@/sections/support/SupportAccordion";
import { SupportContactForm } from "@/sections/support/SupportContactForm";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";

const TOLL_FREE_ICON_SRC = "/assets/icons/icon-tollfree.svg";

const supportContactTitleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(20)}`;
const phoneNumberClassName = `font-ui-en font-bold text-[var(--foreground)] ${uiText(24)}`;
const phoneBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;
const supportIntroNoteClassName =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";
const supportIntroNoteFirstClassName = "mt-[calc(24px*var(--gap-scale))]";
const supportIntroNoteFollowingClassName =
  "mt-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)]";
const supportLineButtonAreaGapClassName =
  "mt-[clamp(32px,calc(60px*var(--gap-scale)),60px)]";
const supportSectionClassName =
  "pt-[var(--container-y-top)] pb-[var(--container-y-bottom)] text-[var(--foreground)]";
const supportAccordionSectionClassName = `bg-white ${supportSectionClassName}`;
const supportContactSectionClassName = `bg-[#f5f5f5] ${supportSectionClassName}`;

const lineLink = footerContent.socialLinks.find((link) => link.label === "LINE");

export function SupportGuide() {
  const { guide } = supportContent;
  const showLine = Boolean(lineLink) && isSocialLinkVisible("LINE");

  return (
    <div data-support-guide className="relative z-20">
      <section
        data-header-theme="onLight"
        data-support-accordion
        className={supportAccordionSectionClassName}
      >
        <Container>
          <div className="mx-auto w-full max-w-[1050px]">
            <SupportAccordion items={guide.accordions} />
          </div>
        </Container>
      </section>

      <section
        data-header-theme="onLight"
        data-support-contact
        className={supportContactSectionClassName}
      >
        <Container>
          <div className="mx-auto w-full max-w-[1050px]">
            <h2
              className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}
            >
              {supportContactPageContent.sectionTitle}
            </h2>

            <div className="mt-[var(--section-title-gap)]">
              <h3 className={supportContactTitleClassName}>
                {guide.phoneSection.title}
              </h3>
              <p className={`mt-[calc(32px*var(--gap-scale))] ${phoneNumberClassName}`}>
                <a
                  href={`tel:${guide.phoneSection.phoneNumber}`}
                  className="inline-flex items-center gap-x-[calc(8px*var(--gap-scale-x))]"
                >
                  <span
                    aria-hidden="true"
                    className="h-[1em] w-[calc(1em*120/78.317)] shrink-0 bg-current"
                    style={maskGraphicStyle(TOLL_FREE_ICON_SRC)}
                  />
                  {guide.phoneSection.phoneNumber}
                </a>
              </p>
              <p className={`mt-[calc(16px*var(--gap-scale))] ${phoneBodyClassName}`}>
                {guide.phoneSection.hours.split(guide.phoneSection.hoursEmphasis)[0]}
                <span className="font-semibold">
                  {guide.phoneSection.hoursEmphasis}
                </span>
              </p>
              <p
                className={`mt-[calc(8px*var(--gap-scale-y))] ${supportIntroNoteClassName}`}
              >
                {guide.phoneSection.note}
              </p>
            </div>

            {showLine && lineLink ? (
              <a
                href={lineLink.href}
                target="_blank"
                rel="noreferrer"
                className={`${supportContactButtonClassName} ${supportLineButtonAreaGapClassName} max-w-[400px]`}
              >
                <span
                  aria-hidden="true"
                  className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
                  style={maskGraphicStyle(lineLink.icon)}
                />
                {guide.lineButton.label}
              </a>
            ) : null}

            <div
              id={supportContactPageContent.sectionId}
              className={`scroll-mt-[var(--header-height)] ${supportLineButtonAreaGapClassName}`}
            >
              <h3 className={supportContactTitleClassName}>
                {supportContactPageContent.title}
              </h3>
              <div
                className={`mt-[calc(24px*var(--gap-scale))] flex flex-col gap-[calc(24px*var(--gap-scale-y))] ${phoneBodyClassName}`}
              >
                {supportContactPageContent.introParagraphs.map((paragraph) => (
                  <p key={paragraph} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
              {supportContactPageContent.introNotes.map((note, index) => (
                <p
                  key={note}
                  className={`${supportIntroNoteClassName} ${
                    index === 0
                      ? supportIntroNoteFirstClassName
                      : supportIntroNoteFollowingClassName
                  }`}
                >
                  {note.includes(supportContactPageContent.mailDomainNote) ? (
                    <>
                      {note.split(supportContactPageContent.mailDomainNote)[0]}
                      <span className="font-semibold">
                        {supportContactPageContent.mailDomainNote}
                      </span>
                      {note.split(supportContactPageContent.mailDomainNote)[1]}
                    </>
                  ) : (
                    note
                  )}
                </p>
              ))}
              <SupportContactForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
