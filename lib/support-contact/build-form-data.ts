import type { SupportContactFormData } from "@/types/support-contact";

export function appendSupportContactFormData(
  formData: FormData,
  data: SupportContactFormData
): void {
  const payload: Record<string, string> = {
    category: data.category,
    serialNumber: data.serialNumber,
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

  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value);
  }
}
