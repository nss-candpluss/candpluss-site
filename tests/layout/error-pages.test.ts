import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { errorPageContent, globalErrorContent, notFoundContent } from "@/data/error-pages";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("404 / エラーページ", () => {
  it("Next.js の英語デフォルト画面を置き換える3ファイルが存在する", () => {
    for (const relativePath of [
      "app/not-found.tsx",
      "app/error.tsx",
      "app/global-error.tsx",
    ]) {
      expect(readSource(relativePath).length).toBeGreaterThan(0);
    }
  });

  it("文言は data/error-pages.ts に集約し、ページ側でハードコードしない", () => {
    expect(readSource("app/not-found.tsx")).toContain("notFoundContent");
    expect(readSource("app/error.tsx")).toContain("errorPageContent");
    expect(readSource("app/global-error.tsx")).toContain("globalErrorContent");

    expect(notFoundContent.title).toBe("ページが見つかりません");
    expect(notFoundContent.code).toBe("404");
    expect(errorPageContent.title).toBe("問題が発生しました");
    expect(globalErrorContent.retryLabel).toBe("再読み込み");
  });

  it("404 は主要ページへの導線を持つ", () => {
    expect(notFoundContent.links.map((link) => link.href)).toEqual([
      "/",
      "/products",
      "/contact",
    ]);
  });

  it("エラー境界は Client Component で、Next.js 16 の retry prop を使う", () => {
    for (const relativePath of ["app/error.tsx", "app/global-error.tsx"]) {
      const source = readSource(relativePath);

      expect(source).toContain('"use client"');
      expect(source).toContain("retry: () => void");
      expect(source).toContain("retry()");
      // reset は v16 で非推奨扱い（retry を使う）
      expect(source).not.toContain("reset()");
    }
  });

  it("global-error はレイアウトを置き換えるため html / body と globals.css を自前で持つ", () => {
    const source = readSource("app/global-error.tsx");

    expect(source).toContain('<html lang="ja">');
    expect(source).toContain("<body");
    expect(source).toContain('"./globals.css"');
  });

  // 404 でもタブ・履歴・共有時に内容が分かるようにする。
  // Next.js のドキュメントは global-not-found.js のみ metadata 対応と書いているが、
  // このバージョンの not-found.tsx では title / description が実際に反映される。
  it("404 は専用の title を持ち、サイト名だけの見出しにしない", () => {
    const source = readSource("app/not-found.tsx");

    expect(source).toContain("export const metadata");
    expect(source).toContain("title: notFoundContent.title");
  });

  // Next.js が 404 に noindex を自動注入するため、指定すると robots meta が重複する。
  // 存在しない URL なので canonical も持たせない。
  it("404 は canonical と robots を自前で指定しない", () => {
    const source = readSource("app/not-found.tsx");

    expect(source).not.toMatch(/^\s*robots:/m);
    expect(source).not.toMatch(/^\s*canonical:/m);
    expect(source).not.toContain("createPageMetadata");
  });
});
