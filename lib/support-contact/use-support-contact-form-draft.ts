"use client";

import { useSyncExternalStore } from "react";

import {
  SUPPORT_CONTACT_DRAFT_CHANGED_EVENT,
  SUPPORT_CONTACT_FORM_STORAGE_KEY,
  normalizeSupportContactFormData,
} from "@/lib/support-contact/form-storage";
import { parseExpiringDraft } from "@/lib/contact/draft-expiration";
import type { SupportContactFormData } from "@/types/support-contact";

let cachedStorageValue: string | null | undefined;
let cachedSnapshot: SupportContactFormData | null | undefined = null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => {
    cachedStorageValue = undefined;
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(SUPPORT_CONTACT_DRAFT_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SUPPORT_CONTACT_DRAFT_CHANGED_EVENT, handleChange);
  };
}

function getSnapshot(): SupportContactFormData | null | undefined {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SUPPORT_CONTACT_FORM_STORAGE_KEY);

  if (raw === cachedStorageValue) {
    return cachedSnapshot;
  }

  cachedStorageValue = raw;

  if (!raw) {
    cachedSnapshot = null;
    return null;
  }

  cachedSnapshot = parseExpiringDraft(raw, normalizeSupportContactFormData);

  if (!cachedSnapshot) {
    window.sessionStorage.removeItem(SUPPORT_CONTACT_FORM_STORAGE_KEY);
    cachedStorageValue = null;
    cachedSnapshot = null;
  }

  return cachedSnapshot;
}

function getServerSnapshot(): SupportContactFormData | null | undefined {
  return undefined;
}

export function useSupportContactFormDraft():
  | SupportContactFormData
  | null
  | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
