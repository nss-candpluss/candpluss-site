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
      "6. 安全管理措置",
      "7. Cookie等の利用",
      "8. 個人情報の開示・訂正・利用停止",
      "9. お問い合わせ窓口",
      "10. ポリシーの変更",
    ]);
  });

  it("keeps Cookie policy and inquiry details as normal body text", () => {
    expect(section("7. Cookie等の利用")?.body).toBe(
      "当社は、サービスの利便性向上および利用状況の分析のため、Cookie等の技術を使用しています。\n別途定める「Cookieポリシー」をご確認ください。"
    );

    const inquiry = section("9. お問い合わせ窓口")?.body ?? "";
    expect(inquiry).toContain("株式会社NSS（ブランド名：C AND+S）");
    expect(inquiry).toContain("個人情報お問い合わせ窓口");
    expect(inquiry).toContain("メールアドレス：info@candpluss.camp");
    expect(inquiry).not.toContain("Eメールアドレス");
    expect(inquiry).not.toContain("Cand+S");
    expect(inquiry).not.toContain("\n\n");
  });
});
