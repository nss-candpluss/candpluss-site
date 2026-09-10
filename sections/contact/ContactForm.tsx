"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";

import { SiteGrid } from "@/components/ui/SiteGrid";
import {
  contactFieldRequirements,
  contactFieldNotes,
  contactFormCopy,
  contactPageContent,
  japanesePrefectures,
} from "@/data/contact";
import {
  CONTACT_FIELD_MAX_LENGTH,
  CONTACT_PHONE_MAX_INPUT_LENGTH,
} from "@/lib/contact/contact-field-validation";
import {
  CONTACT_FORM_TOUCHABLE_FIELDS,
  getContactFieldStatus,
  getContactFormFieldErrors,
  type ContactFieldStatus,
} from "@/lib/contact/field-status";
import { writeContactFormDraft } from "@/lib/contact/form-storage";
import { normalizeContactNumberInput } from "@/lib/contact/input-normalization";
import { lookupAddressByPostalCode } from "@/lib/contact/postal-code";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { formHalfSpanClassName } from "@/lib/layout";
import { CONTACT_ERROR_SCROLL_ANCHORS, scrollToFirstContactFormError } from "@/lib/contact/scroll-to-error";
import { useContactFormDraft } from "@/lib/contact/use-contact-form-draft";
import { validateContactForm } from "@/lib/contact/validate-form";
import { ContactField } from "@/sections/contact/ContactField";
import { getContactSelectClassName } from "@/sections/contact/contactStyles";
import {
  SupportFloatingInput,
  SupportTextarea,
} from "@/sections/support/SupportFloatingField";
import { supportContactButtonClassName } from "@/sections/support/supportContactStyles";
import {
  CONTACT_CATEGORIES,
  createEmptyContactFormData,
  type ContactCategory,
  type ContactFormData,
  type ContactFormFieldKey,
} from "@/types/contact";

function getSupportStyleSelectClassName(status: ContactFieldStatus): string {
  return `${getContactSelectClassName(status)} rounded-[8px] pl-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)] pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]`;
}

function getSupportStyleSelectInlineStyle(hasValue: boolean): CSSProperties {
  return {
    color: "var(--foreground)",
    fontSize: "16px",
    lineHeight: "1.3",
    fontWeight: hasValue ? 600 : 400,
    minHeight:
      "calc(26px + clamp(12px, calc(20px * var(--gap-scale-y)), 20px) + clamp(10px, calc(16px * var(--gap-scale-y)), 16px))",
  };
}

export function ContactForm() {
  const router = useRouter();
  const storedDraft = useContactFormDraft();
  const [editedForm, setEditedForm] = useState<ContactFormData | null>(null);
  const activeForm = editedForm ?? storedDraft ?? createEmptyContactFormData();
  const [touchedFields, setTouchedFields] = useState<Set<ContactFormFieldKey>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fieldErrors = useMemo(() => getContactFormFieldErrors(activeForm), [activeForm]);
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
    const normalizedPostalCode = normalizeContactNumberInput(rawPostalCode);
    const normalized = normalizedPostalCode.replace(/\D/g, "");

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
        postalCode: normalizedPostalCode,
        prefecture: result.prefecture || base.prefecture,
        addressLine1: result.addressLine1 || base.addressLine1,
      };
    });
  }

  function handlePostalCodeChange(value: string) {
    const normalizedValue = normalizeContactNumberInput(value);
    updateField("postalCode", normalizedValue);

    const normalized = normalizedValue.replace(/\D/g, "");

    if (normalized.length === 7) {
      void applyAddressFromPostalCode(normalizedValue);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setIsSubmitting(true);
    writeContactFormDraft(activeForm);
    router.push("/contact/confirm");
  }

  const { fieldLabels, placeholders, privacy, buttons } = contactFormCopy;

  return (
    <form
      noValidate
      data-contact-form
      onSubmit={handleSubmit}
      className="mt-[calc(48px*var(--gap-scale-y))] border border-[var(--color-divider)] [&>div]:border-b-0 [&>div]:px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div]:py-[clamp(12px,calc(24px*var(--gap-scale-y)),24px)] [&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div>div:first-child>span]:hidden"
    >
      <ContactField
        label={`${fieldLabels.category} *`}
        requirement={contactFieldRequirements.category}
        htmlFor="contact-category"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.category}
        error={getVisibleFieldError("category")}
        fixedTitleSize
        groupedContentGap
      >
        <div className="relative">
          <select
            id="contact-category"
            name="category"
            value={activeForm.category}
            onChange={(event) => updateField("category", event.target.value as ContactCategory | "")}
            className={getSupportStyleSelectClassName(getFieldStatus("category"))}
            style={getSupportStyleSelectInlineStyle(Boolean(activeForm.category))}
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
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-[clamp(14px,calc(20px*var(--gap-scale-x)),20px)] size-[calc(10px*var(--text-scale))] -translate-y-[70%] rotate-45 border-r border-b border-[var(--foreground)]"
          />
        </div>
      </ContactField>

      <ContactField
        label="お名前"
        requirement={contactFieldRequirements.name}
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.lastName}
        error={getVisibleFieldError("lastName") || getVisibleFieldError("firstName")}
        fixedTitleSize
        groupedContentGap
      >
        <SiteGrid className="gap-x-[calc(12px*var(--gap-scale-x))] gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="contact-last-name"
              name="lastName"
              type="text"
              label={`${placeholders.lastName} *`}
              status={getFieldStatus("lastName")}
              autoComplete="family-name"
              value={activeForm.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              maxLength={CONTACT_FIELD_MAX_LENGTH.lastName}
              aria-required="true"
              aria-invalid={getFieldStatus("lastName") === "invalid"}
            />
          </div>
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="contact-first-name"
              name="firstName"
              type="text"
              label={`${placeholders.firstName} *`}
              status={getFieldStatus("firstName")}
              autoComplete="given-name"
              value={activeForm.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              maxLength={CONTACT_FIELD_MAX_LENGTH.firstName}
              aria-required="true"
              aria-invalid={getFieldStatus("firstName") === "invalid"}
            />
          </div>
        </SiteGrid>
      </ContactField>

      <ContactField
        label="ご連絡先"
        requirement="required"
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <ContactField
            label={fieldLabels.email}
            requirement={contactFieldRequirements.email}
            anchorId={CONTACT_ERROR_SCROLL_ANCHORS.email}
            error={getVisibleFieldError("email")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="contact-email"
              name="email"
              type="email"
              label={`${fieldLabels.email} *`}
              status={getFieldStatus("email")}
              autoComplete="email"
              inputMode="email"
              value={activeForm.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-required="true"
              aria-invalid={getFieldStatus("email") === "invalid"}
            />
          </ContactField>

          <ContactField
            label={fieldLabels.emailConfirm}
            requirement={contactFieldRequirements.email}
            anchorId={CONTACT_ERROR_SCROLL_ANCHORS.emailConfirm}
            error={getVisibleFieldError("emailConfirm")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="contact-email-confirm"
              name="emailConfirm"
              type="email"
              label={`${fieldLabels.emailConfirm} *`}
              status={getFieldStatus("emailConfirm")}
              autoComplete="off"
              inputMode="email"
              value={activeForm.emailConfirm}
              onChange={(event) => updateField("emailConfirm", event.target.value)}
              aria-required="true"
              aria-invalid={getFieldStatus("emailConfirm") === "invalid"}
            />
          </ContactField>

          <ContactField
            label={fieldLabels.phone}
            requirement={contactFieldRequirements.phone}
            anchorId={CONTACT_ERROR_SCROLL_ANCHORS.phone}
            note={contactFieldNotes.phone}
            error={getVisibleFieldError("phone")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="contact-phone"
              name="phone"
              type="tel"
              label={fieldLabels.phone}
              status={getFieldStatus("phone")}
              autoComplete="tel-national"
              inputMode="numeric"
              maxLength={CONTACT_PHONE_MAX_INPUT_LENGTH}
              value={activeForm.phone}
              onChange={(event) =>
                updateField("phone", normalizeContactNumberInput(event.target.value))
              }
              aria-invalid={getFieldStatus("phone") === "invalid"}
            />
          </ContactField>
        </div>
      </ContactField>

      <ContactField
        label="住所"
        requirement={contactFieldRequirements.address}
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <ContactField
            label={fieldLabels.postalCode}
            requirement={contactFieldRequirements.postalCode}
            anchorId={CONTACT_ERROR_SCROLL_ANCHORS.postalCode}
            error={getVisibleFieldError("postalCode")}
            hideHeader
            embedded
          >
            <div className="max-w-[240px]">
              <SupportFloatingInput
                id="contact-postal-code"
                name="postalCode"
                type="text"
                label={fieldLabels.postalCode}
                status={getFieldStatus("postalCode")}
                autoComplete="postal-code"
                inputMode="numeric"
                value={activeForm.postalCode}
                onChange={(event) => handlePostalCodeChange(event.target.value)}
                onBlur={(event) => {
                  markFieldTouched("postalCode");
                  void applyAddressFromPostalCode(event.target.value);
                }}
                aria-invalid={getFieldStatus("postalCode") === "invalid"}
              />
            </div>
          </ContactField>

          <ContactField
            label={fieldLabels.address}
            requirement={contactFieldRequirements.address}
            anchorId={CONTACT_ERROR_SCROLL_ANCHORS.prefecture}
            note={contactFieldNotes.address}
            error={
              getVisibleFieldError("prefecture") ||
              getVisibleFieldError("addressLine1") ||
              getVisibleFieldError("addressLine2")
            }
            hideHeader
            embedded
          >
            <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
              <div className="relative">
                <label htmlFor="contact-prefecture" className="sr-only">
                  {placeholders.prefecture}
                </label>
                <select
                  id="contact-prefecture"
                  name="prefecture"
                  value={activeForm.prefecture}
                  onChange={(event) => updateField("prefecture", event.target.value)}
                  className={getSupportStyleSelectClassName(getFieldStatus("prefecture"))}
                  style={getSupportStyleSelectInlineStyle(Boolean(activeForm.prefecture))}
                  aria-invalid={getFieldStatus("prefecture") === "invalid"}
                >
                  <option value="">{placeholders.prefecture}</option>
                  {japanesePrefectures.map((prefecture) => (
                    <option key={prefecture} value={prefecture}>
                      {prefecture}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-[clamp(14px,calc(20px*var(--gap-scale-x)),20px)] size-[calc(10px*var(--text-scale))] -translate-y-[70%] rotate-45 border-r border-b border-[var(--foreground)]"
                />
              </div>
              <div>
                <SupportFloatingInput
                  id="contact-address-line-1"
                  name="addressLine1"
                  type="text"
                  label={placeholders.addressLine1}
                  status={getFieldStatus("addressLine1")}
                  autoComplete="address-line1"
                  value={activeForm.addressLine1}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  maxLength={CONTACT_FIELD_MAX_LENGTH.addressLine1}
                  aria-invalid={getFieldStatus("addressLine1") === "invalid"}
                />
              </div>
              <div>
                <SupportFloatingInput
                  id="contact-address-line-2"
                  name="addressLine2"
                  type="text"
                  label={placeholders.addressLine2}
                  status={getFieldStatus("addressLine2")}
                  autoComplete="address-line2"
                  value={activeForm.addressLine2}
                  onChange={(event) => updateField("addressLine2", event.target.value)}
                  maxLength={CONTACT_FIELD_MAX_LENGTH.addressLine2}
                  aria-invalid={getFieldStatus("addressLine2") === "invalid"}
                />
              </div>
            </div>
          </ContactField>
        </div>
      </ContactField>

      <ContactField
        label={fieldLabels.message}
        requirement={contactFieldRequirements.message}
        htmlFor="contact-message"
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.message}
        error={getVisibleFieldError("message")}
        fixedTitleSize
        groupedContentGap
      >
        <div className="relative">
          <SupportTextarea
            id="contact-message"
            name="message"
            placeholder=" "
            status={getFieldStatus("message")}
            value={activeForm.message}
            onChange={(event) => updateField("message", event.target.value)}
            rows={8}
            maxLength={CONTACT_FIELD_MAX_LENGTH.message}
            className="peer min-h-[calc(200px*var(--layout-scale-y))] resize-y"
            aria-required="true"
            aria-invalid={getFieldStatus("message") === "invalid"}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] left-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] font-body-ja text-[16px] leading-[16px] font-normal text-[var(--foreground)] peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden"
          >
            {`${fieldLabels.message} *`}
          </span>
        </div>
      </ContactField>

      <ContactField
        label={`${fieldLabels.privacy} *`}
        requirement={contactFieldRequirements.privacy}
        anchorId={CONTACT_ERROR_SCROLL_ANCHORS.privacyAccepted}
        error={getVisibleFieldError("privacyAccepted")}
        fixedTitleSize
        groupedContentGap
      >
        <label className="inline-flex cursor-pointer items-start gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]">
          <input
            id="contact-privacy-accepted"
            type="checkbox"
            name="privacyAccepted"
            checked={activeForm.privacyAccepted}
            onChange={(event) => updateField("privacyAccepted", event.target.checked)}
            className="peer sr-only"
            aria-required="true"
            aria-invalid={getFieldStatus("privacyAccepted") === "invalid"}
          />
          <span
            aria-hidden="true"
            className={`relative mt-[calc(9.75px-max(12px,calc(12px*var(--text-scale))))] size-[max(24px,calc(24px*var(--text-scale)))] shrink-0 rounded-[calc(5px*var(--text-scale))] border border-[var(--color-divider)] bg-white transition-colors after:absolute after:top-[calc(50%-1px)] after:left-1/2 after:h-[58%] after:w-[30%] after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-r-[2px] after:border-b-[2px] after:border-white after:opacity-0 after:content-[''] peer-checked:border-[var(--foreground)] peer-checked:bg-[var(--foreground)] peer-checked:after:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--foreground)] ${
              getFieldStatus("privacyAccepted") === "invalid"
                ? "outline outline-2 outline-offset-2 outline-red-600"
                : ""
            }`}
          />
          <span className="font-body-ja text-[15px] leading-[1.3] font-normal text-[var(--foreground)]">
            <Link
              href={contactPageContent.privacyPolicyHref}
              className="underline"
            >
              {privacy.privacyLinkLabel}
            </Link>
            {privacy.separator}
            <Link
              href={contactPageContent.termsHref}
              className="underline"
            >
              {privacy.termsLinkLabel}
            </Link>
            {privacy.labelAfterLinks}
          </span>
        </label>
      </ContactField>

      <div className="px-[calc(16px*var(--gap-scale-x))] py-[calc(24px*var(--gap-scale-y))] md:px-[calc(24px*var(--gap-scale-x))]">
        <button
          type="submit"
          className={`${supportContactButtonClassName} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isSubmitting}
        >
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
