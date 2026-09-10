"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  ContactTurnstile,
  type ContactTurnstileHandle,
} from "@/components/contact/ContactTurnstile";
import { SiteGrid } from "@/components/ui/SiteGrid";
import { supportContactFormCopy, supportContactPageContent } from "@/data/support-contact";
import { getSupportContactApiUrl } from "@/lib/paths";
import { formActionHalfSpanClassName } from "@/lib/layout";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { writeContactTicketNumber } from "@/lib/contact/ticket-storage";
import { appendSupportContactFormData } from "@/lib/support-contact/build-form-data";
import { buildSupportContactConfirmRows } from "@/lib/support-contact/display";
import {
  clearSupportContactAttachments,
  loadSupportContactAttachments,
} from "@/lib/support-contact/attachment-store";
import { useSupportContactFormDraft } from "@/lib/support-contact/use-support-contact-form-draft";
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

export function SupportContactConfirm() {
  const router = useRouter();
  const formData = useSupportContactFormDraft();
  const turnstileRef = useRef<ContactTurnstileHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[] | null>(null);
  const [attachmentRestoreFailed, setAttachmentRestoreFailed] = useState(false);

  useEffect(() => {
    if (formData === null) {
      router.replace("/support");
    }
  }, [formData, router]);

  useEffect(() => {
    let active = true;

    loadSupportContactAttachments()
      .then((storedAttachments) => {
        if (active) {
          setAttachments(storedAttachments);
        }
      })
      .catch(() => {
        if (active) {
          setAttachments([]);
          setAttachmentRestoreFailed(true);
          setSubmitError(
            "添付画像を復元できませんでした。戻るボタンから画像を選び直してください。"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (formData == null || attachments === null) {
    return null;
  }

  const confirmedFormData = formData;
  const confirmedAttachments = attachments;
  const rows = buildSupportContactConfirmRows(
    confirmedFormData,
    confirmedAttachments
  );
  const { buttons, submit } = supportContactFormCopy;

  async function handleSubmit() {
    if (!turnstileToken || attachmentRestoreFailed) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      appendSupportContactFormData(payload, confirmedFormData);
      payload.append("turnstileToken", turnstileToken);

      for (const file of confirmedAttachments) {
        payload.append("attachments", file);
      }

      const response = await fetch(getSupportContactApiUrl(), {
        method: "POST",
        body: payload,
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

      writeContactTicketNumber("support", result.ticketNumber);
      router.push("/support/thanks");
      clearSupportContactAttachments();
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
        {supportContactPageContent.confirmTitle}
      </h1>
      <div
        className={`${contactInquiryBodyWrapClassName} ${contactInquiryBodyClassName}`}
      >
        {supportContactPageContent.confirmIntroParagraphs.map((paragraph) => (
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
          onClick={() => router.push("/support")}
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
          disabled={
            isSubmitting || !turnstileToken || attachmentRestoreFailed
          }
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
