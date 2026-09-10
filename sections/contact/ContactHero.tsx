import { contactPageContent } from "@/data/contact";
import { footerContent } from "@/data/footer";
import { supportContent } from "@/data/support";
import { maskGraphicStyle } from "@/lib/maskStyle";
import { isSocialLinkVisible } from "@/lib/site-navigation-visibility";
import { sectionTitle62ClassName, uiText } from "@/lib/typography";
import {
  contactInquiryBodyClassName,
  contactInquiryBodyWrapClassName,
  contactInquiryTitleClassName,
} from "@/sections/contact/contactStyles";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";

const TOLL_FREE_ICON_SRC = "/assets/icons/icon-tollfree.svg";

const phoneNumberClassName = `font-ui-en font-bold text-[var(--foreground)] ${uiText(24)}`;
const contactIntroNoteClassName =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";
const contactIntroNoteFirstClassName = "mt-[calc(24px*var(--gap-scale))]";
const contactIntroNoteFollowingClassName =
  "mt-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)]";
const contactLineButtonAreaGapClassName =
  "mt-[clamp(32px,calc(60px*var(--gap-scale)),60px)]";

const lineLink = footerContent.socialLinks.find((link) => link.label === "LINE");

export function ContactHero() {
  const { title, formTitle, introParagraphs, introNotes, mailDomainNote } =
    contactPageContent;
  const { phoneSection } = supportContent.guide;
  const showLine = Boolean(lineLink) && isSocialLinkVisible("LINE");

  return (
    <>
      <h1 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>{title}</h1>

      <div className="mt-[var(--section-title-gap)]">
        <h2 className={contactInquiryTitleClassName}>
          {phoneSection.title}
        </h2>
        <p className={`mt-[calc(32px*var(--gap-scale))] ${phoneNumberClassName}`}>
          <a
            href={`tel:${phoneSection.phoneNumber}`}
            className="inline-flex items-center gap-x-[calc(8px*var(--gap-scale-x))]"
          >
            <span
              aria-hidden="true"
              className="h-[1em] w-[calc(1em*120/78.317)] shrink-0 bg-current"
              style={maskGraphicStyle(TOLL_FREE_ICON_SRC)}
            />
            {phoneSection.phoneNumber}
          </a>
        </p>
        <p className={`mt-[calc(16px*var(--gap-scale))] ${contactInquiryBodyClassName}`}>
          {phoneSection.hours.split(phoneSection.hoursEmphasis)[0]}
          <span className="font-semibold">
            {phoneSection.hoursEmphasis}
          </span>
        </p>
        <p
          className={`mt-[calc(8px*var(--gap-scale-y))] ${contactIntroNoteClassName}`}
        >
          {phoneSection.note}
        </p>
      </div>

      {showLine && lineLink ? (
        <a
          href={lineLink.href}
          target="_blank"
          rel="noreferrer"
          className={`${supportContactButtonClassName} ${contactLineButtonAreaGapClassName} max-w-[400px]`}
        >
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
            style={maskGraphicStyle(lineLink.icon)}
          />
          {supportContent.guide.lineButton.label}
        </a>
      ) : null}

      <div className={contactLineButtonAreaGapClassName}>
        <h3 className={contactInquiryTitleClassName}>{formTitle}</h3>
        <div
          className={`${contactInquiryBodyWrapClassName} ${contactInquiryBodyClassName}`}
        >
          {introParagraphs.map((paragraph) => (
            <p key={paragraph} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
        {introNotes.map((note, index) => (
          <p
            key={note}
            className={`${contactIntroNoteClassName} ${
              index === 0
                ? contactIntroNoteFirstClassName
                : contactIntroNoteFollowingClassName
            }`}
          >
            {note.includes(mailDomainNote) ? (
              <>
                {note.split(mailDomainNote)[0]}
                <span className="font-semibold">{mailDomainNote}</span>
                {note.split(mailDomainNote)[1]}
              </>
            ) : (
              note
            )}
          </p>
        ))}
      </div>
    </>
  );
}
