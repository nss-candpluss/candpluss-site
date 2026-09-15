import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { newsItems } from "@/data/news";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("News カードの見出し", () => {
  it("truncate の切り取り位置を padding で下げ、同じ量の負の margin で戻す", () => {
    // font-size と line-height が同値の UI テキストは、overflow: hidden だと
    // g などディセンダの下部が欠ける。padding-bottom と -margin-bottom は
    // 同じ値でないと見出しと本文の間隔が変わる。
    const source = readSource("components/news/NewsCard.tsx");

    expect(source).toContain("truncate");
    expect(source).toContain("pb-[3px]");
    expect(source).toContain("-mb-[3px]");
  });
});

describe("News の公開日", () => {
  it("MOYA500 と公式サイト OPEN は 2026-09-15", () => {
    const publishedAtByHandle = Object.fromEntries(
      newsItems.map((item) => [item.handle, item.publishedAt])
    );

    expect(publishedAtByHandle["moya500-order-information"]).toBe("2026-09-15");
    expect(publishedAtByHandle["official-website-open"]).toBe("2026-09-15");
  });

  it("最新順に並べたとき先頭が MOYA500 のお知らせになる", () => {
    // 同一日付は data/news.ts の配列順（上ほど新しい）で並ぶ。
    const sorted = [...newsItems].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );

    expect(sorted[0]?.handle).toBe("moya500-order-information");
  });
});
