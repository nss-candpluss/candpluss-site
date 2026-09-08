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

  it("splits contact actions into LINE and form buttons", () => {
    const line = footerContent.socialLinks.find((link) => link.label === "LINE");

    expect(supportContent.guide.lineButton.label).toBe("LINEでお問い合わせ");
    expect(supportContent.guide.contactButton.label).toBe(
      "お問い合わせフォーム"
    );
    expect(supportGuideSource).toContain("SiteGrid");
    expect(supportGuideSource).toContain("twoColumnFeatureSpanClassName");
    expect(supportGuideSource).not.toContain('"col-span-6"');
    expect(supportGuideSource).toContain("justify-center");
    expect(supportGuideSource).toContain("gap-[calc(32px*var(--gap-scale-x))]");
    expect(supportGuideSource).not.toContain("gap-[calc(16px*var(--gap-scale-x))]");
    expect(supportGuideSource).toContain("guide.lineButton.label");
    expect(supportGuideSource).toContain("guide.contactButton.label");
    expect(supportGuideSource).toContain("lineLink.icon");
    expect(line?.icon).toBe("/assets/icons/icon-sns-line.svg");
    expect(supportGuideSource).toContain("target=\"_blank\"");
    expect(supportGuideSource).toContain("px-[calc(32px*var(--gap-scale-x))]");
    expect(supportGuideSource).toContain("py-[calc(32px*var(--layout-scale-y))]");
    expect(supportGuideSource).toContain("min-[1025px]:py-[calc(18px*var(--gap-scale-y))]");
  });

  it("shows phone contact details below the LINE and form buttons", () => {
    expect(supportContent.guide.phoneSection).toEqual({
      title: "お電話でのお問い合わせ",
      phoneNumber: "0120-64-8175",
      hours: "受付時間 9:00 ～ 17:00",
      note: "※土日、祝日のお問い合わせは、LINEまたはお問い合わせフォームよりお問い合わせください。",
    });
    expect(supportGuideSource).toContain("guide.phoneSection.title");
    expect(supportGuideSource).toContain("tel:${guide.phoneSection.phoneNumber}");
    expect(supportGuideSource).toContain("mt-[calc(60px*var(--gap-scale))]");
    expect(supportGuideSource).toContain("font-bold");
    expect(supportGuideSource).toContain("uiText(24)");
    expect(supportGuideSource).toContain("mt-[calc(24px*var(--gap-scale))]");
    expect(supportGuideSource).toContain("mt-[calc(16px*var(--gap-scale))]");
  });

  it("does not render the former warranty intro above the accordions", () => {
    expect(supportContent.guide).not.toHaveProperty("title");
    expect(supportContent.guide).not.toHaveProperty("body");
    expect(supportGuideSource).not.toContain("C AND+Sの保証について");
    expect(supportGuideSource).not.toContain("guide.title");
    expect(supportGuideSource).not.toContain("guide.body");
    expect(supportGuideSource).toContain('data-support-guide');
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
