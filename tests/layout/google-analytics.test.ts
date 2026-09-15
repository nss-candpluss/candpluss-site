import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("GA4 の測定 ID", () => {
  it("環境変数から読み、未設定なら空文字", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const { googleAnalyticsMeasurementId } = await import("@/lib/analytics");
    expect(googleAnalyticsMeasurementId).toBe("");
  });

  it("設定された測定 ID をそのまま使う", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID0001";
    const { googleAnalyticsMeasurementId } = await import("@/lib/analytics");
    expect(googleAnalyticsMeasurementId).toBe("G-TESTID0001");
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  });

  it(".env.example に環境変数を記載する", () => {
    expect(readSource(".env.example")).toContain("NEXT_PUBLIC_GA_MEASUREMENT_ID=");
  });
});

describe("GoogleAnalytics コンポーネント", () => {
  const source = readSource("components/layout/GoogleAnalytics.tsx");

  it("next/script の afterInteractive で gtag.js を読み込む", () => {
    expect(source).toContain('import Script from "next/script"');
    expect(source).toContain("https://www.googletagmanager.com/gtag/js?id=");
    expect(source.match(/strategy="afterInteractive"/g)?.length).toBe(2);
    expect(source).toContain("gtag('config', '${googleAnalyticsMeasurementId}')");
  });

  it("測定 ID 未設定と購入テスト領域では出力しない", () => {
    expect(source).toContain(
      'if (!googleAnalyticsMeasurementId || channel !== "public")'
    );
    expect(source).toContain("usePurchaseChannel()");
  });
});

describe("ルートレイアウト", () => {
  const source = readSource("app/layout.tsx");

  // 購入系統を context から読むので、Provider の内側でないと判定できない
  it("PurchaseChannelProvider の内側で GoogleAnalytics を描画する", () => {
    expect(source).toContain(
      "<PurchaseChannelProvider>\n          <GoogleAnalytics />"
    );
  });
});
