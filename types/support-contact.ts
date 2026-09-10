export const SUPPORT_CONTACT_CATEGORIES = [
  {
    label: "修理のご依頼",
    value: "repair",
  },
  {
    label: "初期不良について",
    value: "defect",
  },
] as const;

export type SupportContactCategory = (typeof SUPPORT_CONTACT_CATEGORIES)[number]["value"];

export type SupportContactFormData = {
  category: SupportContactCategory | "";
  serialNumber: string;
  lastName: string;
  firstName: string;
  email: string;
  emailConfirm: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  addressLine1: string;
  addressLine2: string;
  message: string;
  privacyAccepted: boolean;
};

export type SupportContactFormFieldKey = keyof SupportContactFormData;

export type SupportContactFormFieldErrors = Partial<Record<SupportContactFormFieldKey, string>>;

export const EMPTY_SUPPORT_CONTACT_FORM_DATA: SupportContactFormData = {
  category: "",
  serialNumber: "",
  lastName: "",
  firstName: "",
  email: "",
  emailConfirm: "",
  phone: "",
  postalCode: "",
  prefecture: "",
  addressLine1: "",
  addressLine2: "",
  message: "",
  privacyAccepted: false,
};

export function createEmptySupportContactFormData(): SupportContactFormData {
  return { ...EMPTY_SUPPORT_CONTACT_FORM_DATA };
}

export function isSupportContactCategory(value: string): value is SupportContactCategory {
  return SUPPORT_CONTACT_CATEGORIES.some((item) => item.value === value);
}
