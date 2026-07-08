import {
  collectContactFormFieldErrors,
  hasContactFormFieldErrors,
} from "@/lib/contact/contact-field-validation";
import type { ContactFormData, ContactFormFieldErrors } from "@/types/contact";

export function validateContactForm(
  data: ContactFormData
): { ok: true } | { ok: false; errors: ContactFormFieldErrors } {
  const errors = collectContactFormFieldErrors(data, { validateEmailConfirm: true });

  if (hasContactFormFieldErrors(errors)) {
    return { ok: false, errors };
  }

  return { ok: true };
}
