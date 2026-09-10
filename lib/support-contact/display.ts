import { supportContactFormCopy } from "@/data/support-contact";
import {
  SUPPORT_CONTACT_CATEGORIES,
  type SupportContactCategory,
  type SupportContactFormData,
} from "@/types/support-contact";

export function getSupportContactCategoryLabel(category: SupportContactCategory | ""): string {
  if (!category) {
    return supportContactFormCopy.confirm.notEntered;
  }

  return SUPPORT_CONTACT_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

export type SupportContactConfirmRow = {
  label: string;
  value: string;
};

type SupportContactAttachmentSummary = {
  name: string;
};

function buildAttachmentSummary(
  attachments: SupportContactAttachmentSummary[]
): string {
  const count = `添付枚数：${attachments.length}枚`;

  if (attachments.length === 0) {
    return count;
  }

  const filenames = attachments.map(
    (attachment, index) => `${index + 1}. ${attachment.name}`
  );

  return [count, ...filenames].join("\n");
}

export function buildSupportContactConfirmRows(
  data: SupportContactFormData,
  attachments: SupportContactAttachmentSummary[] = []
): SupportContactConfirmRow[] {
  const address = [data.prefecture, data.addressLine1, data.addressLine2].filter(Boolean).join(" ");

  return [
    { label: supportContactFormCopy.fieldLabels.category, value: getSupportContactCategoryLabel(data.category) },
    {
      label: supportContactFormCopy.fieldLabels.serialNumber,
      value: data.serialNumber.trim() || supportContactFormCopy.confirm.notEntered,
    },
    { label: supportContactFormCopy.fieldLabels.name, value: `${data.lastName} ${data.firstName}`.trim() },
    { label: supportContactFormCopy.fieldLabels.email, value: data.email },
    {
      label: supportContactFormCopy.fieldLabels.phone,
      value: data.phone || supportContactFormCopy.confirm.notEntered,
    },
    {
      label: supportContactFormCopy.fieldLabels.postalCode,
      value: data.postalCode || supportContactFormCopy.confirm.notEntered,
    },
    {
      label: supportContactFormCopy.fieldLabels.address,
      value: address || supportContactFormCopy.confirm.notEntered,
    },
    { label: supportContactFormCopy.fieldLabels.message, value: data.message },
    {
      label: supportContactFormCopy.fieldLabels.attachments,
      value: buildAttachmentSummary(attachments),
    },
    {
      label: supportContactFormCopy.fieldLabels.privacy,
      value: data.privacyAccepted
        ? supportContactFormCopy.confirm.privacyAccepted
        : supportContactFormCopy.confirm.privacyNotAccepted,
    },
  ];
}
