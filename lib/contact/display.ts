import { contactFormCopy } from "@/data/contact";
import { CONTACT_CATEGORIES } from "@/types/contact";
import type { ContactCategory, ContactFormData } from "@/types/contact";

export function getContactCategoryLabel(category: ContactCategory | ""): string {
  if (!category) {
    return contactFormCopy.confirm.notEntered;
  }

  return CONTACT_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export type ContactConfirmRow = {
  label: string;
  value: string;
};

export function buildContactConfirmRows(data: ContactFormData): ContactConfirmRow[] {
  const address = [data.prefecture, data.addressLine1, data.addressLine2].filter(Boolean).join(" ");

  return [
    { label: "お問い合わせ種別", value: getContactCategoryLabel(data.category) },
    { label: "お名前", value: `${data.lastName} ${data.firstName}`.trim() },
    { label: "メールアドレス", value: data.email },
    { label: "電話番号", value: data.phone || contactFormCopy.confirm.notEntered },
    { label: "郵便番号", value: data.postalCode || contactFormCopy.confirm.notEntered },
    { label: "住所", value: address || contactFormCopy.confirm.notEntered },
    { label: "お問い合わせ内容", value: data.message },
    {
      label: "プライバシーポリシー",
      value: data.privacyAccepted
        ? contactFormCopy.confirm.privacyAccepted
        : contactFormCopy.confirm.privacyNotAccepted,
    },
  ];
}
