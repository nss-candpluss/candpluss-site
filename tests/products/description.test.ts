import { describe, expect, it } from "vitest";

import {
  getProductMetaDescription,
  parseProductDescription,
} from "@/lib/products/description";

describe("parseProductDescription", () => {
  it("uses a leading braced line as the title", () => {
    expect(
      parseProductDescription(
        "{軽量性と耐久性を両立した大型シェルター}\n本文の一行目。\n\n本文の二行目。"
      )
    ).toEqual({
      title: "軽量性と耐久性を両立した大型シェルター",
      body: "本文の一行目。\n本文の二行目。",
    });
  });

  it("keeps a description without braces as body only", () => {
    expect(parseProductDescription("説明文だけです。")).toEqual({
      body: "説明文だけです。",
    });
  });

  it("ignores an unclosed brace and braces in the middle of the body", () => {
    expect(parseProductDescription("{タイトル")).toEqual({
      body: "{タイトル",
    });
    expect(parseProductDescription("本文の途中に{見出し}がある。")).toEqual({
      body: "本文の途中に{見出し}がある。",
    });
  });
});

describe("getProductMetaDescription", () => {
  it("omits the braced title from the meta description", () => {
    expect(
      getProductMetaDescription("{見出し}\n本文です。")
    ).toBe("本文です。");
  });

  /**
   * Shopify に商品を登録すれば説明文がそのまま description になる。
   * 検索結果で途中から切られても構わない方針なので長さは調整しない。
   */
  it("長い説明文も切り詰めずそのまま返す", () => {
    const long = `${"あ".repeat(300)}。`;

    expect(getProductMetaDescription(long)).toBe(long);
  });
});
