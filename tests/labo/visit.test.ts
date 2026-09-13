import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";
import { laboVisitContent } from "@/data/labo";

const laboVisitSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../sections/labo/LaboVisit.tsx"),
  "utf8"
);

describe("labo visit reservation", () => {
  it("uses the visit copy, notes, and reservation button labels", () => {
    expect(laboVisitContent.number).toBe("04.");
    expect(laboVisitContent.title).toBe("LABO見学予約");
    expect(laboVisitContent.titleWrapSegments).toEqual(["LABO", "見学予約"]);
    expect(laboVisitContent.label).toBe("VISIT THE LABO");
    expect(laboVisitContent.body).toContain("見学は事前予約制です");
    expect(laboVisitContent.notes).toHaveLength(3);
    expect(laboVisitContent.notes[0]).toContain("完全予約制です");
    expect(laboVisitContent.lineButton).toEqual({
      label: "LINEでご予約",
      body: "スマートフォン版LINEで下記QRコードをスキャンし、友達追加してください。",
      qrImage: "/images/common/line-qr.png",
      qrAlt: "LINE公式アカウントのQRコード",
    });
    expect(laboVisitContent.contactButton.label).toBe(
      "お問い合わせフォームよりご予約"
    );
    expect(laboVisitContent.contactButton.href).toBe("/contact");
  });

  it("matches the design section heading type and spacing", () => {
    expect(laboVisitSource).toContain("titleWrapSegments");
    expect(laboVisitSource).toContain("gap-y-[0.2em]");
    expect(laboVisitSource).toContain("whitespace-nowrap");
    expect(laboVisitSource).toContain("uiText(48)");
    expect(laboVisitSource).toContain("concept-heading-numeral");
    expect(laboVisitSource).toContain(
      "mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)]"
    );
    expect(laboVisitSource).toContain("uiText(18)");
    expect(laboVisitSource).toContain(
      "mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)]"
    );
    expect(laboVisitSource).toContain("bodyText(16)");
    expect(laboVisitSource).toContain(
      "mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)]"
    );
    expect(laboVisitSource).not.toContain("sectionTitle62ClassName");
    expect(laboVisitSource).not.toContain(
      "mt-[calc(32px*var(--gap-scale-y))]"
    );
    expect(laboVisitSource).not.toContain(
      "mt-[calc(98px*var(--layout-scale-y))]"
    );
    expect(laboVisitSource).toContain("mt-[calc(20px*var(--gap-scale-y))]");
    expect(laboVisitSource).toContain("gap-0");
    expect(laboVisitSource).not.toContain(
      "mt-[calc(42px*var(--gap-scale-y))]"
    );
    expect(laboVisitSource).not.toContain(
      "gap-[calc(12px*var(--gap-scale-y))]"
    );
  });

  it("shows the Support-style LINE QR only on PC and keeps the button below it", () => {
    const line = footerContent.socialLinks.find((link) => link.label === "LINE");

    expect(laboVisitSource).toContain("LineQrPanel");
    expect(laboVisitSource).toContain("lineButton.body");
    expect(laboVisitSource).toContain("lineQrPanelVisibilityClassName");
    expect(laboVisitSource).toContain("min-[1377px]:max-w-[400px]");
    expect(laboVisitSource.indexOf("LineQrPanel")).toBeLessThan(
      laboVisitSource.indexOf("contactButton.label")
    );
    expect(line?.icon).toBe("/assets/icons/icon-sns-line.svg");
  });

  it("keeps the tablet and mobile reservation buttons as they were", () => {
    expect(laboVisitSource).toContain("twoColumnFeatureSpanClassName");
    expect(laboVisitSource).toContain("SiteGrid");
    expect(laboVisitSource).toContain("gap-[calc(32px*var(--gap-scale-x))]");
    expect(laboVisitSource).toContain("lineButton.label");
    expect(laboVisitSource).toContain("lineLink.icon");
    expect(laboVisitSource).toContain("arrowMaskStyle");
    expect(laboVisitSource).toContain("px-[calc(32px*var(--gap-scale-x))]");
    expect(laboVisitSource).toContain("py-[calc(32px*var(--layout-scale-y))]");
    expect(laboVisitSource).toContain(
      "min-[1025px]:py-[calc(18px*var(--gap-scale-y))]"
    );
    // LINE ボタンは 1377px 以上だけ QR に置き換わる。1376px 以下は幅の上限なし。
    expect(laboVisitSource).toContain(
      `${"${buttonSpanClassName}"} ${"${lineQrButtonVisibilityClassName}"}`
    );
    expect(laboVisitSource).not.toContain("w-full max-w-[400px]");
  });
});
