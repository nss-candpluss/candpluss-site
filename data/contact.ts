import type { ContactFormFieldKey } from "@/types/contact";

export const contactPageContent = {
  title: "Contact",
  confirmTitle: "Confirm",
  thanksTitle: "お問合せいただきありがとうございます",
  thanksBodyIntro: [
    "お問い合わせ内容を受け付けました。",
    "ご入力いただいたメールアドレス宛に、自動返信メールをお送りしております。",
  ],
  thanksBodyAutoReplyNote:
    "※自動返信メールが届かない場合は、迷惑メールフォルダをご確認いただくか、入力されたメールアドレスに誤りがないかをご確認ください。",
  thanksBodyOutro: [
    "担当者が内容を確認のうえ、順次ご連絡させていただきます。",
    "通常2〜3営業日以内にご返信いたしますので、今しばらくお待ちください。",
    "万が一、担当者からの連絡が届かない場合は、お手数ですがお問い合わせフォームより再度ご連絡いただくか、お電話にてお問い合わせくださいますようお願いいたします。",
  ],
  phoneSection: {
    heading: "■お電話でのお問い合わせ先",
    phoneNumber: "092-235-6529",
    hours: "月曜〜金曜（土日祝祭日を除く） 9時〜17時",
  },
  introParagraphs: [
    "お問い合わせ内容を下記項目にご入力ください。",
    "修理をご希望の方は、お問い合わせ内容に修理の詳細についてご記載いただき、郵便番号・ご住所・電話番号も必ずご入力いただきますようお願いいたします。",
    "初期設定で「パソコンからのメールを受信拒否」している場合は設定を変更してください。ドメイン指定をされている場合は、弊社からのメールが受信できるように「@candpluss.camp」を受信可能なドメインに指定してください。",
  ],
  mailDomainNote: "@candpluss.camp",
  privacyPolicyHref: "/legal/privacy-policy",
} as const;

export const contactFormCopy = {
  requirementLabels: {
    required: "必須",
    optional: "任意",
  },
  fieldLabels: {
    category: "お問い合わせ種別",
    name: "お名前",
    email: "メールアドレス",
    emailConfirm: "メールアドレス（確認用）",
    phone: "電話番号",
    postalCode: "郵便番号",
    address: "住所",
    message: "お問い合わせ内容",
    attachments: "写真添付",
    privacy: "プライバシーポリシー",
  },
  placeholders: {
    category: "選択してください",
    lastName: "姓",
    firstName: "名",
    email: "",
    emailConfirm: "",
    phone: "",
    postalCode: "",
    prefecture: "都道府県を選択してください",
    addressLine1: "市区町村・番地",
    addressLine2: "建物名・部屋番号",
    message: "",
  },
  privacy: {
    labelBeforeLink: "",
    linkLabel: "プライバシーポリシー",
    labelAfterLink: "に同意する",
  },
  buttons: {
    toConfirm: "確認画面へ",
    back: "戻る",
    submit: "送信する",
    submitting: "送信中...",
    backToTop: "TOPへ戻る",
  },
  submit: {
    failure: "送信に失敗しました。時間をおいて再度お試しください。",
  },
  confirm: {
    privacyAccepted: "同意する",
    privacyNotAccepted: "未同意",
    notEntered: "未入力",
  },
} as const;

export const contactFieldNotes = {
  email: "※有効なメールアドレスを入力してください。",
  postalCode: "※ハイフンは不要です。",
  message: "※2000文字以内。",
  attachments: "※JPEG・PNG・HEIC形式。最大3枚（1枚10MBまで、合計30MBまで）。",
} as const;

export const contactFieldRequirements: Record<
  | "category"
  | "name"
  | "email"
  | "phone"
  | "postalCode"
  | "address"
  | "message"
  | "attachments"
  | "privacy",
  "required" | "optional"
> = {
  category: "required",
  name: "required",
  email: "required",
  phone: "optional",
  postalCode: "optional",
  address: "optional",
  message: "required",
  attachments: "optional",
  privacy: "required",
};

export const contactValidationMessages: Record<ContactFormFieldKey, string> = {
  category: "お問い合わせ種別を選択してください。",
  lastName: "姓を入力してください。",
  firstName: "名を入力してください。",
  email: "メールアドレスを入力してください。",
  emailConfirm: "確認用メールアドレスを入力してください。",
  phone: "",
  postalCode: "",
  prefecture: "",
  addressLine1: "",
  addressLine2: "",
  message: "お問い合わせ内容を入力してください。",
  privacyAccepted: "プライバシーポリシーへの同意が必要です。",
};

export const contactValidationFormatMessages = {
  email: "メールアドレスの形式をご確認ください。",
  emailMismatch: "メールアドレスが一致していません。",
  phone: "電話番号の形式をご確認ください。",
  postalCode: "郵便番号の形式をご確認ください。",
  lastNameMax: "姓は50文字以内で入力してください。",
  firstNameMax: "名は50文字以内で入力してください。",
  addressLine1Max: "市区町村・番地は200文字以内で入力してください。",
  addressLine2Max: "建物名・部屋番号は200文字以内で入力してください。",
  messageMax: "お問い合わせ内容は2000文字以内で入力してください。",
  messageUrls: "URLが多すぎるため送信できません。",
  messageRepeated: "同じ文字が連続しすぎています。内容をご確認ください。",
  messageHtml: "HTMLタグは使用できません。",
} as const;

export const contactAttachmentCopy = {
  label: "写真添付",
  description:
    "初期不良や修理をご依頼の際は、該当箇所の写真を添付していただきますようお願いいたします。",
  formatsLine: "対応形式：",
  formats: "JPEG・PNG・HEIC",
  limits: "最大3枚（1枚10MBまで）",
  dropHint: "画像をドラッグ＆ドロップ",
  dropHintOr: "または",
  selectButton: "画像を選択",
  removeLabel: "削除",
  previewFallback: "プレビュー非対応",
} as const;

export const contactAttachmentValidationMessages = {
  maxCount: "添付できる画像は最大3枚までです。",
  maxFileSize: "1枚あたり10MB以下の画像を選択してください。",
  maxTotalSize: "添付画像の合計容量は30MB以下にしてください。",
  invalidType: "JPEG・PNG・HEIC形式の画像のみ添付できます。",
} as const;

export const japanesePrefectures = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;
