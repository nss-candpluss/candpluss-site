import { describe, expect, it } from "vitest";

import { privacyPolicyContent } from "@/data/legal/privacyPolicy";

function section(title: string) {
  return privacyPolicyContent.sections.find((item) => item.title === title);
}

describe("privacy policy document", () => {
  it("uses the terms legal-document section titles", () => {
    expect(privacyPolicyContent.title).toBe("プライバシーポリシー（個人情報保護方針）");
    expect(privacyPolicyContent.sections.map((item) => item.title)).toEqual([
      "1. 個人情報の取得",
      "2. 個人情報の利用目的",
      "3. 個人情報の外部委託および国際移転（重要）",
      "4. 個人情報の第三者提供",
      "5. 安全管理措置",
      "6. Cookie等の利用",
      "7. 個人情報の開示・訂正・利用停止",
      "8. お問い合わせ窓口",
      "9. ポリシーの変更",
    ]);
  });

  it("条番号が連番で、欠番がない", () => {
    const numbers = privacyPolicyContent.sections.map((item) =>
      Number(item.title.split(".")[0])
    );

    expect(numbers).toEqual(
      Array.from({ length: numbers.length }, (_, index) => index + 1)
    );
  });

  it("実際に個人情報を渡している外部サービスを委託先として開示している", () => {
    const outsourcing = section("3. 個人情報の外部委託および国際移転（重要）");
    const texts = outsourcing?.clauses?.map((clause) => clause.text).join("\n") ?? "";

    expect(texts).toContain("Shopify Inc.");
    expect(texts).toContain("Resend, Inc.");
    expect(texts).toContain("Cloudflare, Inc.");
    expect(texts).toContain("Upstash, Inc.");
  });

  it("サポートフォームの添付画像を取得情報に含めている", () => {
    expect(section("1. 個人情報の取得")?.body ?? "").toContain("添付画像");
  });

  // 画像添付は初期不良・修理フォームのみ（tests/contact/contact-form.test.ts で
  // 一般お問い合わせフォームに添付欄がないことを検証している）
  it("添付画像の取得範囲を初期不良・修理の依頼に限定している", () => {
    expect(section("1. 個人情報の取得")?.body ?? "").toContain(
      "初期不良・修理のご依頼に際してお客様が送信される添付画像"
    );
  });

  it("keeps Cookie policy and inquiry details as normal body text", () => {
    expect(section("6. Cookie等の利用")?.body).toBe(
      "当社は、サービスの利便性向上および利用状況の分析のため、Cookie等の技術を使用しています。\n別途定める「Cookieポリシー」をご確認ください。"
    );

    const inquiry = section("8. お問い合わせ窓口")?.body ?? "";
    expect(inquiry).toContain("株式会社NSS（ブランド名：C AND+S）");
    expect(inquiry).toContain("個人情報お問い合わせ窓口");
    expect(inquiry).toContain("メールアドレス：info@candpluss.camp");
    expect(inquiry).not.toContain("Eメールアドレス");
    expect(inquiry).not.toContain("Cand+S");
    expect(inquiry).not.toContain("\n\n");
  });
});
