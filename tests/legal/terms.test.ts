import { describe, expect, it } from "vitest";

import { termsContent } from "@/data/legal/terms";

function section(title: string) {
  return termsContent.sections.find((item) => item.title === title);
}

describe("terms document", () => {
  it("uses the official brand name in the lead", () => {
    expect(termsContent.lead).toContain("C AND+S［シーアンドプラスエス］");
  });

  it("sets the return window to 8 days and keeps the statutory carve-outs", () => {
    const returns = section("第7条（商品の返品・交換・キャンセル）");
    const clauses = returns?.clauses ?? [];

    expect(clauses[0]?.text).toContain("商品到着後8日以内に当社に通知");
    expect(clauses[0]?.text).toContain(
      "本項の通知期間は、法令上ユーザーに認められる契約不適合に関する権利を制限するものではありません"
    );
    expect(clauses[2]?.text).toContain("商品到着後8日以内に限り受け付けます");
    expect(clauses[3]?.text).toContain(
      "ただし、商品に契約不適合がある場合その他法令上当社が責任を負う場合を除きます"
    );
    expect(clauses[3]?.bullets?.[0]).toBe("商品到着後8日以上経過した場合");
  });
});
