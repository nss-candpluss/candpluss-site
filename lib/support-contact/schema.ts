import { z } from "zod";

import { supportContactAttachmentValidationMessages } from "@/data/support-contact";
import { collectAttachmentFiles, validateContactAttachments } from "@/lib/contact/attachment-validation";
import {
  SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
  SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
  SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
} from "@/lib/support-contact/attachment-config";
import { normalizeContactNumberInput } from "@/lib/contact/input-normalization";
import { normalizeSupportSerialNumbers } from "@/lib/support-contact/serial-number";
import { collectSupportContactFormFieldErrors } from "@/lib/support-contact/validate-form";
import {
  SUPPORT_CONTACT_CATEGORIES,
  type SupportContactCategory,
  type SupportContactFormData,
  type SupportContactFormFieldErrors,
} from "@/types/support-contact";

const SUPPORT_CONTACT_CATEGORY_VALUES = SUPPORT_CONTACT_CATEGORIES.map((item) => item.value) as [
  SupportContactCategory,
  ...SupportContactCategory[],
];

const trimmedString = z.string().transform((value) => value.trim());
const serialNumbersString = z.string().transform(normalizeSupportSerialNumbers);

export const supportContactApiBodySchema = z
  .object({
    category: z.enum(SUPPORT_CONTACT_CATEGORY_VALUES),
    serialNumber: serialNumbersString,
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

type SupportContactApiBody = z.infer<typeof supportContactApiBodySchema>;

function formDataToBody(formData: FormData): unknown {
  return {
    category: formData.get("category"),
    serialNumber: formData.get("serialNumber"),
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

function toSupportContactFormData(
  body: Omit<SupportContactApiBody, "turnstileToken">
): SupportContactFormData {
  return {
    category: body.category,
    serialNumber: body.serialNumber,
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

export function parseSupportContactMultipartForm(
  formData: FormData
):
  | { ok: true; data: SupportContactFormData; turnstileToken: string; attachments: File[] }
  | { ok: false; errors?: SupportContactFormFieldErrors; message: string } {
  const result = supportContactApiBodySchema.safeParse(formDataToBody(formData));

  if (!result.success) {
    const errors: SupportContactFormFieldErrors = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0];

      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof SupportContactFormFieldErrors] = "入力内容に誤りがあります。";
      }
    }

    return {
      ok: false,
      errors,
      message: "入力内容に誤りがあります。内容をご確認のうえ、再度お試しください。",
    };
  }

  const { turnstileToken, ...bodyWithoutToken } = result.data;
  const parsedData = toSupportContactFormData(bodyWithoutToken);
  const fieldErrors = collectSupportContactFormFieldErrors(parsedData, {
    validateEmailConfirm: true,
  });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      errors: fieldErrors,
      message: "入力内容に誤りがあります。内容をご確認のうえ、再度お試しください。",
    };
  }

  const attachments = collectAttachmentFiles(formData);
  const attachmentValidation = validateContactAttachments(attachments, {
    maxCount: SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
    maxCountMessage: supportContactAttachmentValidationMessages.maxCount,
    maxFileSize: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
    maxFileSizeMessage:
      supportContactAttachmentValidationMessages.maxFileSize,
    maxTotalSize: SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
    maxTotalSizeMessage:
      supportContactAttachmentValidationMessages.maxTotalSize,
  });

  if (!attachmentValidation.ok) {
    return {
      ok: false,
      message: attachmentValidation.message,
    };
  }

  return {
    ok: true,
    data: parsedData,
    turnstileToken,
    attachments,
  };
}
