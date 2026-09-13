import { describe, expect, it } from "vitest";

import {
  getProductDescriptionText,
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

  it("短い説明文はそのまま返す", () => {
    const short = `${"あ".repeat(100)}。`;

    expect(getProductMetaDescription(short)).toBe(short);
  });

  // 検索結果・SNS プレビューで途中から切られるため、句点までで収める
  it("120字を超える説明文を上限内の最後の句点で切る", () => {
    const first = `${"あ".repeat(79)}。`;
    const second = `${"い".repeat(200)}。`;

    expect(getProductMetaDescription(first + second)).toBe(first);
  });

  it("上限内に句点が前寄りすぎる場合は文字数で切って三点リーダーを付ける", () => {
    const result = getProductMetaDescription(`短い。${"あ".repeat(300)}`);

    expect(result).toHaveLength(121);
    expect(result.endsWith("…")).toBe(true);
  });
});

// 構造化データは文字数制限がないため、meta と違って全文を渡す
describe("getProductDescriptionText", () => {
  it("120字を超えても切り詰めない", () => {
    const long = `${"あ".repeat(300)}。`;

    expect(getProductDescriptionText(long)).toBe(long);
  });

  it("先頭の見出しは meta と同じく除く", () => {
    expect(getProductDescriptionText("{見出し}\n本文です。")).toBe("本文です。");
  });
});
