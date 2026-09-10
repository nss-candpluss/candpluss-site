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
  supportContactAttachmentCopy,
  supportContactAttachmentValidationMessages,
  supportContactFieldNotes,
  supportContactFieldRequirements,
  supportContactFormCopy,
  supportContactPageContent,
} from "@/data/support-contact";
import { japanesePrefectures } from "@/data/contact";
import { validateContactAttachments } from "@/lib/contact/attachment-validation";
import { CONTACT_PHONE_MAX_INPUT_LENGTH } from "@/lib/contact/contact-field-validation";
import { normalizeContactNumberInput } from "@/lib/contact/input-normalization";
import { lookupAddressByPostalCode } from "@/lib/contact/postal-code";
import { arrowMaskStyle } from "@/lib/maskStyle";
import { formHalfSpanClassName } from "@/lib/layout";
import {
  getSupportContactAttachments,
  setSupportContactAttachments,
} from "@/lib/support-contact/attachment-store";
import {
  SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
  SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
  SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
} from "@/lib/support-contact/attachment-config";
import {
  SUPPORT_CONTACT_FORM_TOUCHABLE_FIELDS,
  getSupportContactFieldStatus,
  getSupportContactFormFieldErrors,
} from "@/lib/support-contact/field-status";
import { writeSupportContactFormDraft } from "@/lib/support-contact/form-storage";
import { compressSupportContactImage } from "@/lib/support-contact/image-compression";
import {
  normalizeSupportSerialNumbers,
  sanitizeSupportSerialNumberInput,
} from "@/lib/support-contact/serial-number";
import {
  SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS,
  scrollToFirstSupportContactFormError,
} from "@/lib/support-contact/scroll-to-error";
import { useSupportContactFormDraft } from "@/lib/support-contact/use-support-contact-form-draft";
import {
  SUPPORT_CONTACT_FIELD_MAX_LENGTH,
  validateSupportContactForm,
} from "@/lib/support-contact/validate-form";
import { ContactField } from "@/sections/contact/ContactField";
import {
  getContactRadioClassName,
  getContactSelectClassName,
} from "@/sections/contact/contactStyles";
import {
  SupportFloatingInput,
  SupportTextarea,
} from "@/sections/support/SupportFloatingField";
import {
  supportContactButtonClassName,
  supportSerialFieldAddButtonClassName,
  supportSerialFieldRemoveButtonClassName,
} from "@/sections/support/supportContactStyles";
import {
  SUPPORT_CONTACT_CATEGORIES,
  createEmptySupportContactFormData,
  type SupportContactCategory,
  type SupportContactFormData,
  type SupportContactFormFieldKey,
} from "@/types/support-contact";

export function SupportContactForm() {
  const router = useRouter();
  const storedDraft = useSupportContactFormDraft();
  const [editedForm, setEditedForm] = useState<SupportContactFormData | null>(null);
  const activeForm = editedForm ?? storedDraft ?? createEmptySupportContactFormData();
  const [touchedFields, setTouchedFields] = useState<Set<SupportContactFormFieldKey>>(() => new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fieldErrors = useMemo(() => getSupportContactFormFieldErrors(activeForm), [activeForm]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ContactAttachmentPreview[]>(() =>
    createAttachmentPreviews(getSupportContactAttachments())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachmentProcessing, setIsAttachmentProcessing] = useState(false);

  function markFieldTouched(key: SupportContactFormFieldKey) {
    setTouchedFields((current) => {
      if (current.has(key)) {
        return current;
      }

      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  function isFieldTouched(key: SupportContactFormFieldKey): boolean {
    return submitAttempted || touchedFields.has(key);
  }

  function getVisibleFieldError(key: SupportContactFormFieldKey): string | undefined {
    return isFieldTouched(key) ? fieldErrors[key] : undefined;
  }

  function getFieldStatus(key: SupportContactFormFieldKey) {
    return getSupportContactFieldStatus(key, activeForm, isFieldTouched(key), fieldErrors);
  }

  function updateField<K extends keyof SupportContactFormData>(key: K, value: SupportContactFormData[K]) {
    markFieldTouched(key);
    setEditedForm((current) => ({
      ...(current ?? storedDraft ?? createEmptySupportContactFormData()),
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
      console.log("[support-contact-postal] apply lookup", normalized);
    }

    const result = await lookupAddressByPostalCode(normalized);

    if (!result) {
      if (process.env.NODE_ENV === "development") {
        console.log("[support-contact-postal] apply lookup skipped: no result");
      }
      return;
    }

    setEditedForm((current) => {
      const base = current ?? storedDraft ?? createEmptySupportContactFormData();

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isAttachmentProcessing) {
      return;
    }

    setSubmitAttempted(true);
    setTouchedFields(new Set(SUPPORT_CONTACT_FORM_TOUCHABLE_FIELDS));

    const submissionForm = {
      ...activeForm,
      serialNumber: normalizeSupportSerialNumbers(activeForm.serialNumber),
    };
    const validation = validateSupportContactForm(submissionForm);

    if (!validation.ok) {
      scrollToFirstSupportContactFormError(validation.errors);
      return;
    }

    const attachmentValidation = validateContactAttachments(
      attachments.map((attachment) => attachment.file),
      {
        maxCount: SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
        maxCountMessage: supportContactAttachmentValidationMessages.maxCount,
        maxFileSize: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
        maxFileSizeMessage:
          supportContactAttachmentValidationMessages.maxFileSize,
        maxTotalSize: SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
        maxTotalSizeMessage:
          supportContactAttachmentValidationMessages.maxTotalSize,
      }
    );

    if (!attachmentValidation.ok) {
      setAttachmentError(attachmentValidation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      await setSupportContactAttachments(
        attachments.map((attachment) => attachment.file)
      );
      writeSupportContactFormDraft(submissionForm);
      router.push("/support/confirm");
    } catch {
      setAttachmentError(
        supportContactAttachmentValidationMessages.storageFailed
      );
      setIsSubmitting(false);
    }
  }

  function handleAttachmentsChange(nextAttachments: ContactAttachmentPreview[]) {
    setAttachments(nextAttachments);
    void setSupportContactAttachments(
      nextAttachments.map((attachment) => attachment.file)
    ).catch(() => {
      setAttachmentError(
        supportContactAttachmentValidationMessages.storageFailed
      );
    });
  }

  function setSerialNumberFields(value: string) {
    setEditedForm((current) => ({
      ...(current ?? storedDraft ?? createEmptySupportContactFormData()),
      serialNumber: value,
    }));
  }

  function updateSerialNumber(index: number, value: string) {
    const nextSerialNumbers = activeForm.serialNumber.split("\n");
    nextSerialNumbers[index] = sanitizeSupportSerialNumberInput(value);
    markFieldTouched("serialNumber");
    setSerialNumberFields(nextSerialNumbers.join("\n"));
  }

  function addSerialNumberField() {
    setSerialNumberFields(`${activeForm.serialNumber}\n`);
  }

  function removeSerialNumberField(index: number) {
    const nextSerialNumbers = activeForm.serialNumber.split("\n");
    nextSerialNumbers.splice(index, 1);
    setSerialNumberFields(nextSerialNumbers.join("\n"));
  }

  const { fieldLabels, placeholders, privacy, buttons } = supportContactFormCopy;
  const serialNumbers = activeForm.serialNumber.split("\n");

  return (
    <form
      noValidate
      data-support-contact-form
      onSubmit={handleSubmit}
      className="mt-[calc(48px*var(--gap-scale-y))] border border-[var(--color-divider)] bg-white [&>div]:border-b-0 [&>div]:px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div]:py-[clamp(12px,calc(24px*var(--gap-scale-y)),24px)] [&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div>div:first-child>span]:hidden"
    >
      <ContactField
        label={`${fieldLabels.category} *`}
        requirement={supportContactFieldRequirements.category}
        anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.category}
        error={getVisibleFieldError("category")}
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col items-start gap-y-[18px] min-[1025px]:flex-row min-[1025px]:flex-wrap min-[1025px]:items-center min-[1025px]:gap-x-[calc(36px*var(--gap-scale-x))]">
          {SUPPORT_CONTACT_CATEGORIES.map((item) => (
            <label
              key={item.value}
              className="inline-flex cursor-pointer items-center gap-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]"
            >
              <input
                id={`support-contact-category-${item.value}`}
                type="radio"
                name="category"
                value={item.value}
                checked={activeForm.category === item.value}
                onChange={() => updateField("category", item.value as SupportContactCategory)}
                className={getContactRadioClassName(getFieldStatus("category"))}
              />
              <span
                className={`font-body-ja text-[16px] leading-[16px] text-[var(--foreground)] ${
                  activeForm.category === item.value
                    ? "font-semibold"
                    : "font-normal"
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </ContactField>

      <ContactField
        label="お名前"
        requirement={supportContactFieldRequirements.name}
        anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.lastName}
        error={getVisibleFieldError("lastName") || getVisibleFieldError("firstName")}
        fixedTitleSize
        groupedContentGap
      >
        <SiteGrid className="gap-x-[calc(12px*var(--gap-scale-x))] gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="support-contact-last-name"
              name="lastName"
              type="text"
              label={`${placeholders.lastName} *`}
              status={getFieldStatus("lastName")}
              autoComplete="family-name"
              value={activeForm.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.lastName}
              aria-required="true"
              aria-invalid={getFieldStatus("lastName") === "invalid"}
            />
          </div>
          <div className={formHalfSpanClassName}>
            <SupportFloatingInput
              id="support-contact-first-name"
              name="firstName"
              type="text"
              label={`${placeholders.firstName} *`}
              status={getFieldStatus("firstName")}
              autoComplete="given-name"
              value={activeForm.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.firstName}
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
            requirement={supportContactFieldRequirements.email}
            anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.email}
            error={getVisibleFieldError("email")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="support-contact-email"
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
            requirement={supportContactFieldRequirements.email}
            anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.emailConfirm}
            error={getVisibleFieldError("emailConfirm")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="support-contact-email-confirm"
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
            requirement={supportContactFieldRequirements.phone}
            anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.phone}
            note={supportContactFieldNotes.phone}
            error={getVisibleFieldError("phone")}
            hideHeader
            embedded
          >
            <SupportFloatingInput
              id="support-contact-phone"
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
        requirement={supportContactFieldRequirements.address}
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <ContactField
            label={fieldLabels.postalCode}
            requirement={supportContactFieldRequirements.postalCode}
            anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.postalCode}
            error={getVisibleFieldError("postalCode")}
            hideHeader
            embedded
          >
            <div className="max-w-[240px]">
              <SupportFloatingInput
                id="support-contact-postal-code"
                name="postalCode"
                type="text"
                label={`${fieldLabels.postalCode} *`}
                status={getFieldStatus("postalCode")}
                autoComplete="postal-code"
                inputMode="numeric"
                value={activeForm.postalCode}
                onChange={(event) => handlePostalCodeChange(event.target.value)}
                onBlur={(event) => {
                  markFieldTouched("postalCode");
                  void applyAddressFromPostalCode(event.target.value);
                }}
                aria-required="true"
                aria-invalid={getFieldStatus("postalCode") === "invalid"}
              />
            </div>
          </ContactField>

          <ContactField
            label={fieldLabels.address}
            requirement={supportContactFieldRequirements.address}
            anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.prefecture}
            note={supportContactFieldNotes.address}
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
                <label htmlFor="support-contact-prefecture" className="sr-only">
                  {`${placeholders.prefecture} *`}
                </label>
                <select
                  id="support-contact-prefecture"
                  name="prefecture"
                  value={activeForm.prefecture}
                  onChange={(event) => updateField("prefecture", event.target.value)}
                  className={`${getContactSelectClassName(getFieldStatus("prefecture"))} rounded-[8px] pl-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)] pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)] pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]`}
                  style={{
                    color: "var(--foreground)",
                    fontSize: "16px",
                    lineHeight: "1.3",
                    fontWeight: activeForm.prefecture ? 600 : 400,
                    minHeight:
                      "calc(26px + clamp(12px, calc(20px * var(--gap-scale-y)), 20px) + clamp(10px, calc(16px * var(--gap-scale-y)), 16px))",
                  }}
                  aria-required="true"
                  aria-invalid={getFieldStatus("prefecture") === "invalid"}
                >
                  <option value="">{`${placeholders.prefecture} *`}</option>
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
                  id="support-contact-address-line-1"
                  name="addressLine1"
                  type="text"
                  label={`${placeholders.addressLine1} *`}
                  status={getFieldStatus("addressLine1")}
                  autoComplete="address-line1"
                  value={activeForm.addressLine1}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.addressLine1}
                  aria-required="true"
                  aria-invalid={getFieldStatus("addressLine1") === "invalid"}
                />
              </div>
              <div>
                <SupportFloatingInput
                  id="support-contact-address-line-2"
                  name="addressLine2"
                  type="text"
                  label={placeholders.addressLine2}
                  status={getFieldStatus("addressLine2")}
                  autoComplete="address-line2"
                  value={activeForm.addressLine2}
                  onChange={(event) => updateField("addressLine2", event.target.value)}
                  maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.addressLine2}
                  aria-invalid={getFieldStatus("addressLine2") === "invalid"}
                />
              </div>
            </div>
          </ContactField>
        </div>
      </ContactField>

      <ContactField
        label="製品シリアルナンバー"
        requirement={supportContactFieldRequirements.serialNumber}
        anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.serialNumber}
        note={supportContactFieldNotes.serialNumber}
        error={getVisibleFieldError("serialNumber")}
        fixedTitleSize
        groupedContentGap
      >
        <div className="flex flex-col gap-y-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]">
          <div className="flex items-center gap-x-[clamp(10px,calc(14px*var(--gap-scale-x)),14px)]">
            <div className="min-w-0 flex-1">
              <SupportFloatingInput
                id="support-contact-serial-number"
                name="serialNumber"
                type="text"
                label={fieldLabels.serialNumber}
                status={getFieldStatus("serialNumber")}
                value={serialNumbers[0]}
                onChange={(event) => updateSerialNumber(0, event.target.value)}
                maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.serialNumber}
                inputMode="text"
                pattern="[A-Za-z0-9]*"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={getFieldStatus("serialNumber") === "invalid"}
              />
            </div>
            <button
              type="button"
              className={supportSerialFieldAddButtonClassName}
              onClick={addSerialNumberField}
              aria-label="シリアルナンバー入力欄を追加"
            />
          </div>

          {serialNumbers.slice(1).map((serialNumber, offset) => {
            const index = offset + 1;

            return (
              <div
                key={index}
                className="flex items-center gap-x-[clamp(10px,calc(14px*var(--gap-scale-x)),14px)]"
              >
                <div className="min-w-0 flex-1">
                  <SupportFloatingInput
                    id={`support-contact-serial-number-${index + 1}`}
                    name="serialNumber"
                    type="text"
                    label={`${fieldLabels.serialNumber} ${index + 1}`}
                    status={getFieldStatus("serialNumber")}
                    value={serialNumber}
                    onChange={(event) => updateSerialNumber(index, event.target.value)}
                    maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.serialNumber}
                    inputMode="text"
                    pattern="[A-Za-z0-9]*"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={getFieldStatus("serialNumber") === "invalid"}
                  />
                </div>
                <button
                  type="button"
                  className={supportSerialFieldRemoveButtonClassName}
                  onClick={() => removeSerialNumberField(index)}
                  aria-label={`シリアルナンバー${index + 1}の入力欄を削除`}
                />
              </div>
            );
          })}
        </div>
      </ContactField>

      <ContactField
        label={`${fieldLabels.message} *`}
        requirement={supportContactFieldRequirements.message}
        htmlFor="support-contact-message"
        anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.message}
        note={supportContactFieldNotes.message}
        error={getVisibleFieldError("message")}
        fixedTitleSize
        groupedContentGap
      >
        <div className="relative">
          <SupportTextarea
            id="support-contact-message"
            name="message"
            placeholder=" "
            status={getFieldStatus("message")}
            value={activeForm.message}
            onChange={(event) => updateField("message", event.target.value)}
            rows={8}
            maxLength={SUPPORT_CONTACT_FIELD_MAX_LENGTH.message}
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

      <ContactImageAttachments
        attachments={attachments}
        onChange={handleAttachmentsChange}
        error={attachmentError}
        onError={setAttachmentError}
        fixedTypography
        description={supportContactAttachmentCopy.description}
        dropHint={supportContactAttachmentCopy.dropHint}
        addButtonLabel={supportContactAttachmentCopy.addButton}
        note={supportContactFieldNotes.attachments}
        maxCount={SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT}
        maxCountMessage={supportContactAttachmentValidationMessages.maxCount}
        maxReachedMessage={
          supportContactAttachmentValidationMessages.maxReached
        }
        maxFileSize={SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE}
        maxFileSizeMessage={
          supportContactAttachmentValidationMessages.maxFileSize
        }
        maxTotalSize={SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE}
        maxTotalSizeMessage={
          supportContactAttachmentValidationMessages.maxTotalSize
        }
        processFile={compressSupportContactImage}
        processingMessage={
          supportContactAttachmentValidationMessages.processing
        }
        processingFailedMessage={
          supportContactAttachmentValidationMessages.processingFailed
        }
        onProcessingChange={setIsAttachmentProcessing}
      />

      <ContactField
        label={`${fieldLabels.privacy} *`}
        requirement={supportContactFieldRequirements.privacy}
        anchorId={SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS.privacyAccepted}
        error={getVisibleFieldError("privacyAccepted")}
        fixedTitleSize
        groupedContentGap
      >
        <label className="inline-flex cursor-pointer items-start gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]">
          <input
            id="support-contact-privacy-accepted"
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
              href={supportContactPageContent.privacyPolicyHref}
              className="underline"
            >
              {privacy.privacyLinkLabel}
            </Link>
            {privacy.separator}
            <Link
              href={supportContactPageContent.termsHref}
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
          disabled={isSubmitting || isAttachmentProcessing}
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
