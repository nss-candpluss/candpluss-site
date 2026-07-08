import type { ContactFormData } from "@/types/contact";

export function buildContactFormDataPayload(data: ContactFormData): Record<string, string> {
  return {
    category: data.category,
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
    privacyAccepted: "true",
  };
}

export function appendContactFormData(formData: FormData, data: ContactFormData): void {
  const payload = buildContactFormDataPayload(data);

  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value);
  }
}
