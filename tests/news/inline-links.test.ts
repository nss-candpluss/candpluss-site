import { describe, expect, it } from "vitest";

import { newsItems } from "@/data/news";
import { splitContentByInlineLinks } from "@/lib/news/inline-links";

describe("splitContentByInlineLinks", () => {
  it("inlineLinks なしなら本文をそのまま1つのテキストとして返す", () => {
    expect(splitContentByInlineLinks("本文だけ")).toEqual([
      { kind: "text", text: "本文だけ" },
    ]);
  });

  it("対象語句の前後をテキストに分割し、語句をリンクにする", () => {
    const segments = splitContentByInlineLinks("詳細はアカウントでお届けします。", [
      { text: "アカウント", href: "https://example.com" },
    ]);

    expect(segments).toEqual([
      { kind: "text", text: "詳細は" },
      { kind: "link", text: "アカウント", href: "https://example.com" },
      { kind: "text", text: "でお届けします。" },
    ]);
  });

  it("同じ語句が複数あってもリンクは最初の一致だけ", () => {
    const segments = splitContentByInlineLinks("AとAとA", [
      { text: "A", href: "https://example.com" },
    ]);

    expect(segments.filter((segment) => segment.kind === "link")).toHaveLength(1);
    expect(segments.map((segment) => segment.text).join("")).toBe("AとAとA");
  });

  it("本文に存在しない語句は無視する", () => {
    expect(
      splitContentByInlineLinks("本文", [{ text: "無い語句", href: "https://example.com" }])
    ).toEqual([{ kind: "text", text: "本文" }]);
  });

  it("分割後のテキストを連結すると元の本文に戻る", () => {
    const article = newsItems.find((item) => item.handle === "fieldstyle-expo-2026");
    const block = article?.body?.find(
      (item) => item.type === "text" && "inlineLinks" in item
    );

    expect(block?.type).toBe("text");

    if (block?.type !== "text" || !("inlineLinks" in block)) {
      return;
    }

    const segments = splitContentByInlineLinks(block.content, block.inlineLinks);

    expect(segments.map((segment) => segment.text).join("")).toBe(block.content);
    expect(segments.filter((segment) => segment.kind === "link")).toEqual([
      {
        kind: "link",
        text: "https://field-style.jp/",
        href: "https://field-style.jp/",
      },
    ]);
  });
});
