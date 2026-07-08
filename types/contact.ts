export const CONTACT_CATEGORIES = [
  {
    label: "ご注文について",
    value: "order",
  },
  {
    label: "返品・交換について",
    value: "return",
  },
  {
    label: "修理のご依頼",
    value: "repair",
  },
  {
    label: "卸売について",
    value: "wholesale",
  },
  {
    label: "その他お問い合わせ",
    value: "other",
  },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

export type ContactFormData = {
  category: ContactCategory | "";
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

export type ContactFormFieldKey = keyof ContactFormData;

export type ContactFormFieldErrors = Partial<Record<ContactFormFieldKey, string>>;

export const EMPTY_CONTACT_FORM_DATA: ContactFormData = {
  category: "",
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

export function createEmptyContactFormData(): ContactFormData {
  return { ...EMPTY_CONTACT_FORM_DATA };
}

export function isContactCategory(value: string): value is ContactCategory {
  return CONTACT_CATEGORIES.some((item) => item.value === value);
}

/** API 送信 payload */
export type ContactApiRequestBody = ContactFormData & {
  turnstileToken: string;
};

export type ContactApiSuccessResponse = {
  ok: true;
  ticketNumber: string;
};

export type ContactApiErrorResponse = {
  ok: false;
  message: string;
  errors?: ContactFormFieldErrors;
};

export type ContactApiResponse = ContactApiSuccessResponse | ContactApiErrorResponse;
