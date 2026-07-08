import { contactFormCopy } from "@/data/contact";
import { getContactCategoryLabel } from "@/lib/contact/display";
import type { ContactFormData } from "@/types/contact";

export type ContactMailContext = {
  ticketNumber: string;
  receivedAt: Date;
  ipAddress: string | null;
  data: ContactFormData;
  attachmentCount: number;
};

export type ContactMailContent = {
  subject: string;
  text: string;
};

function formatReceivedAt(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function displayOptionalValue(value: string): string {
  return value.trim() || contactFormCopy.confirm.notEntered;
}

function formatIpAddress(ipAddress: string | null): string {
  return ipAddress?.trim() || "不明";
}

function formatAddress(data: ContactFormData): string {
  const lines = [data.prefecture, data.addressLine1, data.addressLine2].filter((line) => line.trim());

  if (lines.length === 0) {
    return contactFormCopy.confirm.notEntered;
  }

  return lines.join("\n");
}

function formatAttachmentSummary(count: number, includeCount: boolean): string {
  if (count <= 0) {
    return "なし";
  }

  return includeCount ? `あり（${String(count)}枚）` : "あり";
}

export function buildAdminContactMail(context: ContactMailContext): ContactMailContent {
  const { ticketNumber, receivedAt, ipAddress, data, attachmentCount } = context;
  const categoryLabel = getContactCategoryLabel(data.category);

  return {
    subject: `【C AND+S】＜${categoryLabel}＞お問い合わせがありました`,
    text: [
      "C AND+S公式サイトよりお問い合わせがありました。",
      "",
      "────────────────────────────",
      "【お問い合わせ情報】",
      "",
      "受付番号：",
      ticketNumber,
      "",
      "受付日時：",
      formatReceivedAt(receivedAt),
      "",
      "お問い合わせ種別：",
      categoryLabel,
      "",
      "IPアドレス：",
      formatIpAddress(ipAddress),
      "",
      "────────────────────────────",
      "【お問い合わせ内容】",
      "",
      data.message,
      "",
      "────────────────────────────",
      "【お客様情報】",
      "",
      "お名前：",
      `${data.lastName} ${data.firstName}`.trim(),
      "",
      "メールアドレス：",
      data.email,
      "",
      "電話番号：",
      displayOptionalValue(data.phone),
      "",
      "郵便番号：",
      displayOptionalValue(data.postalCode),
      "",
      "住所：",
      formatAddress(data),
      "",
      "────────────────────────────",
      "添付画像",
      "",
      formatAttachmentSummary(attachmentCount, true),
      "",
      "────────────────────────────",
      "",
      "このメールはC AND+S公式サイトのお問い合わせフォームより自動送信されています。",
    ].join("\n"),
  };
}

export function buildAutoReplyContactMail(context: ContactMailContext): ContactMailContent {
  const { ticketNumber, data, attachmentCount } = context;
  const categoryLabel = getContactCategoryLabel(data.category);

  return {
    subject: "【C AND+S】お問い合わせを受け付けました",
    text: [
      `${data.lastName} ${data.firstName} 様`,
      "",
      "この度は、C AND+Sへお問い合わせいただき、誠にありがとうございます。",
      "以下の内容でお問い合わせを受け付けました。",
      "",
      "担当者が内容を確認のうえ、順次ご連絡させていただきます。",
      "通常2〜3営業日以内にご返信いたしますので、今しばらくお待ちください。",
      "",
      "※本メールは自動返信メールです。",
      "",
      "────────────────────────────",
      "【お問い合わせ内容】",
      "",
      "受付番号：",
      ticketNumber,
      "",
      "お問い合わせ種別：",
      categoryLabel,
      "",
      "お名前：",
      `${data.lastName} ${data.firstName}`.trim(),
      "",
      "メールアドレス：",
      data.email,
      "",
      "電話番号：",
      displayOptionalValue(data.phone),
      "",
      "郵便番号：",
      displayOptionalValue(data.postalCode),
      "",
      "住所：",
      formatAddress(data),
      "",
      "お問い合わせ内容：",
      data.message,
      "",
      "添付画像",
      "",
      formatAttachmentSummary(attachmentCount, false),
      "",
      "────────────────────────────",
      "",
      "万が一、担当者からの連絡が届かない場合は、お手数ですがお問い合わせフォームより再度ご連絡いただくか、お電話にてお問い合わせくださいますようお願いいたします。",
      "",
      "────────────────────────────",
      "C AND+S",
      "",
      "URL：https://candpluss.camp/",
      "E-mail：info@candpluss.camp",
      "TEL：092-235-6529",
      "────────────────────────────",
      "",
      "※このメールにお心当たりがない場合は、本メールを破棄していただきますようお願いいたします。",
    ].join("\n"),
  };
}
