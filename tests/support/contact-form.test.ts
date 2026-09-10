import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  supportContactAttachmentCopy,
  supportContactAttachmentValidationMessages,
  supportContactFieldNotes,
  supportContactFieldRequirements,
  supportContactFormCopy,
  supportContactPageContent,
} from "@/data/support-contact";
import { CONTACT_FORM_STORAGE_KEY } from "@/lib/contact/form-storage";
import {
  validateAttachmentContents,
  validateContactAttachments,
} from "@/lib/contact/attachment-validation";
import { getSupportProductSupportPath } from "@/lib/paths";
import {
  SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
  SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
  SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
} from "@/lib/support-contact/attachment-config";
import { sanitizeSupportAttachmentFilename } from "@/lib/support-contact/attachment-filename";
import { buildSupportContactConfirmRows } from "@/lib/support-contact/display";
import { SUPPORT_CONTACT_FORM_STORAGE_KEY } from "@/lib/support-contact/form-storage";
import { supportContactApiBodySchema } from "@/lib/support-contact/schema";
import {
  normalizeSupportSerialNumbers,
  sanitizeSupportSerialNumberInput,
} from "@/lib/support-contact/serial-number";
import { generateSupportContactTicketNumber } from "@/lib/support-contact/ticket";
import { collectSupportContactFormFieldErrors } from "@/lib/support-contact/validate-form";
import {
  createEmptySupportContactFormData,
  SUPPORT_CONTACT_CATEGORIES,
} from "@/types/support-contact";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("support warranty contact form", () => {
  it("places a dedicated form below the phone inquiry block", () => {
    const guideSource = source("sections/support/SupportGuide.tsx");
    const buttonStyleSource = source(
      "sections/support/supportContactStyles.ts"
    );

    expect(guideSource).toContain("data-support-contact");
    expect(guideSource).toContain("id={supportContactPageContent.sectionId}");
    expect(guideSource).toContain("scroll-mt-[var(--header-height)]");
    expect(guideSource).toContain("SupportContactForm");
    expect(guideSource).toContain("supportContactButtonClassName");
    expect(buttonStyleSource).toContain(
      "py-[calc(32px*var(--layout-scale-y))]"
    );
    expect(buttonStyleSource).toContain(
      "min-[1025px]:py-[calc(18px*var(--gap-scale-y))]"
    );
    expect(guideSource.indexOf("guide.phoneSection.note")).toBeLessThan(
      guideSource.indexOf("guide.lineButton.label")
    );
    expect(guideSource.indexOf("guide.lineButton.label")).toBeLessThan(
      guideSource.indexOf("{supportContactPageContent.title}")
    );
    expect(guideSource.indexOf("{supportContactPageContent.title}")).toBeLessThan(
      guideSource.indexOf("<SupportContactForm")
    );
    expect(supportContactPageContent.sectionTitle).toBe("Product Support");
    expect(supportContactPageContent.sectionId).toBe("product-support");
    expect(supportContactPageContent.title).toBe(
      "初期不良・修理 専用フォーム"
    );
  });

  it("exposes a stable Product Support hash for QR landings", () => {
    const pageSource = source("sections/support/SupportPage.tsx");
    const hashScrollSource = source("sections/support/SupportHashScroll.tsx");
    const scrollSource = source("lib/support-contact/scroll-to-section.ts");

    expect(getSupportProductSupportPath()).toBe("/support#product-support");
    expect(pageSource).toContain("<SupportHashScroll />");
    expect(hashScrollSource).toContain("subscribeMotionReady");
    expect(hashScrollSource).toContain("hashchange");
    expect(scrollSource).toContain("scrollBoundLenisTo(element, { immediate: true, offset })");
    expect(scrollSource).toContain(
      'element.scrollIntoView({ behavior: "auto", block: "start" })'
    );
  });

  it("uses two radio categories and a serial number field", () => {
    const formSource = source("sections/support/SupportContactForm.tsx");
    const confirmSource = source("sections/support/SupportContactConfirm.tsx");
    const floatingFieldSource = source(
      "sections/support/SupportFloatingField.tsx"
    );
    const supportStyleSource = source(
      "sections/support/supportContactStyles.ts"
    );

    expect(supportContactPageContent.introParagraphs).toEqual([
      "お問い合わせ内容を下記項目にご入力ください。\n製品のシリアルナンバーの入力をお願いいたします（紛失された場合はその旨をご入力ください）。\n不具合や修理が必要な箇所の写真を添付いただくと、よりスムーズにご案内できます。",
    ]);
    expect(source("sections/support/SupportGuide.tsx")).toContain(
      'className="whitespace-pre-line"'
    );
    expect(supportContactPageContent.introNotes).toEqual([
      "※ 初期設定で「パソコンからのメールを受信拒否」している場合は設定を変更してください。ドメイン指定をされている場合は、弊社からのメールが受信できるように「@candpluss.camp」を受信可能なドメインに指定してください。",
      "※ （*）の項目は必須項目です。",
    ]);
    expect(supportContactPageContent.introNotes[0]).toContain(
      supportContactPageContent.mailDomainNote
    );
    expect(source("sections/support/SupportGuide.tsx")).toContain(
      "text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]"
    );
    expect(source("sections/support/SupportGuide.tsx")).toContain(
      'const supportIntroNoteFirstClassName = "mt-[calc(24px*var(--gap-scale))]"'
    );
    expect(SUPPORT_CONTACT_CATEGORIES).toEqual([
      { label: "修理のご依頼", value: "repair" },
      { label: "初期不良について", value: "defect" },
    ]);
    expect(supportContactFormCopy.fieldLabels.serialNumber).toBe("シリアルナンバー");
    expect(supportContactFieldNotes.serialNumber).toBe(
      "※シリアルナンバーは、商品付属のロゴプレート裏面または保証カードに記載されています。"
    );
    expect(supportContactFormCopy.placeholders.prefecture).toBe(
      "都道府県を選択"
    );
    expect(supportContactFieldNotes.address).toBe(
      "※郵便番号を入力すると、市区町村までの住所が自動で入力されます。"
    );
    expect(supportContactFieldNotes.phone).toBe(
      "※お電話でのご連絡を希望の方は、電話番号を入力してください。"
    );
    expect(supportContactFieldNotes.message).toBe(
      "※修理または初期不良の、該当箇所と該当箇所の詳細をご記載ください。"
    );
    expect(supportContactAttachmentCopy.description).toBe(
      "修理または初期不良の、該当箇所の写真を添付してください。"
    );
    expect(supportContactAttachmentCopy.dropHint).toBe(
      "枠内へドラッグ＆ドロップでも添付できます。"
    );
    expect(supportContactAttachmentCopy.addButton).toBe("画像を追加");
    expect(supportContactFieldNotes.attachments).toBe(
      "※JPEG・PNG・HEIC・WebP形式。最大3枚（圧縮後1枚1MBまで、合計3MBまで）。"
    );
    expect(SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT).toBe(3);
    expect(SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE).toBe(1 * 1024 * 1024);
    expect(SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE).toBe(3 * 1024 * 1024);
    const validAttachments = Array.from({ length: 3 }, (_, index) => ({
      name: `photo-${index + 1}.jpg`,
      size: 1,
      type: "image/jpeg",
    }));
    expect(
      validateContactAttachments(validAttachments, {
        maxCount: SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
        maxCountMessage: supportContactAttachmentValidationMessages.maxCount,
      })
    ).toEqual({ ok: true });
    expect(
      validateContactAttachments([...validAttachments, validAttachments[0]], {
        maxCount: SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT,
        maxCountMessage: supportContactAttachmentValidationMessages.maxCount,
      })
    ).toEqual({
      ok: false,
      message:
        "添付できる画像は最大3枚までです。画像を3枚以下に減らしてください。",
    });
    expect(
      validateContactAttachments(
        Array.from({ length: 4 }, (_, index) => ({
          name: `large-${index + 1}.jpg`,
          size: 1 * 1024 * 1024,
          type: "image/jpeg",
        })),
        {
          maxCount: 4,
          maxFileSize: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
          maxFileSizeMessage:
            supportContactAttachmentValidationMessages.maxFileSize,
          maxTotalSize: SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE,
          maxTotalSizeMessage:
            supportContactAttachmentValidationMessages.maxTotalSize,
        }
      )
    ).toEqual({
      ok: false,
      message:
        "添付画像の合計容量が3MBを超えています。画像を減らして再度お試しください。",
    });
    expect(
      validateContactAttachments(
        [
          {
            name: "large.jpg",
            size: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE + 1,
            type: "image/jpeg",
          },
        ],
        {
          maxFileSize: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE,
          maxFileSizeMessage:
            supportContactAttachmentValidationMessages.maxFileSize,
        }
      )
    ).toEqual({
      ok: false,
      message:
        "画像を1枚1MB以下に圧縮できませんでした。別の画像を選択してください。",
    });
    expect(supportContactFormCopy.privacy).toEqual({
      privacyLinkLabel: "プライバシーポリシー",
      separator: "・",
      termsLinkLabel: "利用規約",
      labelAfterLinks: " に同意する。",
    });
    expect(supportContactPageContent.termsHref).toBe("/legal/terms");
    expect(supportContactFieldRequirements).toMatchObject({
      phone: "optional",
      postalCode: "required",
      address: "required",
      attachments: "optional",
      serialNumber: "optional",
    });
    const emptyErrors = collectSupportContactFormFieldErrors(
      createEmptySupportContactFormData(),
      { validateEmailConfirm: true }
    );
    expect(emptyErrors).toMatchObject({
      postalCode: "郵便番号を入力してください。",
      prefecture: "都道府県を選択してください。",
      addressLine1: "市区町村・番地を入力してください。",
    });
    expect(emptyErrors.addressLine2).toBeUndefined();
    expect(emptyErrors.phone).toBeUndefined();
    expect(emptyErrors.serialNumber).toBeUndefined();
    expect(
      collectSupportContactFormFieldErrors({
        ...createEmptySupportContactFormData(),
        serialNumber: "ABC123\n",
      }).serialNumber
    ).toBeUndefined();
    expect(
      collectSupportContactFormFieldErrors({
        ...createEmptySupportContactFormData(),
        serialNumber: `ABC123\n${"A".repeat(51)}`,
      }).serialNumber
    ).toBe("シリアルナンバーは50文字以内で入力してください。");
    expect(
      collectSupportContactFormFieldErrors({
        ...createEmptySupportContactFormData(),
        serialNumber: "ABC-123",
      }).serialNumber
    ).toBe("シリアルナンバーは半角英数字で入力してください。");
    expect(formSource).toContain('type="radio"');
    expect(formSource).toContain("getContactRadioClassName");
    expect(source("sections/contact/contactStyles.ts")).toContain(
      "export function getContactRadioClassName"
    );
    expect(source("sections/contact/contactStyles.ts")).toContain(
      "size-[max(24px,calc(24px*var(--text-scale)))]"
    );
    expect(source("sections/contact/contactStyles.ts")).toContain(
      "border-[var(--color-divider)]"
    );
    expect(formSource).not.toContain("horizontalOnDesktop");
    expect(formSource).toContain(
      "min-[1025px]:gap-x-[calc(36px*var(--gap-scale-x))]"
    );
    expect(formSource).toContain(
      "gap-y-[18px]"
    );
    expect(formSource).toContain(
      "gap-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]"
    );
    expect(formSource).toContain(
      "gap-x-[clamp(8px,calc(12px*var(--gap-scale-x)),12px)]"
    );
    expect(formSource).toContain(
      "mt-[calc(9.75px-max(12px,calc(12px*var(--text-scale))))]"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "min-[1025px]:grid-cols-[max-content_1fr]"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "min-[1025px]:items-center"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "min-[1025px]:gap-x-[calc(48px*var(--gap-scale-x))]"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "mt-[18px] min-[1025px]:mt-0"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      '"py-[5px] font-body-ja text-[16px]'
    );
    expect(source("sections/contact/contactStyles.ts")).not.toMatch(
      /getContactRadioClassName[\s\S]*?outline-green-600/
    );
    expect(formSource).toContain("SUPPORT_CONTACT_CATEGORIES");
    expect(formSource).not.toContain('from "@/types/contact"');
    expect(formSource).toContain("fieldLabels.serialNumber");
    expect(formSource).toContain("support-contact-serial-number");
    expect(formSource).toContain("addSerialNumberField");
    expect(formSource).toContain("removeSerialNumberField");
    expect(formSource).toContain("serialNumbers.slice(1).map");
    expect(formSource).toContain(
      'aria-label="シリアルナンバー入力欄を追加"'
    );
    expect(formSource).toContain(
      "supportSerialFieldRemoveButtonClassName"
    );
    expect(supportStyleSource).toContain(
      "supportSerialFieldAddButtonClassName"
    );
    expect(supportStyleSource).toContain(
      "supportSerialFieldRemoveButtonClassName"
    );
    expect(supportStyleSource).toContain(
      "rounded-full border border-[var(--foreground)]"
    );
    expect(supportStyleSource).toContain(
      "before:h-px"
    );
    expect(supportStyleSource).toContain(
      "after:w-px"
    );
    expect(supportStyleSource).not.toContain("hover:");
    expect(formSource).toContain("supportContactFieldNotes.serialNumber");
    expect(formSource).toContain("supportContactFieldNotes.message");
    expect(formSource).toContain("supportContactFieldNotes.address");
    expect(formSource).toContain("supportContactFieldNotes.phone");
    expect(formSource).not.toContain("supportContactFieldNotes.postalCode");
    expect(formSource).toContain(
      "description={supportContactAttachmentCopy.description}"
    );
    expect(formSource).toContain(
      "dropHint={supportContactAttachmentCopy.dropHint}"
    );
    expect(formSource).toContain(
      "addButtonLabel={supportContactAttachmentCopy.addButton}"
    );
    expect(formSource).toContain(
      "maxCount={SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT}"
    );
    expect(formSource).toContain(
      "maxTotalSize={SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE}"
    );
    expect(formSource).toContain(
      "note={supportContactFieldNotes.attachments}"
    );
    expect(source("lib/support-contact/schema.ts")).toContain(
      "maxCount: SUPPORT_CONTACT_ATTACHMENT_MAX_COUNT"
    );
    expect(source("lib/support-contact/schema.ts")).toContain(
      "maxFileSize: SUPPORT_CONTACT_ATTACHMENT_MAX_FILE_SIZE"
    );
    expect(source("lib/support-contact/schema.ts")).toContain(
      "maxTotalSize: SUPPORT_CONTACT_ATTACHMENT_MAX_TOTAL_SIZE"
    );
    expect(source("lib/support-contact/image-compression.ts")).toContain(
      'import("heic-to/next")'
    );
    expect(source("lib/support-contact/image-compression.ts")).toContain(
      '"browser-image-compression"'
    );
    expect(source("lib/support-contact/image-compression.ts")).toContain(
      "preserveExif: false"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "添付枚数："
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "添付容量："
    );
    expect(formSource).toContain(
      "processFile={compressSupportContactImage}"
    );
    expect(formSource).toContain(
      "disabled={isSubmitting || isAttachmentProcessing}"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "attachments.length > 0 && addButtonLabel"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "!fixedTypography"
    );
    expect(formSource.indexOf('id="support-contact-address-line-2"')).toBeLessThan(
      formSource.indexOf('id="support-contact-serial-number"')
    );
    expect(formSource.indexOf('id="support-contact-serial-number"')).toBeLessThan(
      formSource.indexOf('id="support-contact-message"')
    );
    expect(formSource).not.toContain("supportContactFieldNotes.email");
    expect(formSource).toContain("SupportFloatingInput");
    expect(formSource).toContain("SupportTextarea");
    expect(formSource).not.toContain("SupportFloatingTextarea");
    expect(formSource).toContain("sanitizeSupportSerialNumberInput");
    expect(formSource).toContain('pattern="[A-Za-z0-9]*"');
    expect(formSource).toContain("normalizeContactNumberInput");
    expect(formSource).toContain('placeholder=" "');
    expect(formSource).toContain(
      "peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden"
    );
    expect(formSource).toContain("supportContactButtonClassName");
    expect(formSource).not.toContain("contactArrowPrimaryButtonClassName");
    expect(formSource).toContain(
      'getContactSelectClassName(getFieldStatus("prefecture"))} rounded-[8px]'
    );
    expect(formSource).not.toContain("contactSelectChevronStyle");
    expect(formSource).toContain(
      "rotate-45 border-r border-b border-[var(--foreground)]"
    );
    expect(formSource).toContain(
      'activeForm.prefecture'
    );
    expect(formSource).toContain(
      'fontWeight: activeForm.prefecture ? 600 : 400'
    );
    expect(formSource).toContain(
      '"calc(26px + clamp(12px, calc(20px * var(--gap-scale-y)), 20px) + clamp(10px, calc(16px * var(--gap-scale-y)), 16px))"'
    );
    expect(formSource.match(/fixedTitleSize/g)).toHaveLength(7);
    expect(formSource.match(/groupedContentGap/g)).toHaveLength(7);
    expect(formSource.match(/embedded/g)).toHaveLength(5);
    expect(formSource).toContain('label="お名前"');
    expect(formSource).toContain('label="ご連絡先"');
    expect(formSource).toContain('label="住所"');
    expect(formSource).toContain('label="製品シリアルナンバー"');
    expect(formSource).toContain('label={`${fieldLabels.message} *`}');
    expect(formSource).toContain("fixedTypography");
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "text-[16px] leading-[16px] font-bold"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "mt-[clamp(8px,calc(12px*var(--gap-scale-y)),12px)]"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "leading-[1.3] text-[var(--color-muted)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "text-[15px] leading-[1.3] font-normal text-[var(--foreground)]"
    );
    expect(formSource).toContain(
      "text-[15px] leading-[1.3] font-normal text-[var(--foreground)]"
    );
    expect(formSource).toContain('lineHeight: "1.3"');
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[640px]:rounded-[8px] min-[640px]:bg-[#f5f5f5]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[640px]:min-h-[300px]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "divide-y divide-[var(--color-divider)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "flex items-center bg-transparent"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "attachments.length === 1"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      '? "pt-[calc(24px*var(--gap-scale-y))] min-[640px]:pt-0"'
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      'fixedTypography && attachments.length === 0'
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "mt-[clamp(20px,calc(24px*var(--gap-scale-y)),24px)] min-[640px]:mt-[calc(16px*var(--gap-scale-y))]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "fixedThumbnailClassName"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "fixedFileNameClassName"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "font-body-ja truncate text-[var(--foreground)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "size-[clamp(60px,calc(144px*var(--gap-scale-x)),144px)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "mr-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "ml-[clamp(20px,calc(40px*var(--gap-scale-x)),40px)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "`(${formatFileSize(attachment.file.size)})`"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "fixedRemoveButtonClassName"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "rounded-full border border-[var(--foreground)] bg-transparent"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "before:rotate-45"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "after:-rotate-45"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "absolute top-[calc(50%"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "rounded-full border border-[var(--foreground)]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "bg-[#f5f5f5]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[640px]:bg-white"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "py-[calc(32px*var(--layout-scale-y))]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[1025px]:py-[calc(18px*var(--gap-scale-y))]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[1025px]:min-h-[calc(24px*var(--text-scale)+36px*var(--gap-scale-y))]"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "w-full cursor-pointer"
    );
    expect(source("components/contact/ContactImageAttachments.tsx")).toContain(
      "min-[640px]:max-w-[180px]"
    );
    expect(
      source("components/contact/ContactImageAttachments.tsx").match(
        /\{dropHint \?\? copy\.dropHint\}/g
      )
    ).toHaveLength(2);
    expect(formSource).toContain(
      "pl-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)]"
    );
    expect(formSource).toContain(
      "pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(formSource).toContain(
      "pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(formSource.match(/hideHeader/g)).toHaveLength(5);
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "hideHeader = false"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "groupedContentGap = false"
    );
    expect(source("sections/contact/ContactField.tsx")).toContain(
      "embedded = false"
    );
    expect(formSource).toContain(
      "[&>div>div:first-child>span]:hidden"
    );
    expect(formSource).not.toContain("getContactCheckboxClassName");
    expect(formSource).toContain('className="peer sr-only"');
    expect(formSource).toContain(
      "size-[max(24px,calc(24px*var(--text-scale)))]"
    );
    expect(formSource).toContain(
      "peer-checked:bg-[var(--foreground)]"
    );
    expect(formSource).toContain(
      "peer-checked:after:opacity-100"
    );
    expect(formSource).toContain(
      "after:top-[calc(50%-1px)] after:left-1/2"
    );
    expect(formSource).toContain(
      "after:-translate-x-1/2 after:-translate-y-1/2"
    );
    expect(formSource).toContain(
      "after:border-r-[2px] after:border-b-[2px]"
    );
    expect(formSource).toContain("after:h-[58%] after:w-[30%]");
    expect(formSource).toContain('className="underline"');
    expect(formSource.match(/className="underline"/g)).toHaveLength(2);
    expect(formSource).toContain("supportContactPageContent.termsHref");
    expect(formSource).not.toContain("underline-offset");
    expect(formSource).toContain('label={`${fieldLabels.category} *`}');
    expect(formSource).toContain("label={fieldLabels.serialNumber}");
    expect(formSource).not.toContain(
      'label={`${fieldLabels.serialNumber} *`}'
    );
    expect(formSource).toContain('label={`${placeholders.lastName} *`}');
    expect(formSource).toContain('label={`${placeholders.firstName} *`}');
    expect(formSource).toContain('label={`${fieldLabels.email} *`}');
    expect(formSource).toContain(
      'label={`${fieldLabels.emailConfirm} *`}'
    );
    expect(formSource).toContain('label={`${fieldLabels.message} *`}');
    expect(formSource).toContain('label={`${fieldLabels.privacy} *`}');
    expect(formSource).toContain("label={fieldLabels.phone}");
    expect(formSource).not.toContain('label={`${fieldLabels.phone} *`}');
    expect(formSource).toContain('label={`${fieldLabels.postalCode} *`}');
    expect(formSource).toContain('label={`${placeholders.addressLine1} *`}');
    expect(formSource).toContain('label={placeholders.addressLine2}');
    expect(formSource).toContain("[&>div]:border-b-0");
    expect(formSource).toContain(
      "border border-[var(--color-divider)]"
    );
    expect(formSource).toContain(
      "border border-[var(--color-divider)] bg-white"
    );
    expect(formSource).toContain(
      "[&>div]:px-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]"
    );
    expect(formSource).toContain(
      "[&>div]:py-[clamp(12px,calc(24px*var(--gap-scale-y)),24px)]"
    );
    expect(formSource).toContain(
      "[&>div:first-child]:pt-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]"
    );
    expect(formSource).toContain(
      "[&>div:last-child]:pb-[clamp(20px,calc(48px*var(--gap-scale-x)),48px)]"
    );
    expect(formSource.match(
      /gap-y-\[clamp\(14px,calc\(18px\*var\(--gap-scale-y\)\),18px\)\]/g
    )).toHaveLength(5);
    expect(formSource).not.toContain("contactFormSectionClassName");
    expect(floatingFieldSource).toContain('placeholder=" "');
    expect(floatingFieldSource).toContain("peer block w-full");
    expect(floatingFieldSource).toContain("rounded-[8px]");
    expect(floatingFieldSource).toContain(
      "px-[clamp(12px,calc(20px*var(--gap-scale-x)),20px)]"
    );
    expect(floatingFieldSource).toContain(
      "pt-[clamp(12px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(floatingFieldSource).toContain(
      "pb-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(floatingFieldSource).toContain(
      "text-[16px] leading-[1.3] font-semibold text-[var(--foreground)]"
    );
    expect(floatingFieldSource).toContain(
      "text-[16px] leading-[16px] font-normal text-[var(--foreground)]"
    );
    expect(floatingFieldSource).toContain(
      "peer-focus:text-[clamp(11px,calc(12px*var(--text-scale)),12px)]"
    );
    expect(floatingFieldSource).toContain("peer-focus:top-0");
    expect(floatingFieldSource).toContain(
      "peer-[:not(:placeholder-shown)]:top-0"
    );
    expect(SUPPORT_CONTACT_FORM_STORAGE_KEY).not.toBe(CONTACT_FORM_STORAGE_KEY);
    expect(formSource).toContain("writeSupportContactFormDraft");
    expect(formSource).toContain("useSupportContactFormDraft");
    expect(formSource).not.toContain("CONTACT_FORM_STORAGE_KEY");
    expect(formSource).toContain('router.push("/support/confirm")');
    expect(formSource).not.toContain('router.push("/contact/confirm")');
    expect(confirmSource).toContain("getSupportContactApiUrl");
    expect(confirmSource).toContain("buildSupportContactConfirmRows");
    expect(confirmSource).toContain('router.push("/support/thanks")');
    expect(confirmSource).toContain('router.replace("/support")');
    expect(confirmSource).not.toContain("getContactApiUrl");
    expect(confirmSource).toContain("contactConfirmSectionClassName");
    expect(confirmSource).toContain("contactConfirmRowClassName");
    expect(confirmSource).toContain("contactConfirmLabelClassName");
    expect(confirmSource).toContain("contactConfirmValueClassName");
    expect(confirmSource).toContain("contactInquiryTitleClassName");
    expect(confirmSource).toContain("contactInquiryBodyClassName");
    expect(confirmSource).toContain("contactInquiryBodyWrapClassName");
    expect(confirmSource).toContain("confirmIntroParagraphs");
    expect(confirmSource).not.toContain("sectionTitle62ClassName");
    expect(supportContactPageContent.confirmTitle).toBe("入力内容確認");
    expect(supportContactPageContent.confirmIntroParagraphs).toEqual([
      "入力内容をご確認いただき、問題がなければ「送信する」ボタンを押してください。",
    ]);
    expect(confirmSource).toContain("contactTitleToContentGapClassName");
    expect(confirmSource).not.toContain("mt-[calc(16px*var(--gap-scale-y))]");
    expect(confirmSource).not.toContain("contactFormRowClassName");
    expect(confirmSource).not.toContain("bg-[#f5f5f5]");
    expect(confirmSource).not.toContain("bodyText(15)");
    expect(confirmSource).toContain("supportContactButtonClassName");
    expect(confirmSource).toContain("supportContactSecondaryButtonClassName");
    expect(confirmSource).toContain("formActionHalfSpanClassName");
    expect(confirmSource).toContain("arrowMaskStyle");
    expect(confirmSource).toContain("rotate-180");
  });

  it("normalizes and restricts support serial numbers", () => {
    expect(sanitizeSupportSerialNumberInput("ＡＢＣ１２３-あ")).toBe("ABC123");
    expect(normalizeSupportSerialNumbers("ＡＢＣ１２３\n９９Ｚ")).toBe(
      "ABC123\n99Z"
    );

    const parsed = supportContactApiBodySchema.parse({
      category: "repair",
      serialNumber: "ＡＢＣ１２３",
      lastName: "山田",
      firstName: "太郎",
      email: "taro@example.com",
      emailConfirm: "taro@example.com",
      phone: "０９０－１２３４－５６７８",
      postalCode: "１２３－４５６７",
      prefecture: "東京都",
      addressLine1: "千代田区",
      addressLine2: "",
      message: "修理を希望します。",
      privacyAccepted: true,
      turnstileToken: "token",
    });

    expect(parsed.serialNumber).toBe("ABC123");
    expect(parsed.phone).toBe("090-1234-5678");
    expect(parsed.postalCode).toBe("123-4567");
  });

  it("rejects attachments whose contents are not a supported image", async () => {
    const jpeg = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
      "photo.jpg",
      { type: "image/jpeg" }
    );
    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "photo.png",
      { type: "image/png" }
    );
    const heic = new File(
      [
        new Uint8Array([
          0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69,
          0x63,
        ]),
      ],
      "photo.heic",
      { type: "image/heic" }
    );
    const fakeImage = new File(["not an image"], "renamed.jpg", {
      type: "image/jpeg",
    });
    const invalidContentMessage =
      supportContactAttachmentValidationMessages.invalidContent;

    await expect(
      validateAttachmentContents([jpeg, png, heic], invalidContentMessage)
    ).resolves.toEqual({ ok: true });
    await expect(
      validateAttachmentContents([fakeImage], invalidContentMessage)
    ).resolves.toEqual({
      ok: false,
      message:
        "画像として確認できないファイルが含まれています。別の画像を選択してください。",
    });
    expect(source("app/api/support-contact/route.ts")).toContain(
      "validateAttachmentContents"
    );
  });

  it("sanitizes attachment filenames before sending email", () => {
    expect(
      sanitizeSupportAttachmentFilename(
        "../修理写真\r\nBCC:test@example.com.jpg",
        0
      )
    ).toBe("修理写真__BCC_test@example.com.jpg");
    expect(sanitizeSupportAttachmentFilename("．．／＼", 1)).toBe(
      "support-image-2.jpg"
    );
    expect(
      sanitizeSupportAttachmentFilename(`${"a".repeat(150)}.jpeg`, 0)
    ).toHaveLength(120);
    expect(
      sanitizeSupportAttachmentFilename(`${"a".repeat(150)}.jpeg`, 0)
    ).toMatch(/\.jpeg$/);
    expect(source("app/api/support-contact/route.ts")).toContain(
      "sanitizeSupportAttachmentFilename(file.name, index)"
    );
  });

  it("shows attachment count and filenames on the confirmation page", () => {
    const rows = buildSupportContactConfirmRows(
      createEmptySupportContactFormData(),
      [{ name: "破損箇所-1.jpg" }, { name: "破損箇所-2.jpg" }]
    );
    const attachmentRow = rows.find(
      (row) => row.label === supportContactFormCopy.fieldLabels.attachments
    );

    expect(attachmentRow).toEqual({
      label: "写真添付",
      value: "添付枚数：2枚\n1. 破損箇所-1.jpg\n2. 破損箇所-2.jpg",
    });
    expect(
      buildSupportContactConfirmRows(createEmptySupportContactFormData()).find(
        (row) => row.label === supportContactFormCopy.fieldLabels.attachments
      )
    ).toEqual({
      label: "写真添付",
      value: "添付枚数：0枚",
    });
    expect(source("sections/support/SupportContactConfirm.tsx")).toContain(
      "buildSupportContactConfirmRows("
    );
  });

  it("persists attachments across confirmation page reloads", () => {
    const attachmentStoreSource = source(
      "lib/support-contact/attachment-store.ts"
    );
    const formSource = source("sections/support/SupportContactForm.tsx");
    const confirmSource = source("sections/support/SupportContactConfirm.tsx");

    expect(attachmentStoreSource).toContain("window.indexedDB.open");
    expect(attachmentStoreSource).toContain("new File([attachment.blob]");
    expect(attachmentStoreSource).toContain(
      "attachments: storedAttachments"
    );
    expect(attachmentStoreSource).toContain(
      "store.delete(ATTACHMENT_STORAGE_KEY)"
    );
    expect(formSource).toContain("await setSupportContactAttachments");
    expect(confirmSource).toContain("loadSupportContactAttachments()");
    expect(confirmSource).toContain("attachmentRestoreFailed");
    expect(
      source("lib/support-contact/use-support-contact-form-draft.ts")
    ).toContain("return undefined");
  });

  it("issues SPR tickets distinct from Contact CTS numbers", () => {
    const tickets = Array.from({ length: 256 }, () =>
      generateSupportContactTicketNumber(
        new Date("2026-09-09T00:00:00+09:00")
      )
    );

    expect(tickets[0]).toMatch(
      /^SPR-20260909-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/
    );
    expect(new Set(tickets).size).toBe(tickets.length);
    expect(source("lib/support-contact/ticket.ts")).not.toContain(
      "dailyTicketCounter"
    );
    expect(source("lib/support-contact/mail.ts")).toContain("製品保証・修理");
    expect(source("app/api/support-contact/route.ts")).toContain(
      "generateSupportContactTicketNumber"
    );
  });
});
