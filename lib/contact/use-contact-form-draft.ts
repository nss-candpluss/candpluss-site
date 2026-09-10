"use client";

import { useSyncExternalStore } from "react";

import {
  CONTACT_DRAFT_CHANGED_EVENT,
  CONTACT_FORM_STORAGE_KEY,
  normalizeContactFormData,
} from "@/lib/contact/form-storage";
import { parseExpiringDraft } from "@/lib/contact/draft-expiration";
import type { ContactFormData } from "@/types/contact";

let cachedStorageValue: string | null | undefined;
let cachedSnapshot: ContactFormData | null | undefined = null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => {
    cachedStorageValue = undefined;
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(CONTACT_DRAFT_CHANGED_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CONTACT_DRAFT_CHANGED_EVENT, handleChange);
  };
}

function getSnapshot(): ContactFormData | null | undefined {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CONTACT_FORM_STORAGE_KEY);

  if (raw === cachedStorageValue) {
    return cachedSnapshot;
  }

  cachedStorageValue = raw;

  if (!raw) {
    cachedSnapshot = null;
    return null;
  }

  cachedSnapshot = parseExpiringDraft(raw, normalizeContactFormData);

  if (!cachedSnapshot) {
    window.sessionStorage.removeItem(CONTACT_FORM_STORAGE_KEY);
    cachedStorageValue = null;
    cachedSnapshot = null;
  }

  return cachedSnapshot;
}

function getServerSnapshot(): ContactFormData | null | undefined {
  return undefined;
}

export function useContactFormDraft(): ContactFormData | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
