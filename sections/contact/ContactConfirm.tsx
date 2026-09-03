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
import { formHalfSpanClassName } from "@/lib/layout";
import { appendContactFormData } from "@/lib/contact/build-form-data";
import {
  clearContactAttachments,
  getContactAttachments,
} from "@/lib/contact/attachment-store";
import { buildContactConfirmRows } from "@/lib/contact/display";
import { useContactFormDraft } from "@/lib/contact/use-contact-form-draft";
import { ContactHero } from "@/sections/contact/ContactHero";
import {
  contactErrorClassName,
  contactFormRowClassName,
  contactPrimaryButtonClassName,
  contactSecondaryButtonClassName,
} from "@/sections/contact/contactStyles";
import { bodyText, uiText } from "@/lib/typography";
import type { ContactApiResponse } from "@/types/contact";

const confirmLabelClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(16)}`;

const confirmValueClassName = `font-body-ja whitespace-pre-line text-[var(--foreground)] ${bodyText(15)}`;

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

  if (formData === null) {
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

      for (const file of getContactAttachments()) {
        formData.append("attachments", file);
      }

      const response = await fetch(getContactApiUrl(), {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as ContactApiResponse | { message: string };

      if (!response.ok || ("ok" in result && !result.ok)) {
        const errorMessage = "message" in result ? result.message : undefined;
        const message =
          errorMessage === "Turnstile verification failed."
            ? "認証に失敗しました。時間をおいて再度お試しください。"
            : "ok" in result && result.ok
              ? submit.failure
              : errorMessage || submit.failure;
        setSubmitError(message);
        turnstileRef.current?.reset();
        return;
      }

      router.push("/contact/thanks");
      clearContactAttachments();
    } catch {
      setSubmitError(submit.failure);
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ContactHero showIntro={false} title={contactPageContent.confirmTitle} />

      <div className="mt-[calc(48px*var(--gap-scale-y))] overflow-hidden bg-[#f5f5f5]">
        {rows.map((row) => (
          <div key={row.label} className={contactFormRowClassName}>
            <p className={confirmLabelClassName}>{row.label}</p>
            <p className={`mt-[calc(16px*var(--gap-scale-y))] ${confirmValueClassName}`}>{row.value}</p>
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

      <SiteGrid className="mt-[calc(32px*var(--gap-scale-y))] gap-[calc(16px*var(--gap-scale-y))]">
        <button
          type="button"
          className={`${contactSecondaryButtonClassName} ${formHalfSpanClassName}`}
          onClick={() => router.push("/contact")}
          disabled={isSubmitting}
        >
          {buttons.back}
        </button>
        <button
          type="button"
          className={`${contactPrimaryButtonClassName} ${formHalfSpanClassName}`}
          onClick={handleSubmit}
          disabled={isSubmitting || !turnstileToken}
        >
          {isSubmitting ? buttons.submitting : buttons.submit}
        </button>
      </SiteGrid>
    </>
  );
}
