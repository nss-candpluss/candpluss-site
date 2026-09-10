import {
  contactAttachmentCopy,
  contactFieldNotes,
  contactFieldRequirements,
  contactFormCopy,
  contactPageContent,
  contactValidationFormatMessages,
  contactValidationMessages,
} from "@/data/contact";

/**
 * 初期不良・修理専用フォームの表示文言。
 * Contact と切り分けているので、種別・項目はここだけ直す。
 */
export const supportContactPageContent = {
  sectionTitle: "Product Support",
  title: "初期不良・修理 専用フォーム",
  confirmTitle: contactPageContent.confirmTitle,
  confirmIntroParagraphs: contactPageContent.confirmIntroParagraphs,
  thanksTitle: contactPageContent.thanksTitle,
  thanksBodyIntro: contactPageContent.thanksBodyIntro,
  thanksBodyAutoReplyNote: contactPageContent.thanksBodyAutoReplyNote,
  introParagraphs: [
    "お問い合わせ内容を下記項目にご入力ください。\n製品のシリアルナンバーの入力をお願いいたします（紛失された場合はその旨をご入力ください）。\n不具合や修理が必要な箇所の写真を添付いただくと、よりスムーズにご案内できます。",
  ],
  introNotes: contactPageContent.introNotes,
  mailDomainNote: contactPageContent.mailDomainNote,
  privacyPolicyHref: contactPageContent.privacyPolicyHref,
  termsHref: contactPageContent.termsHref,
} as const;

export const supportContactFormCopy = {
  ...contactFormCopy,
  fieldLabels: {
    ...contactFormCopy.fieldLabels,
    serialNumber: "シリアルナンバー",
  },
  placeholders: {
    ...contactFormCopy.placeholders,
    serialNumber: "",
    prefecture: "都道府県を選択",
  },
} as const;

export const supportContactFieldNotes = {
  ...contactFieldNotes,
  address:
    "※郵便番号を入力すると、市区町村までの住所が自動で入力されます。",
  phone:
    "※お電話でのご連絡を希望の方は、電話番号を入力してください。",
  serialNumber:
    "※シリアルナンバーは、商品付属のロゴプレート裏面または保証カードに記載されています。",
  message:
    "※修理または初期不良の、該当箇所と該当箇所の詳細をご記載ください。",
  attachments:
    "※JPEG・PNG・HEIC・WebP形式。最大3枚（圧縮後1枚1MBまで、合計3MBまで）。",
} as const;

export const supportContactFieldRequirements = {
  ...contactFieldRequirements,
  phone: "optional",
  postalCode: "required",
  address: "required",
  attachments: "optional",
  serialNumber: "optional",
} as const;

export const supportContactValidationMessages = {
  ...contactValidationMessages,
  postalCode: "郵便番号を入力してください。",
  prefecture: "都道府県を選択してください。",
  addressLine1: "市区町村・番地を入力してください。",
};

export const supportContactValidationFormatMessages = {
  ...contactValidationFormatMessages,
  serialNumber: "シリアルナンバーは半角英数字で入力してください。",
  serialNumberMax: "シリアルナンバーは50文字以内で入力してください。",
};

export const supportContactAttachmentValidationMessages = {
  maxCount:
    "添付できる画像は最大3枚までです。画像を3枚以下に減らしてください。",
  maxReached:
    "添付上限の3枚です。別の画像を追加する場合は、添付済みの画像を1枚削除してください。",
  maxFileSize:
    "画像を1枚1MB以下に圧縮できませんでした。別の画像を選択してください。",
  maxTotalSize:
    "添付画像の合計容量が3MBを超えています。画像を減らして再度お試しください。",
  invalidContent:
    "画像として確認できないファイルが含まれています。別の画像を選択してください。",
  storageFailed:
    "画像の一時保存に失敗しました。画像を選び直して再度お試しください。",
  processing: "画像を圧縮しています。",
  processingFailed:
    "画像の圧縮に失敗しました。別の画像を選択して再度お試しください。",
} as const;

export const supportContactAttachmentCopy = {
  ...contactAttachmentCopy,
  description:
    "修理または初期不良の、該当箇所の写真を添付してください。",
  dropHint: "枠内へドラッグ＆ドロップでも添付できます。",
  addButton: "画像を追加",
} as const;
