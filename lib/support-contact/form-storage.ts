import {
  createEmptySupportContactFormData,
  isSupportContactCategory,
  type SupportContactFormData,
} from "@/types/support-contact";
import {
  parseExpiringDraft,
  serializeExpiringDraft,
} from "@/lib/contact/draft-expiration";

export const SUPPORT_CONTACT_FORM_STORAGE_KEY = "candpluss:support-contact-form";
export const SUPPORT_CONTACT_DRAFT_CHANGED_EVENT = "candpluss:support-contact-draft-changed";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSupportContactFormData(value: unknown): SupportContactFormData | null {
  if (!isRecord(value)) {
    return null;
  }

  const categoryRaw = typeof value.category === "string" ? value.category : "";
  const category = isSupportContactCategory(categoryRaw) ? categoryRaw : "";

  return {
    category,
    serialNumber: typeof value.serialNumber === "string" ? value.serialNumber : "",
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

export function readSupportContactFormDraft(): SupportContactFormData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SUPPORT_CONTACT_FORM_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const draft = parseExpiringDraft(raw, normalizeSupportContactFormData);

  if (!draft) {
    window.sessionStorage.removeItem(SUPPORT_CONTACT_FORM_STORAGE_KEY);
  }

  return draft;
}

export function writeSupportContactFormDraft(data: SupportContactFormData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SUPPORT_CONTACT_FORM_STORAGE_KEY,
    serializeExpiringDraft(data)
  );
  window.dispatchEvent(new Event(SUPPORT_CONTACT_DRAFT_CHANGED_EVENT));
}

export function clearSupportContactFormDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SUPPORT_CONTACT_FORM_STORAGE_KEY);
  window.dispatchEvent(new Event(SUPPORT_CONTACT_DRAFT_CHANGED_EVENT));
}

export function readSupportContactFormDraftOrEmpty(): SupportContactFormData {
  return readSupportContactFormDraft() ?? createEmptySupportContactFormData();
}
