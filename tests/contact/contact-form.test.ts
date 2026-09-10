import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  contactFieldNotes,
  contactFormCopy,
  contactPageContent,
} from "@/data/contact";
import { buildAdminContactMail, buildAutoReplyContactMail } from "@/lib/contact/contact-mail";
import { parseContactMultipartForm } from "@/lib/contact/contact-schema";
import {
  collectContactFormFieldErrors,
  CONTACT_PHONE_MAX_DIGITS,
  CONTACT_PHONE_MAX_INPUT_LENGTH,
  validateContactPhone,
} from "@/lib/contact/contact-field-validation";
import { generateContactTicketNumber } from "@/lib/contact/contact-ticket";
import { normalizeContactNumberInput } from "@/lib/contact/input-normalization";
import { createTicketRandomSuffix } from "@/lib/contact/ticket-number";
import {
  CONTACT_CATEGORIES,
  createEmptyContactFormData,
} from "@/types/contact";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("contact form", () => {
  it("uses four dropdown categories without photo attachments", () => {
    const formSource = source("sections/contact/ContactForm.tsx");
    const confirmSource = source("sections/contact/ContactConfirm.tsx");
    const schemaSource = source("lib/contact/contact-schema.ts");
    const apiSource = source("app/api/contact/route.ts");

    expect(CONTACT_CATEGORIES).toEqual([
      { label: "製品に関するお問い合わせ", value: "product" },
      { label: "Laboのご予約", value: "labo-reservation" },
      { label: "卸売について", value: "wholesale" },
      { label: "その他ご質問・ご意見", value: "other" },
    ]);
    expect(formSource).toContain('id="contact-category"');
    expect(formSource).toContain("<select");
    expect(formSource).not.toContain('type="radio"');
    expect(formSource).not.toContain("ContactImageAttachments");
    expect(formSource).not.toContain("getContactAttachments");
    expect(formSource).not.toContain("setContactAttachments");
    expect(confirmSource).not.toContain("getContactAttachments");
    expect(confirmSource).not.toContain("attachments");
    expect(schemaSource).not.toContain("collectAttachmentFiles");
    expect(schemaSource).not.toContain("validateContactAttachments");
    expect(apiSource).not.toContain("buildResendAttachments");
    expect(apiSource).not.toContain("attachmentCount");
    expect(contactPageContent.introNotes.join("\n")).not.toContain("修理をご希望");
  });

  it("reuses the Support phone inquiry block under the Contact title", () => {
    const heroSource = source("sections/contact/ContactHero.tsx");

    expect(heroSource).toContain("supportContent.guide");
    expect(heroSource).toContain("phoneSection.title");
    expect(heroSource).toContain("tel:${phoneSection.phoneNumber}");
    expect(heroSource).toContain('const TOLL_FREE_ICON_SRC = "/assets/icons/icon-tollfree.svg"');
    expect(heroSource).toContain("supportContent.guide.lineButton.label");
    expect(heroSource).toContain('target="_blank"');
    expect(heroSource).toContain("formTitle");
    expect(heroSource).toContain("introParagraphs.map");
    expect(heroSource).toContain("introNotes.map");
    expect(heroSource).toContain("contactInquiryTitleClassName");
    expect(heroSource).toContain("contactInquiryBodyClassName");
    expect(heroSource).toContain("contactInquiryBodyWrapClassName");
    expect(contactPageContent.formTitle).toBe("お問合せフォーム");
    expect(contactPageContent.thanksTitle).toBe("お問い合わせが完了しました");
    expect(contactPageContent.thanksBodyIntro).toEqual([
      "お問い合わせありがとうございます。",
      "担当者が内容を確認のうえ、順次対応させていただきます。",
      "システムによる自動返信にて、受付完了メールを送信しております。",
      "万が一、担当者からの連絡が届かない場合は、お手数ですが再度お問い合わせいただくか、お電話にてご一報ください。",
    ]);
    expect(contactPageContent.thanksBodyAutoReplyNote).toBe(
      "※自動返信メールが届かない場合は、迷惑メールフォルダをご確認いただくか、入力されたメールアドレスに誤りがないかをご確認ください。"
    );
    expect(contactPageContent.introParagraphs).toEqual([
      "お問い合わせ内容を下記項目にご入力ください。",
    ]);
    expect(contactPageContent.introNotes).toEqual([
      "※ 初期設定で「パソコンからのメールを受信拒否」している場合は設定を変更してください。ドメイン指定をされている場合は、弊社からのメールが受信できるように「@candpluss.camp」を受信可能なドメインに指定してください。",
      "※ （*）の項目は必須項目です。",
    ]);
    expect(contactPageContent.introNotes[0]).toContain(
      contactPageContent.mailDomainNote
    );
    expect(heroSource).not.toContain("■お電話でのお問い合わせ先");
    expect(heroSource).not.toContain("092-235-6529");
    expect(heroSource).not.toContain("シリアルナンバー");
    expect(heroSource).not.toContain("初期不良・修理 専用フォーム");
  });

  it("matches the support form field layout and floating inputs", () => {
    const formSource = source("sections/contact/ContactForm.tsx");

    expect(formSource).toContain("SupportFloatingInput");
    expect(formSource).toContain("SupportTextarea");
    expect(formSource).not.toContain("SupportFloatingTextarea");
    expect(formSource).toContain("supportContactButtonClassName");
    expect(formSource).not.toContain("contactArrowPrimaryButtonClassName");
    expect(formSource).not.toContain("contactFormSectionClassName");
    expect(formSource).not.toContain("contactSelectChevronStyle");
    expect(formSource).not.toContain("getContactCheckboxClassName");
    expect(formSource).toContain("border border-[var(--color-divider)]");
    expect(formSource).toContain("[&>div]:border-b-0");
    expect(formSource).toContain(
      "[&>div]:px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]"
    );
    expect(formSource).toContain("[&>div>div:first-child>span]:hidden");
    expect(formSource).toContain('label="お名前"');
    expect(formSource).toContain('label="ご連絡先"');
    expect(formSource).toContain('label="住所"');
    expect(formSource).toContain("label={fieldLabels.message}");
    expect(formSource).toContain('placeholder=" "');
    expect(formSource).toContain(
      "font-body-ja text-[16px] leading-[16px] font-normal"
    );
    expect(formSource).toContain(
      "peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden"
    );
    expect(formSource).not.toContain("isMessageFocused");
    expect(formSource).toContain('label={`${fieldLabels.category} *`}');
    expect(formSource).toContain("className=\"peer sr-only\"");
    expect(formSource).toContain("peer-checked:bg-[var(--foreground)]");
    expect(formSource).toContain("rotate-45 border-r border-b border-[var(--foreground)]");
    expect(formSource.match(/fixedTitleSize/g)).toHaveLength(6);
    expect(formSource.match(/groupedContentGap/g)).toHaveLength(6);
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "contactTitleToContentGapClassName"
    );
    expect(formSource.match(/hideHeader/g)).toHaveLength(5);
    expect(formSource.match(/embedded/g)).toHaveLength(5);
    expect(contactFormCopy.placeholders.prefecture).toBe("都道府県を選択");
    expect(contactFieldNotes.phone).toBe(
      "※お電話でのご連絡を希望の方は、電話番号を入力してください。"
    );
    expect(contactFieldNotes.address).toBe(
      "※郵便番号を入力すると、市区町村までの住所が自動で入力されます。"
    );
    expect(formSource).toContain("contactFieldNotes.phone");
    expect(formSource).toContain("contactFieldNotes.address");
    expect(formSource).toContain("normalizeContactNumberInput");
    expect(formSource).not.toContain("contactFieldNotes.email");
    expect(formSource).not.toContain("contactFieldNotes.postalCode");
    expect(formSource).not.toContain("contactFieldNotes.message");
    expect("message" in contactFieldNotes).toBe(false);
    expect(contactFormCopy.privacy).toEqual({
      privacyLinkLabel: "プライバシーポリシー",
      separator: "・",
      termsLinkLabel: "利用規約",
      labelAfterLinks: " に同意する。",
    });
    expect(contactPageContent.termsHref).toBe("/legal/terms");
    expect(formSource).toContain("contactPageContent.termsHref");
    expect(formSource).toContain("privacy.privacyLinkLabel");
    expect(formSource).toContain("privacy.termsLinkLabel");
    expect(formSource.match(/className="underline"/g)).toHaveLength(2);
  });

  it("uses a white confirm panel with form-title and 16px values", () => {
    const confirmSource = source("sections/contact/ContactConfirm.tsx");
    const stylesSource = source("sections/contact/contactStyles.ts");

    expect(confirmSource).toContain("contactConfirmSectionClassName");
    expect(confirmSource).toContain("contactConfirmRowClassName");
    expect(confirmSource).toContain("contactConfirmLabelClassName");
    expect(confirmSource).toContain("contactConfirmValueClassName");
    expect(confirmSource).toContain("contactInquiryTitleClassName");
    expect(confirmSource).toContain("contactInquiryBodyClassName");
    expect(confirmSource).toContain("contactInquiryBodyWrapClassName");
    expect(confirmSource).toContain("confirmIntroParagraphs");
    expect(confirmSource).not.toContain("ContactHero");
    expect(confirmSource).not.toContain("sectionTitle62ClassName");
    expect(contactPageContent.confirmTitle).toBe("入力内容確認");
    expect(contactPageContent.confirmIntroParagraphs).toEqual([
      "入力内容をご確認いただき、問題がなければ「送信する」ボタンを押してください。",
    ]);
    expect(confirmSource).not.toContain("contactFormRowClassName");
    expect(confirmSource).not.toContain("bg-[#f5f5f5]");
    expect(confirmSource).not.toContain("bodyText(15)");
    expect(stylesSource).toContain(
      '"mt-[calc(48px*var(--gap-scale-y))] overflow-hidden border border-[var(--color-divider)] bg-white px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)] [&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]"'
    );
    expect(stylesSource).toContain(
      '"font-body-ja text-[16px] leading-[16px] font-bold text-[var(--foreground)]"'
    );
    expect(stylesSource).toContain(
      '"font-body-ja whitespace-pre-line text-[16px] leading-[1.3] text-[var(--foreground)]"'
    );
    expect(stylesSource).toContain(
      '"border-b border-[var(--color-divider)] [padding-block:calc(42px*var(--gap-scale-y))] last:border-b-0"'
    );
    expect(stylesSource).toContain(
      '"mt-[clamp(14px,calc(18px*var(--gap-scale-y)),18px)]"'
    );
    expect(confirmSource).toContain("contactTitleToContentGapClassName");
    expect(confirmSource).not.toContain("mt-[calc(16px*var(--gap-scale-y))]");
    expect(stylesSource).not.toContain(
      "contactConfirmRowClassName =\n  \"border-b border-[var(--color-divider)] px-"
    );
    expect(confirmSource).toContain("supportContactButtonClassName");
    expect(confirmSource).toContain("supportContactSecondaryButtonClassName");
    expect(confirmSource).toContain("formActionHalfSpanClassName");
    expect(confirmSource).toContain("arrowMaskStyle");
    expect(confirmSource).toContain("rotate-180");
  });

  it("keeps postal and phone fields optional", () => {
    const emptyErrors = collectContactFormFieldErrors(createEmptyContactFormData(), {
      validateEmailConfirm: true,
    });

    expect(emptyErrors.phone).toBeUndefined();
    expect(emptyErrors.postalCode).toBeUndefined();
    expect(emptyErrors.prefecture).toBeUndefined();
    expect(emptyErrors.addressLine1).toBeUndefined();
    expect(emptyErrors.category).toBe("お問い合わせ種別を選択してください。");
  });

  it("omits attachment copy from contact mail", () => {
    const data = {
      ...createEmptyContactFormData(),
      category: "product" as const,
      lastName: "山田",
      firstName: "太郎",
      email: "taro@example.com",
      emailConfirm: "taro@example.com",
      message: "製品について質問です。",
      privacyAccepted: true,
    };
    const context = {
      ticketNumber: "CTS-20260909-7K9M2P4R8T6W",
      receivedAt: new Date("2026-09-09T00:00:00+09:00"),
      ipAddress: "127.0.0.1",
      data,
    };

    expect(buildAdminContactMail(context).text).not.toContain("添付画像");
    expect(buildAutoReplyContactMail(context).text).not.toContain("添付画像");
  });

  it("accepts multipart contact payloads without attachments", () => {
    const formData = new FormData();
    formData.append("category", "wholesale");
    formData.append("lastName", "山田");
    formData.append("firstName", "太郎");
    formData.append("email", "taro@example.com");
    formData.append("emailConfirm", "taro@example.com");
    formData.append("phone", "０９０－１２３４－５６７８");
    formData.append("postalCode", "１２３－４５６７");
    formData.append("prefecture", "");
    formData.append("addressLine1", "");
    formData.append("addressLine2", "");
    formData.append("message", "卸売についての質問です。");
    formData.append("privacyAccepted", "true");
    formData.append("turnstileToken", "token");

    const parsed = parseContactMultipartForm(formData);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.category).toBe("wholesale");
      expect(parsed.data.phone).toBe("090-1234-5678");
      expect(parsed.data.postalCode).toBe("123-4567");
      expect("attachments" in parsed).toBe(false);
    }
  });

  it("normalizes full-width phone and postal characters", () => {
    expect(normalizeContactNumberInput("０９０－１２３４－５６７８")).toBe(
      "090-1234-5678"
    );
    expect(normalizeContactNumberInput("１２３－４５６７")).toBe("123-4567");
    expect(normalizeContactNumberInput("＋８１　９０")).toBe("+81 90");
  });

  it("limits domestic phone numbers to 11 digits", () => {
    expect(CONTACT_PHONE_MAX_DIGITS).toBe(11);
    expect(CONTACT_PHONE_MAX_INPUT_LENGTH).toBe(13);
    expect(validateContactPhone("090-1234-5678")).toBeNull();
    expect(validateContactPhone("0120-123-456")).toBeNull();
    expect(validateContactPhone("090-1234-56789")).toBe(
      "電話番号の形式をご確認ください。"
    );
    expect(source("sections/contact/ContactForm.tsx")).toContain(
      "maxLength={CONTACT_PHONE_MAX_INPUT_LENGTH}"
    );
    expect(source("sections/support/SupportContactForm.tsx")).toContain(
      "maxLength={CONTACT_PHONE_MAX_INPUT_LENGTH}"
    );
  });

  it("generates restart-safe CTS ticket numbers with a JST date", () => {
    const suffix = createTicketRandomSuffix(
      Uint8Array.from({ length: 12 }, (_, index) => index)
    );
    const tickets = Array.from({ length: 256 }, () =>
      generateContactTicketNumber(new Date("2026-09-09T15:00:00.000Z"))
    );

    expect(suffix).toBe("23456789ABCD");
    expect(tickets[0]).toMatch(
      /^CTS-20260910-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/
    );
    expect(new Set(tickets).size).toBe(tickets.length);
    expect(source("lib/contact/contact-ticket.ts")).not.toContain(
      "dailyTicketCounter"
    );
  });
});
