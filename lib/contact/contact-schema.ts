import { z } from "zod";

import {
  collectContactFormFieldErrors,
  hasContactFormFieldErrors,
} from "@/lib/contact/contact-field-validation";
import { normalizeContactNumberInput } from "@/lib/contact/input-normalization";
import { CONTACT_CATEGORIES } from "@/types/contact";
import type { ContactCategory, ContactFormData, ContactFormFieldErrors } from "@/types/contact";

const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map((item) => item.value) as [
  ContactCategory,
  ...ContactCategory[],
];

const trimmedString = z.string().transform((value) => value.trim());

export const contactApiBodySchema = z
  .object({
    category: z.enum(CONTACT_CATEGORY_VALUES),
    lastName: trimmedString,
    firstName: trimmedString,
    email: trimmedString,
    emailConfirm: trimmedString,
    phone: z.string().transform((value) => normalizeContactNumberInput(value).trim()),
    postalCode: z
      .string()
      .transform((value) => normalizeContactNumberInput(value).trim()),
    prefecture: z.string().transform((value) => value.trim()),
    addressLine1: z.string().transform((value) => value.trim()),
    addressLine2: z.string().transform((value) => value.trim()),
    message: trimmedString,
    privacyAccepted: z.literal(true),
    turnstileToken: trimmedString.pipe(z.string().min(1)),
  })
  .strict();

export type ContactApiBody = z.infer<typeof contactApiBodySchema>;

export type ContactApiParsedData = ContactFormData;

function formDataToBody(formData: FormData): unknown {
  return {
    category: formData.get("category"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    email: formData.get("email"),
    emailConfirm: formData.get("emailConfirm"),
    phone: formData.get("phone"),
    postalCode: formData.get("postalCode"),
    prefecture: formData.get("prefecture"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    message: formData.get("message"),
    privacyAccepted: formData.get("privacyAccepted") === "true",
    turnstileToken: formData.get("turnstileToken"),
  };
}

function toContactFormData(body: Omit<ContactApiBody, "turnstileToken">): ContactFormData {
  return {
    category: body.category,
    lastName: body.lastName,
    firstName: body.firstName,
    email: body.email,
    emailConfirm: body.emailConfirm,
    phone: body.phone,
    postalCode: body.postalCode,
    prefecture: body.prefecture,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    message: body.message,
    privacyAccepted: body.privacyAccepted,
  };
}

export function parseContactApiBody(
  body: unknown
):
  | { ok: true; data: ContactApiParsedData; turnstileToken: string }
  | { ok: false; errors: ContactFormFieldErrors; message: string } {
  const result = contactApiBodySchema.safeParse(body);

  if (!result.success) {
    const errors: ContactFormFieldErrors = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];

      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof ContactFormFieldErrors] = "入力内容に誤りがあります。";
      }
    }

    return {
      ok: false,
      errors,
      message: "入力内容に誤りがあります。内容をご確認のうえ、再度お試しください。",
    };
  }

  const { turnstileToken, ...bodyWithoutToken } = result.data;
  const formData = toContactFormData(bodyWithoutToken);
  const fieldErrors = collectContactFormFieldErrors(formData, { validateEmailConfirm: true });

  if (hasContactFormFieldErrors(fieldErrors)) {
    return {
      ok: false,
      errors: fieldErrors,
      message: "入力内容に誤りがあります。内容をご確認のうえ、再度お試しください。",
    };
  }

  return { ok: true, data: formData, turnstileToken };
}

export function parseContactMultipartForm(
  formData: FormData
):
  | { ok: true; data: ContactApiParsedData; turnstileToken: string }
  | { ok: false; errors?: ContactFormFieldErrors; message: string } {
  return parseContactApiBody(formDataToBody(formData));
}
