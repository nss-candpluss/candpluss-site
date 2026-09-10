import { scrollBoundLenisTo } from "@/lib/motion/setup-lenis-scroll-trigger";
import type {
  SupportContactFormFieldErrors,
  SupportContactFormFieldKey,
} from "@/types/support-contact";

export const SUPPORT_CONTACT_FORM_VALIDATION_FIELD_ORDER = [
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
  "serialNumber",
  "message",
  "privacyAccepted",
] as const satisfies readonly SupportContactFormFieldKey[];

export const SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS: Record<SupportContactFormFieldKey, string> = {
  category: "support-contact-field-category",
  serialNumber: "support-contact-field-serial-number",
  lastName: "support-contact-field-name",
  firstName: "support-contact-field-name",
  email: "support-contact-field-email",
  emailConfirm: "support-contact-field-email-confirm",
  phone: "support-contact-field-phone",
  postalCode: "support-contact-field-postal-code",
  prefecture: "support-contact-field-address",
  addressLine1: "support-contact-field-address",
  addressLine2: "support-contact-field-address",
  message: "support-contact-field-message",
  privacyAccepted: "support-contact-field-privacy",
};

export const SUPPORT_CONTACT_ERROR_FOCUS_TARGETS: Partial<
  Record<SupportContactFormFieldKey, string>
> = {
  category: "support-contact-category-repair",
  serialNumber: "support-contact-serial-number",
  lastName: "support-contact-last-name",
  firstName: "support-contact-first-name",
  email: "support-contact-email",
  emailConfirm: "support-contact-email-confirm",
  phone: "support-contact-phone",
  postalCode: "support-contact-postal-code",
  prefecture: "support-contact-prefecture",
  addressLine1: "support-contact-address-line-1",
  addressLine2: "support-contact-address-line-2",
  message: "support-contact-message",
  privacyAccepted: "support-contact-privacy-accepted",
};

export function getFirstSupportContactFormErrorField(
  errors: SupportContactFormFieldErrors
): SupportContactFormFieldKey | null {
  for (const field of SUPPORT_CONTACT_FORM_VALIDATION_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }

  return null;
}

export function scrollToSupportContactFormField(field: SupportContactFormFieldKey): void {
  if (typeof window === "undefined") {
    return;
  }

  const anchorId = SUPPORT_CONTACT_ERROR_SCROLL_ANCHORS[field];
  const element = document.getElementById(anchorId);

  if (!element) {
    return;
  }

  if (!scrollBoundLenisTo(element)) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const focusTargetId = SUPPORT_CONTACT_ERROR_FOCUS_TARGETS[field];
  const focusTarget = focusTargetId
    ? document.getElementById(focusTargetId)
    : element.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea");

  focusTarget?.focus({ preventScroll: true });
}

export function scrollToFirstSupportContactFormError(errors: SupportContactFormFieldErrors): void {
  const firstField = getFirstSupportContactFormErrorField(errors);

  if (!firstField) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToSupportContactFormField(firstField);
    });
  });
}
