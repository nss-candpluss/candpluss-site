import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { supportContent } from "@/data/support";

const source = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../sections/support/LineInquiryCta.tsx"
  ),
  "utf8"
);

describe("LINEでお問い合わせ CTA", () => {
  it("PC はタイトルとQR、タブレット以下は現行ボタン", () => {
    expect(supportContent.guide.lineButton).toEqual({
      label: "LINEでお問い合わせ",
      body: "スマートフォン版LINEで下記QRコードをスキャンし、友達追加してください。",
      qrImage: "/images/common/line-qr.png",
      qrAlt: "LINE公式アカウントのQRコード",
    });
    expect(source).toContain("{body}");
    // QR とボタンの切り替えは 1376px 以下がタブレットレイアウト。
    expect(source).toContain(
      'export const lineQrPanelVisibilityClassName = "hidden min-[1377px]:block"'
    );
    expect(source).toContain(
      'export const lineQrButtonVisibilityClassName = "min-[1377px]:hidden"'
    );
    expect(source).not.toContain("min-[1025px]:block");
    expect(source).toContain("qrSrc");
    expect(source).toContain("supportContactButtonClassName");
    expect(source).toContain('target="_blank"');
  });
});
