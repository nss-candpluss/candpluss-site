import {
  supportContactValidationFormatMessages,
  supportContactValidationMessages,
} from "@/data/support-contact";
import {
  collectContactFormFieldErrors,
  CONTACT_FIELD_MAX_LENGTH,
} from "@/lib/contact/contact-field-validation";
import {
  CONTACT_CATEGORIES,
  createEmptyContactFormData,
  type ContactFormData,
} from "@/types/contact";
import {
  isSupportContactCategory,
  type SupportContactFormData,
  type SupportContactFormFieldErrors,
} from "@/types/support-contact";
import {
  isValidSupportSerialNumber,
  normalizeSupportSerialNumbers,
} from "@/lib/support-contact/serial-number";

export const SUPPORT_CONTACT_FIELD_MAX_LENGTH = {
  ...CONTACT_FIELD_MAX_LENGTH,
  serialNumber: 50,
} as const;

function toContactValidationInput(data: SupportContactFormData): ContactFormData {
  return {
    ...createEmptyContactFormData(),
    lastName: data.lastName,
    firstName: data.firstName,
    email: data.email,
    emailConfirm: data.emailConfirm,
    phone: data.phone,
    postalCode: data.postalCode,
    prefecture: data.prefecture,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    message: data.message,
    privacyAccepted: data.privacyAccepted,
    category: isSupportContactCategory(data.category) ? CONTACT_CATEGORIES[0].value : "",
  };
}

export function collectSupportContactFormFieldErrors(
  data: SupportContactFormData,
  options: { validateEmailConfirm?: boolean } = {}
): SupportContactFormFieldErrors {
  const errors: SupportContactFormFieldErrors = {
    ...collectContactFormFieldErrors(toContactValidationInput(data), options),
  };

  if (!isSupportContactCategory(data.category)) {
    errors.category = supportContactValidationMessages.category;
  }

  if (!data.postalCode.trim()) {
    errors.postalCode = supportContactValidationMessages.postalCode;
  }

  if (!data.prefecture.trim()) {
    errors.prefecture = supportContactValidationMessages.prefecture;
  }

  if (!data.addressLine1.trim()) {
    errors.addressLine1 = supportContactValidationMessages.addressLine1;
  }

  const serialNumbers = normalizeSupportSerialNumbers(data.serialNumber).split(
    "\n"
  ).filter(Boolean);

  if (serialNumbers.some((serialNumber) => !isValidSupportSerialNumber(serialNumber))) {
    errors.serialNumber = supportContactValidationFormatMessages.serialNumber;
  } else if (
    serialNumbers.some(
      (serialNumber) =>
        serialNumber.length > SUPPORT_CONTACT_FIELD_MAX_LENGTH.serialNumber
    )
  ) {
    errors.serialNumber = supportContactValidationFormatMessages.serialNumberMax;
  }

  return errors;
}

export function validateSupportContactForm(
  data: SupportContactFormData
): { ok: true } | { ok: false; errors: SupportContactFormFieldErrors } {
  const errors = collectSupportContactFormFieldErrors(data, { validateEmailConfirm: true });

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
