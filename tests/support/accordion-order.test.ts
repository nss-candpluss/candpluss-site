import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";
import { supportContent } from "@/data/support";

const supportGuideSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/support/SupportGuide.tsx"),
  "utf8"
);

const supportAccordionSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/support/SupportAccordion.tsx"
  ),
  "utf8"
);

const supportContactStylesSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/support/supportContactStyles.ts"
  ),
  "utf8"
);

describe("support guide accordions", () => {
  it("uses the same empty-line spacing as legal body blocks", () => {
    expect(supportAccordionSource).toContain('body.split("\\n\\n")');
    expect(supportAccordionSource).toContain(
      "space-y-[calc(16px*var(--gap-scale-y))]"
    );
    expect(supportAccordionSource).not.toContain(
      "gap-[calc(16px*var(--gap-scale-y))]"
    );
  });

  it("keeps at least 18px between accordion titles and dividers", () => {
    expect(supportAccordionSource).toContain(
      "pt-[max(18px,calc(32px*var(--gap-scale-y)))]"
    );
    expect(supportAccordionSource).toContain(
      "pb-[max(18px,calc(32px*var(--gap-scale-y)))]"
    );
    expect(supportAccordionSource).not.toContain(
      "pt-[calc(32px*var(--gap-scale-y))] text-left"
    );
    expect(supportAccordionSource).not.toContain(
      "border-b pb-[calc(32px*var(--gap-scale-y))]"
    );
  });

  it("places the LINE button between phone contact and the dedicated form", () => {
    const line = footerContent.socialLinks.find((link) => link.label === "LINE");

    expect(supportContent.guide.lineButton.label).toBe("LINEでお問い合わせ");
    expect(supportContent.guide).not.toHaveProperty("contactButton");
    expect(supportGuideSource).not.toContain("SiteGrid");
    expect(supportGuideSource).not.toContain("twoColumnFeatureSpanClassName");
    expect(supportGuideSource).not.toContain("guide.contactButton");
    expect(supportGuideSource).not.toContain("isContactLinkVisible");
    expect(supportContactStylesSource).toContain("justify-center");
    expect(supportGuideSource).toContain("guide.lineButton.label");
    expect(
      supportGuideSource.indexOf("{supportContactPageContent.sectionTitle}")
    ).toBeLessThan(supportGuideSource.indexOf("guide.phoneSection.title"));
    expect(
      supportGuideSource.indexOf("guide.phoneSection.note")
    ).toBeLessThan(supportGuideSource.indexOf("guide.lineButton.label"));
    expect(
      supportGuideSource.indexOf("guide.lineButton.label")
    ).toBeLessThan(
      supportGuideSource.indexOf("{supportContactPageContent.title}")
    );
    expect(
      supportGuideSource.indexOf("{supportContactPageContent.title}")
    ).toBeLessThan(supportGuideSource.indexOf("<SupportContactForm"));
    expect(supportGuideSource).toContain("sectionTitle62ClassName");
    expect(supportGuideSource).toContain("uiText(20)");
    expect(supportGuideSource).toContain(
      'const supportContactTitleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(20)}`'
    );
    expect(supportGuideSource).toContain("max-w-[400px]");
    expect(supportGuideSource).toContain(
      'className="mt-[var(--section-title-gap)]"'
    );
    expect(supportGuideSource).toContain("lineLink.icon");
    expect(line?.icon).toBe("/assets/icons/icon-sns-line.svg");
    expect(supportGuideSource).toContain("target=\"_blank\"");
    expect(supportContactStylesSource).toContain("px-[calc(32px*var(--gap-scale-x))]");
    expect(supportContactStylesSource).toContain("py-[calc(32px*var(--layout-scale-y))]");
    expect(supportContactStylesSource).toContain(
      "min-[1025px]:py-[calc(18px*var(--gap-scale-y))]"
    );
  });

  it("shows phone contact details below the Product Support title", () => {
    expect(supportContent.guide.phoneSection).toEqual({
      title: "お電話でのお問い合わせ",
      phoneNumber: "0120-64-8175",
      hours: "受付時間：平日 09:00〜17:00",
      hoursEmphasis: "平日 09:00〜17:00",
      note: "※土日、祝日、年末年始のお問い合わせは、「LINE」または「初期不良・修理 専用フォーム」よりお問い合わせください。",
    });
    expect(supportGuideSource).toContain(
      "`mt-[calc(8px*var(--gap-scale-y))] ${supportIntroNoteClassName}`"
    );
    expect(supportGuideSource).toContain("guide.phoneSection.hoursEmphasis");
    expect(supportGuideSource).toContain(
      "<span className=\"font-semibold\">\n                  {guide.phoneSection.hoursEmphasis}"
    );
    expect(supportGuideSource).toContain("guide.phoneSection.title");
    expect(supportGuideSource).toContain(
      "<h3 className={supportContactTitleClassName}>\n                {guide.phoneSection.title}"
    );
    expect(supportGuideSource).not.toContain("phoneHeadingClassName");
    expect(supportGuideSource).not.toContain("uiText(16)");
    expect(supportGuideSource).toContain("tel:${guide.phoneSection.phoneNumber}");
    expect(supportGuideSource).toContain(
      'const supportLineButtonAreaGapClassName =\n  "mt-[clamp(32px,calc(60px*var(--gap-scale)),60px)]"'
    );
    expect(supportGuideSource).not.toContain("mt-[calc(60px*var(--gap-scale))]");
    expect(supportGuideSource).toContain(
      'const phoneNumberClassName = `font-ui-en font-bold text-[var(--foreground)] ${uiText(24)}`'
    );
    expect(supportGuideSource).toContain(
      'const TOLL_FREE_ICON_SRC = "/assets/icons/icon-tollfree.svg"'
    );
    expect(supportGuideSource).toContain(
      "h-[1em] w-[calc(1em*120/78.317)] shrink-0 bg-current"
    );
    expect(supportGuideSource).toContain("font-bold");
    expect(supportGuideSource).toContain("uiText(24)");
    expect(supportGuideSource).toContain(
      "`mt-[calc(32px*var(--gap-scale))] ${phoneNumberClassName}`"
    );
    expect(supportGuideSource).toContain("mt-[calc(24px*var(--gap-scale))]");
    expect(supportGuideSource).toContain("mt-[calc(16px*var(--gap-scale))]");
    expect(supportGuideSource).toContain("data-support-contact");
    expect(supportGuideSource).toContain("SupportContactForm");
  });

  it("does not render the former warranty intro above the accordions", () => {
    expect(supportContent.guide).not.toHaveProperty("title");
    expect(supportContent.guide).not.toHaveProperty("body");
    expect(supportGuideSource).not.toContain("C AND+Sの保証について");
    expect(supportGuideSource).not.toContain("guide.title");
    expect(supportGuideSource).not.toContain("guide.body");
    expect(supportGuideSource).toContain('data-support-guide');
    expect(supportGuideSource).toContain('data-support-accordion');
    expect(supportGuideSource.indexOf("data-support-accordion")).toBeLessThan(
      supportGuideSource.indexOf("data-support-contact")
    );
    expect(supportGuideSource.indexOf("SupportAccordion")).toBeLessThan(
      supportGuideSource.indexOf("data-support-contact")
    );
    expect(supportGuideSource.match(/pt-\[var\(--container-y-top\)\]/g)).toHaveLength(
      1
    );
    expect(supportGuideSource).toContain("supportAccordionSectionClassName");
    expect(supportGuideSource).toContain("supportContactSectionClassName");
    expect(supportGuideSource).toContain("bg-[#f5f5f5]");
    expect(supportGuideSource).not.toContain("min-h-svh");
  });

  it("lists initial defect warranty before repair", () => {
    expect(supportContent.guide.accordions.map((item) => item.title)).toEqual([
      "初期不良に関する保証基準",
      "損傷・破損による修理について",
      "修理に関する注意点",
    ]);
  });

  it("uses the current initial defect warranty copy", () => {
    const body = supportContent.guide.accordions[0]?.body ?? "";

    expect(body).toContain(
      "製品のお届け時点において、素材・縫製・加工・パーツ・構造などに製造上の不具合があり"
    );
    expect(body).toContain("原則として初期不良保証の対象外となります。");
    expect(body).not.toContain("【交換基準について】");
    expect(body).not.toContain("\n\n");
  });

  it("uses the current repair copy", () => {
    const body = supportContent.guide.accordions[1]?.body ?? "";

    expect(body).toContain("【修理のご依頼】");
    expect(body).toContain("【修理期間について】");
    expect(body).toContain("【修理品の発送前に】");
    expect(body).toContain("【お受けできない修理品・修理内容について】");
    expect(body).toContain("【お見積りについて】");
    expect(body).toContain(
      "輸送中の事故・トラブルについては弊社では責任を負いかねますので、ご利用の宅配業者にお問い合わせください。"
    );
  });

  it("uses the current repair notes copy", () => {
    const body = supportContent.guide.accordions[2]?.body ?? "";

    expect(body).toContain("【修理品のクリーニングについて】");
    expect(body).toContain("【修理後の仕上がりについて】");
    expect(body).toContain("【修理に使用する素材について】");
    expect(body).toContain("同等の機能・性能を備えた代替素材やパーツを使用して修理を行う場合があります。");
  });
});
