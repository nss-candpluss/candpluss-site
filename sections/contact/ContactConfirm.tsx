"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  ContactTurnstile,
  type ContactTurnstileHandle,
} from "@/components/contact/ContactTurnstile";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { contactFormCopy, contactPageContent } from "@/data/contact";
import { getContactApiUrl } from "@/lib/paths";
import { formActionHalfSpanClassName } from "@/lib/layout";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { appendContactFormData } from "@/lib/contact/build-form-data";
import { buildContactConfirmRows } from "@/lib/contact/display";
import { writeContactTicketNumber } from "@/lib/contact/ticket-storage";
import { useContactFormDraft } from "@/lib/contact/use-contact-form-draft";
import {
  contactConfirmLabelClassName,
  contactConfirmRowClassName,
  contactConfirmSectionClassName,
  contactConfirmValueClassName,
  contactErrorClassName,
  contactInquiryBodyClassName,
  contactInquiryBodyWrapClassName,
  contactInquiryTitleClassName,
  contactTitleToContentGapClassName,
} from "@/sections/contact/contactStyles";
import {
  supportContactButtonClassName,
  supportContactSecondaryButtonClassName,
} from "@/sections/support/supportContactStyles";
import type { ContactApiResponse } from "@/types/contact";

export function ContactConfirm() {
  const router = useRouter();
  const formData = useContactFormDraft();
  const turnstileRef = useRef<ContactTurnstileHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (formData === null) {
      router.replace("/contact");
    }
  }, [formData, router]);

  if (formData == null) {
    return null;
  }

  const confirmedFormData = formData;
  const rows = buildContactConfirmRows(confirmedFormData);
  const { buttons, submit } = contactFormCopy;

  async function handleSubmit() {
    if (!turnstileToken) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      appendContactFormData(formData, confirmedFormData);
      formData.append("turnstileToken", turnstileToken);

      const response = await fetch(getContactApiUrl(), {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as ContactApiResponse | { message: string };

      if (!response.ok || !("ok" in result) || !result.ok) {
        const errorMessage = "message" in result ? result.message : undefined;
        const message =
          errorMessage === "Turnstile verification failed."
            ? "認証に失敗しました。時間をおいて再度お試しください。"
            : errorMessage || submit.failure;
        setSubmitError(message);
        turnstileRef.current?.reset();
        return;
      }

      writeContactTicketNumber("contact", result.ticketNumber);
      router.push("/contact/thanks");
    } catch {
      setSubmitError(submit.failure);
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className={contactInquiryTitleClassName}>
        {contactPageContent.confirmTitle}
      </h1>
      <div
        className={`${contactInquiryBodyWrapClassName} ${contactInquiryBodyClassName}`}
      >
        {contactPageContent.confirmIntroParagraphs.map((paragraph) => (
          <p key={paragraph} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>

      <div className={contactConfirmSectionClassName}>
        {rows.map((row) => (
          <div key={row.label} className={contactConfirmRowClassName}>
            <p className={contactConfirmLabelClassName}>{row.label}</p>
            <p className={`${contactTitleToContentGapClassName} ${contactConfirmValueClassName}`}>{row.value}</p>
          </div>
        ))}
      </div>

      {submitError ? (
        <p className={`mt-[calc(24px*var(--gap-scale-y))] ${contactErrorClassName}`} role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="mt-[calc(32px*var(--gap-scale-y))]">
        <ContactTurnstile ref={turnstileRef} onTokenChange={setTurnstileToken} />
      </div>

      <SiteGrid className="mt-[calc(32px*var(--gap-scale-y))] gap-[calc(16px*var(--gap-scale-x))]">
        <button
          type="button"
          className={`${supportContactSecondaryButtonClassName} ${formActionHalfSpanClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => router.push("/contact")}
          disabled={isSubmitting}
        >
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 rotate-180 bg-current"
            style={arrowMaskStyle}
          />
          {buttons.back}
        </button>
        <button
          type="button"
          className={`${supportContactButtonClassName} ${formActionHalfSpanClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={handleSubmit}
          disabled={isSubmitting || !turnstileToken}
        >
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
            style={arrowMaskStyle}
          />
          {isSubmitting ? buttons.submitting : buttons.submit}
        </button>
      </SiteGrid>
    </>
  );
}
