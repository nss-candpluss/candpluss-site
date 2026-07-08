import type { ContactFormData, ContactFormFieldErrors, ContactFormFieldKey } from "@/types/contact";

import {
  collectContactFormFieldErrors,
  type CollectContactFormFieldErrorsOptions,
} from "./contact-field-validation";

export type ContactFieldStatus = "idle" | "valid" | "invalid";

export const CONTACT_FORM_TOUCHABLE_FIELDS: ContactFormFieldKey[] = [
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
];

const OPTIONAL_EMPTY_FIELD_KEYS = new Set<ContactFormFieldKey>([
  "phone",
  "postalCode",
  "prefecture",
  "addressLine1",
  "addressLine2",
]);

function isOptionalFieldEmpty(key: ContactFormFieldKey, data: ContactFormData): boolean {
  if (!OPTIONAL_EMPTY_FIELD_KEYS.has(key)) {
    return false;
  }

  const value = data[key];
  return typeof value === "string" ? !value.trim() : false;
}

export function getContactFormFieldErrors(
  data: ContactFormData,
  options: CollectContactFormFieldErrorsOptions = { validateEmailConfirm: true }
): ContactFormFieldErrors {
  return collectContactFormFieldErrors(data, options);
}

export function getContactFieldStatus(
  key: ContactFormFieldKey,
  data: ContactFormData,
  touched: boolean,
  fieldErrors: ContactFormFieldErrors
): ContactFieldStatus {
  if (!touched) {
    return "idle";
  }

  if (fieldErrors[key]) {
    return "invalid";
  }

  if (isOptionalFieldEmpty(key, data)) {
    return "idle";
  }

  return "valid";
}
