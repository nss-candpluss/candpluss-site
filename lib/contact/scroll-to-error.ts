import type { ContactFormFieldErrors, ContactFormFieldKey } from "@/types/contact";

export const CONTACT_FORM_VALIDATION_FIELD_ORDER = [
  "category",
  "lastName",
  "firstName",
  "email",
  "emailConfirm",
  "phone",
  "postalCode",
  "prefecture",
  "addressLine1",
  "addressLine2",
  "message",
  "privacyAccepted",
] as const satisfies readonly ContactFormFieldKey[];

export const CONTACT_ERROR_SCROLL_ANCHORS: Record<ContactFormFieldKey, string> = {
  category: "contact-field-category",
  lastName: "contact-field-name",
  firstName: "contact-field-name",
  email: "contact-field-email",
  emailConfirm: "contact-field-email-confirm",
  phone: "contact-field-phone",
  postalCode: "contact-field-postal-code",
  prefecture: "contact-field-address",
  addressLine1: "contact-field-address",
  addressLine2: "contact-field-address",
  message: "contact-field-message",
  privacyAccepted: "contact-field-privacy",
};

export function getFirstContactFormErrorField(
  errors: ContactFormFieldErrors
): ContactFormFieldKey | null {
  for (const field of CONTACT_FORM_VALIDATION_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }

  return null;
}

export const CONTACT_ERROR_FOCUS_TARGETS: Partial<Record<ContactFormFieldKey, string>> = {
  category: "contact-category",
  lastName: "contact-last-name",
  firstName: "contact-first-name",
  email: "contact-email",
  emailConfirm: "contact-email-confirm",
  phone: "contact-phone",
  postalCode: "contact-postal-code",
  prefecture: "contact-prefecture",
  addressLine1: "contact-address-line-1",
  addressLine2: "contact-address-line-2",
  message: "contact-message",
  privacyAccepted: "contact-privacy-accepted",
};

export function scrollToContactFormField(field: ContactFormFieldKey): void {
  if (typeof window === "undefined") {
    return;
  }

  const anchorId = CONTACT_ERROR_SCROLL_ANCHORS[field];
  const element = document.getElementById(anchorId);

  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });

  const focusTargetId = CONTACT_ERROR_FOCUS_TARGETS[field];
  const focusTarget = focusTargetId
    ? document.getElementById(focusTargetId)
    : element.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea");

  focusTarget?.focus({ preventScroll: true });
}

export function scrollToFirstContactFormError(errors: ContactFormFieldErrors): void {
  const firstField = getFirstContactFormErrorField(errors);

  if (!firstField) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToContactFormField(firstField);
    });
  });
}
