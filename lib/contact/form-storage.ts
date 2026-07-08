import {
  createEmptyContactFormData,
  isContactCategory,
  type ContactFormData,
} from "@/types/contact";

export const CONTACT_FORM_STORAGE_KEY = "candpluss:contact-form";
export const CONTACT_DRAFT_CHANGED_EVENT = "candpluss:contact-draft-changed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeContactFormData(value: unknown): ContactFormData | null {
  if (!isRecord(value)) {
    return null;
  }

  const categoryRaw = typeof value.category === "string" ? value.category : "";
  const category = isContactCategory(categoryRaw) ? categoryRaw : "";

  return {
    category,
    lastName: typeof value.lastName === "string" ? value.lastName : "",
    firstName: typeof value.firstName === "string" ? value.firstName : "",
    email: typeof value.email === "string" ? value.email : "",
    emailConfirm: typeof value.emailConfirm === "string" ? value.emailConfirm : "",
    phone: typeof value.phone === "string" ? value.phone : "",
    postalCode: typeof value.postalCode === "string" ? value.postalCode : "",
    prefecture: typeof value.prefecture === "string" ? value.prefecture : "",
    addressLine1: typeof value.addressLine1 === "string" ? value.addressLine1 : "",
    addressLine2: typeof value.addressLine2 === "string" ? value.addressLine2 : "",
    message: typeof value.message === "string" ? value.message : "",
    privacyAccepted: value.privacyAccepted === true,
  };
}

export function readContactFormDraft(): ContactFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CONTACT_FORM_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return normalizeContactFormData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeContactFormDraft(data: ContactFormData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(CONTACT_FORM_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CONTACT_DRAFT_CHANGED_EVENT));
}

export function clearContactFormDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(CONTACT_FORM_STORAGE_KEY);
  window.dispatchEvent(new Event(CONTACT_DRAFT_CHANGED_EVENT));
}

export function readContactFormDraftOrEmpty(): ContactFormData {
  return readContactFormDraft() ?? createEmptyContactFormData();
}
