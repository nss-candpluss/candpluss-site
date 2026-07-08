"use client";

import Link from "next/link";
import { useEffect } from "react";

import { contactPageContent, contactFormCopy } from "@/data/contact";
import { clearContactAttachments } from "@/lib/contact/attachment-store";
import { clearContactFormDraft } from "@/lib/contact/form-storage";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { contactArrowPrimaryButtonClassName } from "@/sections/contact/contactStyles";
import { bodyText } from "@/lib/typography";

const thanksTitleClassName =
  "font-body-ja font-semibold text-[var(--foreground)] text-[calc(24px*var(--text-scale))] leading-[calc(32px*var(--text-scale))]";

const thanksBodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

const thanksBodyNoteClassName = `mt-[calc(8px*var(--gap-scale-y))] block font-body-ja text-[var(--color-muted)] ${bodyText(14)}`;

export function ContactThanks() {
  useEffect(() => {
    clearContactFormDraft();
    clearContactAttachments();
  }, []);

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className={`text-left min-[431px]:text-center ${thanksTitleClassName}`}>
        {contactPageContent.thanksTitle}
      </h1>

      <p
        className={`mt-[calc(60px*var(--gap-scale-y))] text-left min-[431px]:text-center ${thanksBodyClassName}`}
      >
        {contactPageContent.thanksBodyIntro.map((line, index) => (
          <span key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
        <span className={thanksBodyNoteClassName}>{contactPageContent.thanksBodyAutoReplyNote}</span>
        <br />
        {contactPageContent.thanksBodyOutro.map((line, index) => (
          <span key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>

      <div className="mt-[calc(72px*var(--gap-scale-y))] mx-auto max-w-[480px]">
        <Link href="/" className={contactArrowPrimaryButtonClassName}>
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
            style={arrowMaskStyle}
          />
          {contactFormCopy.buttons.backToTop}
        </Link>
      </div>
    </div>
  );
}
