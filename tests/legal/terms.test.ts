import { describe, expect, it } from "vitest";

import { termsContent } from "@/data/legal/terms";

function section(title: string) {
  return termsContent.sections.find((item) => item.title === title);
}

describe("terms document", () => {
  it("uses the official brand name in the lead", () => {
    expect(termsContent.lead).toContain("C AND+S［シーアンドプラスエス］");
  });

  it("sets defect notice to 8 days and return refusal to 9 days or more", () => {
    const returns = section("第7条（商品の返品・交換・キャンセル）");
    const clauses = returns?.clauses ?? [];

    expect(clauses[0]?.text).toContain("商品到着後8日以内に当社に通知");
    expect(clauses[2]?.text).toContain("商品到着後7日以内に限り受け付けます");
    expect(clauses[3]?.bullets?.[0]).toBe("商品到着後9日以上経過した場合");
  });
});
