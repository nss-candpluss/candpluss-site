"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  ContactImageAttachments,
  createAttachmentPreviews,
  type ContactAttachmentPreview,
} from "@/components/contact/ContactImageAttachments";
import { SiteGrid } from "@/components/ui/SiteGrid";
import {
  contactFieldRequirements,
  contactFieldNotes,
  contactFormCopy,
  contactPageContent,
  japanesePrefectures,
} from "@/data/contact";
import { validateContactAttachments } from "@/lib/contact/attachment-validation";
import { CONTACT_FIELD_MAX_LENGTH } from "@/lib/contact/contact-field-validation";
import {
  CONTACT_FORM_TOUCHABLE_FIELDS,
  getContactFieldStatus,
  getContactFormFieldErrors,
} from "@/lib/contact/field-status";
import { getContactAttachments, setContactAttachments } from "@/lib/contact/attachment-store";
import { writeContactFormDraft } from "@/lib/contact/form-storage";
import { lookupAddressByPostalCode } from "@/lib/contact/postal-code";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { formHalfSpanClassName } from "@/lib/layout";
import { CONTACT_ERROR_SCROLL_ANCHORS, scrollToFirstContactFormError } from "@/lib/contact/scroll-to-error";
import { useContactFormDraft } from "@/lib/contact/use-contact-form-draft";
import { validateContactForm } from "@/lib/contact/validate-form";
import { ContactField } from "@/sections/contact/ContactField";
import {
  contactArrowPrimaryButtonClassName,
  contactFormSectionClassName,
  contactSelectChevronStyle,
  getContactCheckboxClassName,
  getContactFieldClassName,
  getContactSelectClassName,
} from "@/sections/contact/contactStyles";
import {
  CONTACT_CATEGORIES,
  createEmptyContactFormData,
  type ContactCategory,
  type ContactFormData,
  type ContactFormFieldKey,
} from "@/types/contact";

export function ContactForm() {
  const router = useRouter();
  const storedDraft = useContactFormDraft();
  const [editedForm, setEditedForm] = useState<ContactFormData | null>(null);
  const activeForm = editedForm ?? storedDraft ?? createEmptyContactFormData();
  const [touchedFields, setTouchedFields] = useState<Set<ContactFormFieldKey>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fieldErrors = useMemo(() => getContactFormFieldErrors(activeForm), [activeForm]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ContactAttachmentPreview[]>(() =>
    createAttachmentPreviews(getContactAttachments())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function markFieldTouched(key: ContactFormFieldKey) {
    setTouchedFields((current) => {
      if (current.has(key)) {
        return current;
      }

      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  function isFieldTouched(key: ContactFormFieldKey): boolean {
    return submitAttempted || touchedFields.has(key);
  }

  function getVisibleFieldError(key: ContactFormFieldKey): string | undefined {
    return isFieldTouched(key) ? fieldErrors[key] : undefined;
  }

  function getFieldStatus(key: ContactFormFieldKey) {
    return getContactFieldStatus(key, activeForm, isFieldTouched(key), fieldErrors);
  }

  function updateField<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    markFieldTouched(key);
    setEditedForm((current) => ({
      ...(current ?? storedDraft ?? createEmptyContactFormData()),
      [key]: value,
    }));
  }

  async function applyAddressFromPostalCode(rawPostalCode: string) {
    const normalized = rawPostalCode.replace(/\D/g, "");

    if (normalized.length !== 7) {
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[contact-postal] apply lookup", normalized);
    }

    const result = await lookupAddressByPostalCode(normalized);

    if (!result) {
      if (process.env.NODE_ENV === "development") {
        console.log("[contact-postal] apply lookup skipped: no result");
      }
      return;
    }

    setEditedForm((current) => {
      const base = current ?? storedDraft ?? createEmptyContactFormData();

      return {
        ...base,
        postalCode: rawPostalCode,
        prefecture: result.prefecture || base.prefecture,
        addressLine1: result.addressLine1 || base.addressLine1,
      };
    });
  }

  function handlePostalCodeChange(value: string) {
    updateField("postalCode", value);

    const normalized = value.replace(/\D/g, "");

    if (normalized.length === 7) {
      void applyAddressFromPostalCode(value);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitAttempted(true);
    setTouchedFields(new Set(CONTACT_FORM_TOUCHABLE_FIELDS));

    const validation = validateContactForm(activeForm);

    if (!validation.ok) {
      scrollToFirstContactFormError(validation.errors);
      return;
    }

    const attachmentValidation = validateContactAttachments(
      attachments.map((attachment) => attachment.file)
    );

    if (!attachmentValidation.ok) {
      setAttachmentError(attachmentValidation.message);
      return;
    }

    setIsSubmitting(true);
    setContactAttachments(attachments.map((attachment) => attachment.file));
    writeContactFormDraft(activeForm);
    router.push("/contact/confirm");
  }

  function handleAttachmentsChange(nextAttachments: ContactAttachmentPreview[]) {
    setAttachments(nextAttachments);
    setContactAttachments(nextAttachments.map((attachment) => attachment.file));
  }

  const { fieldLabels, placeholders, privacy, buttons } = contactFormCopy;

  return (
    <form noValidate onSubmit={handleSubmit} className={contactFormSectionClassName}>
      <ContactField
        label={fieldLabels.category}
        requirement={contactFieldRequirements.category}
        htmlFor="contact-category"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.category}
        error={getVisibleFieldError("category")}
      >
        <select
          id="contact-category"
          name="category"
          value={activeForm.category}
          onChange={(event) => updateField("category", event.target.value as ContactCategory | "")}
          className={getContactSelectClassName(getFieldStatus("category"))}
          style={contactSelectChevronStyle}
          aria-required="true"
          aria-invalid={getFieldStatus("category") === "invalid"}
        >
          <option value="">{placeholders.category}</option>
          {CONTACT_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </ContactField>

      <ContactField
        label={fieldLabels.name}
        requirement={contactFieldRequirements.name}
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.lastName}
        error={getVisibleFieldError("lastName") || getVisibleFieldError("firstName")}
      >
        <SiteGrid className="gap-[calc(12px*var(--gap-scale-y))]">
          <div className={formHalfSpanClassName}>
            <label htmlFor="contact-last-name" className="sr-only">
              {placeholders.lastName}
            </label>
            <input
              id="contact-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={activeForm.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder={placeholders.lastName}
              maxLength={CONTACT_FIELD_MAX_LENGTH.lastName}
              className={getContactFieldClassName(getFieldStatus("lastName"))}
              aria-required="true"
              aria-invalid={getFieldStatus("lastName") === "invalid"}
            />
          </div>
          <div className={formHalfSpanClassName}>
            <label htmlFor="contact-first-name" className="sr-only">
              {placeholders.firstName}
            </label>
            <input
              id="contact-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={activeForm.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder={placeholders.firstName}
              maxLength={CONTACT_FIELD_MAX_LENGTH.firstName}
              className={getContactFieldClassName(getFieldStatus("firstName"))}
              aria-required="true"
              aria-invalid={getFieldStatus("firstName") === "invalid"}
            />
          </div>
        </SiteGrid>
      </ContactField>

      <ContactField
        label={fieldLabels.email}
        requirement={contactFieldRequirements.email}
        htmlFor="contact-email"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.email}
        note={contactFieldNotes.email}
        error={getVisibleFieldError("email")}
      >
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={activeForm.email}
          onChange={(event) => updateField("email", event.target.value)}
          className={getContactFieldClassName(getFieldStatus("email"))}
          aria-required="true"
          aria-invalid={getFieldStatus("email") === "invalid"}
        />
      </ContactField>

      <ContactField
        label={fieldLabels.emailConfirm}
        requirement={contactFieldRequirements.email}
        htmlFor="contact-email-confirm"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.emailConfirm}
        error={getVisibleFieldError("emailConfirm")}
      >
        <input
          id="contact-email-confirm"
          name="emailConfirm"
          type="email"
          autoComplete="off"
          inputMode="email"
          value={activeForm.emailConfirm}
          onChange={(event) => updateField("emailConfirm", event.target.value)}
          className={getContactFieldClassName(getFieldStatus("emailConfirm"))}
          aria-required="true"
          aria-invalid={getFieldStatus("emailConfirm") === "invalid"}
        />
      </ContactField>

      <ContactField
        label={fieldLabels.phone}
        requirement={contactFieldRequirements.phone}
        htmlFor="contact-phone"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.phone}
        error={getVisibleFieldError("phone")}
      >
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="numeric"
          value={activeForm.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder={placeholders.phone}
          className={getContactFieldClassName(getFieldStatus("phone"))}
          aria-invalid={getFieldStatus("phone") === "invalid"}
        />
      </ContactField>

      <ContactField
        label={fieldLabels.postalCode}
        requirement={contactFieldRequirements.postalCode}
        htmlFor="contact-postal-code"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.postalCode}
        note={contactFieldNotes.postalCode}
        error={getVisibleFieldError("postalCode")}
      >
        <div className="max-w-[240px]">
          <input
            id="contact-postal-code"
            name="postalCode"
            type="text"
            autoComplete="postal-code"
            inputMode="numeric"
            value={activeForm.postalCode}
            onChange={(event) => handlePostalCodeChange(event.target.value)}
            onBlur={(event) => {
              markFieldTouched("postalCode");
              void applyAddressFromPostalCode(event.target.value);
            }}
            className={getContactFieldClassName(getFieldStatus("postalCode"))}
            aria-invalid={getFieldStatus("postalCode") === "invalid"}
          />
        </div>
      </ContactField>

      <ContactField
        label={fieldLabels.address}
        requirement={contactFieldRequirements.address}
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.prefecture}
        error={
          getVisibleFieldError("prefecture") ||
          getVisibleFieldError("addressLine1") ||
          getVisibleFieldError("addressLine2")
        }
      >
        <div className="flex flex-col gap-[calc(12px*var(--gap-scale-y))]">
          <div>
            <label htmlFor="contact-prefecture" className="sr-only">
              {placeholders.prefecture}
            </label>
            <select
              id="contact-prefecture"
              name="prefecture"
              value={activeForm.prefecture}
              onChange={(event) => updateField("prefecture", event.target.value)}
              className={getContactSelectClassName(getFieldStatus("prefecture"))}
              style={contactSelectChevronStyle}
              aria-invalid={getFieldStatus("prefecture") === "invalid"}
            >
              <option value="">{placeholders.prefecture}</option>
              {japanesePrefectures.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-address-line-1" className="sr-only">
              {placeholders.addressLine1}
            </label>
            <input
              id="contact-address-line-1"
              name="addressLine1"
              type="text"
              autoComplete="address-line1"
              value={activeForm.addressLine1}
              onChange={(event) => updateField("addressLine1", event.target.value)}
              placeholder={placeholders.addressLine1}
              maxLength={CONTACT_FIELD_MAX_LENGTH.addressLine1}
              className={getContactFieldClassName(getFieldStatus("addressLine1"))}
              aria-invalid={getFieldStatus("addressLine1") === "invalid"}
            />
          </div>
          <div>
            <label htmlFor="contact-address-line-2" className="sr-only">
              {placeholders.addressLine2}
            </label>
            <input
              id="contact-address-line-2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              value={activeForm.addressLine2}
              onChange={(event) => updateField("addressLine2", event.target.value)}
              placeholder={placeholders.addressLine2}
              maxLength={CONTACT_FIELD_MAX_LENGTH.addressLine2}
              className={getContactFieldClassName(getFieldStatus("addressLine2"))}
              aria-invalid={getFieldStatus("addressLine2") === "invalid"}
            />
          </div>
        </div>
      </ContactField>

      <ContactField
        label={fieldLabels.message}
        requirement={contactFieldRequirements.message}
        htmlFor="contact-message"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.message}
        note={contactFieldNotes.message}
        error={getVisibleFieldError("message")}
      >
        <textarea
          id="contact-message"
          name="message"
          value={activeForm.message}
          onChange={(event) => updateField("message", event.target.value)}
          rows={8}
          maxLength={CONTACT_FIELD_MAX_LENGTH.message}
          className={`${getContactFieldClassName(getFieldStatus("message"))} min-h-[calc(200px*var(--layout-scale-y))] resize-y`}
          aria-required="true"
          aria-invalid={getFieldStatus("message") === "invalid"}
        />
      </ContactField>

      <ContactImageAttachments
        attachments={attachments}
        onChange={handleAttachmentsChange}
        error={attachmentError}
        onError={setAttachmentError}
      />

      <ContactField
        label={fieldLabels.privacy}
        requirement={contactFieldRequirements.privacy}
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.privacyAccepted}
        error={getVisibleFieldError("privacyAccepted")}
      >
        <label className="inline-flex cursor-pointer items-start gap-[calc(12px*var(--gap-scale-x))]">
          <input
            id="contact-privacy-accepted"
            type="checkbox"
            name="privacyAccepted"
            checked={activeForm.privacyAccepted}
            onChange={(event) => updateField("privacyAccepted", event.target.checked)}
            className={getContactCheckboxClassName(getFieldStatus("privacyAccepted"))}
            aria-required="true"
            aria-invalid={getFieldStatus("privacyAccepted") === "invalid"}
          />
          <span className="font-body-ja text-[calc(15px*var(--text-scale))] leading-[calc(26px*var(--text-scale))] text-[var(--foreground)]">
            <Link
              href={contactPageContent.privacyPolicyHref}
              className="underline decoration-solid underline-offset-[calc(4/15*1em)]"
            >
              {privacy.linkLabel}
            </Link>
            {privacy.labelAfterLink}
          </span>
        </label>
      </ContactField>

      <div className="px-[calc(16px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] md:px-[calc(24px*var(--gap-scale-x))]">
        <button type="submit" className={contactArrowPrimaryButtonClassName} disabled={isSubmitting}>
          <span
            aria-hidden="true"
            className="size-[calc(24px*var(--text-scale))] shrink-0 bg-current"
            style={arrowMaskStyle}
          />
          {buttons.toConfirm}
        </button>
      </div>
    </form>
  );
}
