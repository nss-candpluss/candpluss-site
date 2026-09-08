import { describe, expect, it } from "vitest";

import { cookiePolicyContent } from "@/data/legal/cookiePolicy";

describe("cookie policy document", () => {
  it("uses the public title Cookie（クッキー）について", () => {
    expect(cookiePolicyContent.title).toBe("Cookie（クッキー）について");
  });

  it("keeps numbered sections aligned with the other legal pages", () => {
    expect(cookiePolicyContent.sections.map((item) => item.title)).toEqual([
      "1. 当サイトでのCookieの利用",
      "2. 発行されるCookieの分類",
      "3. 決済における必須Cookieについて",
      "4. Cookieの拒否について",
      "5. 他ポリシーとの関係",
      "6. Cookieポリシーの変更",
    ]);
  });

  it("uses full-width subsection numbers for cookie types", () => {
    const classification = cookiePolicyContent.sections.find(
      (item) => item.title === "2. 発行されるCookieの分類"
    );
    const texts = classification?.clauses?.map((clause) => clause.text) ?? [];

    expect(texts[0]).toMatch(/^（１）/);
    expect(texts[3]).toMatch(/^（２）/);
  });
});
