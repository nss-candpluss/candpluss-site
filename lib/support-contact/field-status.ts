import { collectSupportContactFormFieldErrors } from "@/lib/support-contact/validate-form";
import type { ContactFieldStatus } from "@/lib/contact/field-status";
import type {
  SupportContactFormData,
  SupportContactFormFieldErrors,
  SupportContactFormFieldKey,
} from "@/types/support-contact";

export const SUPPORT_CONTACT_FORM_TOUCHABLE_FIELDS: SupportContactFormFieldKey[] = [
  "category",
  "serialNumber",
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

const OPTIONAL_EMPTY_FIELD_KEYS = new Set<SupportContactFormFieldKey>([
  "serialNumber",
  "phone",
  "addressLine2",
]);

function isOptionalFieldEmpty(
  key: SupportContactFormFieldKey,
  data: SupportContactFormData
): boolean {
  if (!OPTIONAL_EMPTY_FIELD_KEYS.has(key)) {
    return false;
  }

  const value = data[key];
  return typeof value === "string" ? !value.trim() : false;
}

export function getSupportContactFormFieldErrors(
  data: SupportContactFormData
): SupportContactFormFieldErrors {
  return collectSupportContactFormFieldErrors(data, { validateEmailConfirm: true });
}

export function getSupportContactFieldStatus(
  key: SupportContactFormFieldKey,
  data: SupportContactFormData,
  touched: boolean,
  fieldErrors: SupportContactFormFieldErrors
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
