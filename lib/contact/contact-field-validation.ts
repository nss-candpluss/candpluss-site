import { contactValidationFormatMessages, contactValidationMessages } from "@/data/contact";
import type { ContactFormData, ContactFormFieldErrors } from "@/types/contact";

export const CONTACT_FIELD_MAX_LENGTH = {
  lastName: 50,
  firstName: 50,
  addressLine1: 200,
  addressLine2: 200,
  message: 2000,
} as const;

export const CONTACT_PHONE_MIN_DIGITS = 9;
export const CONTACT_MESSAGE_MAX_URL_COUNT = 3;
export const CONTACT_MESSAGE_MAX_REPEAT_LENGTH = 5;

const BLOCKED_EMAIL_ADDRESSES = new Set(["aaa@aaa", "test@test", "abc@example"]);

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;
const SCRIPT_TAG_PATTERN = /<script\b/i;
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const PHONE_ALLOWED_PATTERN = /^[\d+\-\s]+$/;
const POSTAL_CODE_ALLOWED_PATTERN = /^[\d-]+$/;
const POSTAL_CODE_VALID_PATTERN = /^(?:\d{7}|\d{3}-\d{4})$/;
const REPEATED_CHARACTER_PATTERN = /(.)\1{4,}/u;

export type ContactFormValidationInput = ContactFormData;

export type CollectContactFormFieldErrorsOptions = {
  validateEmailConfirm?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateContactEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return contactValidationMessages.email;
  }

  if (trimmed.endsWith(".")) {
    return contactValidationFormatMessages.email;
  }

  if (trimmed.includes("..")) {
    return contactValidationFormatMessages.email;
  }

  const atIndex = trimmed.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return contactValidationFormatMessages.email;
  }

  const domain = trimmed.slice(atIndex + 1);

  if (!domain.includes(".")) {
    return contactValidationFormatMessages.email;
  }

  if (BLOCKED_EMAIL_ADDRESSES.has(normalizeEmail(trimmed))) {
    return contactValidationFormatMessages.email;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmed)) {
    return contactValidationFormatMessages.email;
  }

  return null;
}

export function validateContactPhone(phone: string): string | null {
  const trimmed = phone.trim();

  if (!trimmed) {
    return null;
  }

  if (!PHONE_ALLOWED_PATTERN.test(trimmed)) {
    return contactValidationFormatMessages.phone;
  }

  const digitCount = trimmed.replace(/\D/g, "").length;

  if (digitCount < CONTACT_PHONE_MIN_DIGITS) {
    return contactValidationFormatMessages.phone;
  }

  return null;
}

export function validateContactPostalCode(postalCode: string): string | null {
  const trimmed = postalCode.trim();

  if (!trimmed) {
    return null;
  }

  if (!POSTAL_CODE_ALLOWED_PATTERN.test(trimmed)) {
    return contactValidationFormatMessages.postalCode;
  }

  if (!POSTAL_CODE_VALID_PATTERN.test(trimmed)) {
    return contactValidationFormatMessages.postalCode;
  }

  return null;
}

export function validateContactMessage(message: string): string | null {
  const trimmed = message.trim();

  if (!trimmed) {
    return contactValidationMessages.message;
  }

  if (trimmed.length > CONTACT_FIELD_MAX_LENGTH.message) {
    return contactValidationFormatMessages.messageMax;
  }

  if (HTML_TAG_PATTERN.test(trimmed) || SCRIPT_TAG_PATTERN.test(trimmed)) {
    return contactValidationFormatMessages.messageHtml;
  }

  const urlMatches = trimmed.match(URL_PATTERN) ?? [];

  if (urlMatches.length >= CONTACT_MESSAGE_MAX_URL_COUNT) {
    return contactValidationFormatMessages.messageUrls;
  }

  if (REPEATED_CHARACTER_PATTERN.test(trimmed)) {
    return contactValidationFormatMessages.messageRepeated;
  }

  return null;
}

export function collectContactFormFieldErrors(
  data: ContactFormValidationInput,
  options: CollectContactFormFieldErrorsOptions = {}
): ContactFormFieldErrors {
  const errors: ContactFormFieldErrors = {};

  if (!data.category) {
    errors.category = contactValidationMessages.category;
  }

  if (!data.lastName.trim()) {
    errors.lastName = contactValidationMessages.lastName;
  } else if (data.lastName.trim().length > CONTACT_FIELD_MAX_LENGTH.lastName) {
    errors.lastName = contactValidationFormatMessages.lastNameMax;
  }

  if (!data.firstName.trim()) {
    errors.firstName = contactValidationMessages.firstName;
  } else if (data.firstName.trim().length > CONTACT_FIELD_MAX_LENGTH.firstName) {
    errors.firstName = contactValidationFormatMessages.firstNameMax;
  }

  const emailError = validateContactEmail(data.email);

  if (emailError) {
    errors.email = emailError;
  }

  if (options.validateEmailConfirm) {
    if (!data.emailConfirm.trim()) {
      errors.emailConfirm = contactValidationMessages.emailConfirm;
    } else if (data.email.trim() !== data.emailConfirm.trim()) {
      errors.emailConfirm = contactValidationFormatMessages.emailMismatch;
    }
  }

  const phoneError = validateContactPhone(data.phone);

  if (phoneError) {
    errors.phone = phoneError;
  }

  const postalCodeError = validateContactPostalCode(data.postalCode);

  if (postalCodeError) {
    errors.postalCode = postalCodeError;
  }

  if (data.addressLine1.trim().length > CONTACT_FIELD_MAX_LENGTH.addressLine1) {
    errors.addressLine1 = contactValidationFormatMessages.addressLine1Max;
  }

  if (data.addressLine2.trim().length > CONTACT_FIELD_MAX_LENGTH.addressLine2) {
    errors.addressLine2 = contactValidationFormatMessages.addressLine2Max;
  }

  const messageError = validateContactMessage(data.message);

  if (messageError) {
    errors.message = messageError;
  }

  if (!data.privacyAccepted) {
    errors.privacyAccepted = contactValidationMessages.privacyAccepted;
  }

  return errors;
}

export function hasContactFormFieldErrors(errors: ContactFormFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
