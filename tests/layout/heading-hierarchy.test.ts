import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("見出し階層", () => {
  /**
   * ヒーローのタイトルは画像なので、以前はトップに h1 が無く
   * 見出しが h2「Camp + Something.」から始まっていた。
   * 画像の alt が見出しテキストになるよう、タイトル層自体を h1 にする。
   */
  it("トップのヒーロータイトルが h1 になっている", () => {
    const source = readSource("sections/home/HomeHero.tsx");

    expect(source).toContain("<h1");
    expect(source).toContain("hero-title-layer");
    expect(source).toContain("alt={topHeroContent.titleAlt}");
  });

  // クラス指定のアニメーションなので、タグを変えても壊れないことを担保する
  it("ヒーローのアニメーションはクラスで当たっている", () => {
    expect(readSource("app/globals.css")).toContain(".hero-title-layer");
  });

  /**
   * NewsCard は /news（h1 直下）と トップの「News & Topics」（h2 配下）の
   * 両方で使うため、見出しレベルを固定できない。
   */
  it("NewsCard の見出しレベルを呼び出し側で指定できる", () => {
    const source = readSource("components/news/NewsCard.tsx");

    expect(source).toContain("headingLevel = 3");
    expect(source).toContain('headingLevel === 2 ? "h2" : "h3"');
    expect(source).toContain("<Heading");
    expect(source).not.toContain("<h3");
  });

  it("/news は h1 直下なので NewsCard に h2 を渡す", () => {
    expect(readSource("app/news/page.tsx")).toContain("headingLevel={2}");
  });

  it("トップの News は h2 配下なので既定の h3 のまま", () => {
    const source = readSource("sections/home/HomeNews.tsx");

    expect(source).toContain("<h2");
    expect(source).not.toContain("headingLevel");
  });

  /**
   * /support のアコーディオンはセクション見出しを持たず h1 直下に来るため、
   * h3 だとレベルが飛ぶ。
   */
  it("/support のアコーディオン見出しが h2 になっている", () => {
    const source = readSource("sections/support/SupportAccordion.tsx");

    expect(source).toContain("<h2");
    expect(source).not.toContain("<h3");
  });

  /**
   * confirm ページは下書きが無いと null を返して /contact へ戻すため、
   * 直接アクセスした HTML には h1 が出ない（欠落ではない）。
   */
  it("confirm ページは描画時に h1 を持つ", () => {
    for (const path of [
      "sections/contact/ContactConfirm.tsx",
      "sections/support/SupportContactConfirm.tsx",
    ]) {
      expect(readSource(path)).toContain("<h1");
    }
  });
});
