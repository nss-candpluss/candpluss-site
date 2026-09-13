import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { footerContent } from "@/data/footer";
import { isSocialLinkVisible } from "@/lib/site-navigation-visibility";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function collectSources(relativeDir: string): string[] {
  const absolute = join(rootDir, relativeDir);
  const files: string[] = [];

  for (const entry of readdirSync(absolute)) {
    const entryPath = join(absolute, entry);

    if (statSync(entryPath).isDirectory()) {
      files.push(...collectSources(join(relativeDir, entry)));
      continue;
    }

    if (entry.endsWith(".tsx")) {
      files.push(join(relativeDir, entry));
    }
  }

  return files;
}

/** SNS の href がドメイン直下だけなら、まだ実アカウント URL が入っていない */
function isPlaceholderSocialHref(href: string): boolean {
  return new URL(href).pathname === "/" && !new URL(href).search;
}

describe("外部リンク", () => {
  /**
   * noreferrer だけでも仕様上は noopener 相当だが、書き方が混ざると
   * どちらが意図なのか読めなくなるため揃える。
   */
  it("target=_blank には rel=\"noopener noreferrer\" を付ける", () => {
    const offenders: string[] = [];

    for (const relativePath of [
      ...collectSources("components"),
      ...collectSources("sections"),
      ...collectSources("app"),
    ]) {
      const source = readFileSync(join(rootDir, relativePath), "utf8");

      if (!source.includes('target="_blank"')) {
        continue;
      }

      if (source.includes('rel="noreferrer"')) {
        offenders.push(relativePath);
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * 非表示の SNS は href がドメイン直下のままなので、URL を差し替えずに
   * 表示フラグだけ true にすると、トップページへ飛ぶリンクが出てしまう。
   */
  it("表示する SNS は実アカウントの URL が入っている", () => {
    for (const link of footerContent.socialLinks) {
      if (!isSocialLinkVisible(link.label)) {
        continue;
      }

      expect(
        isPlaceholderSocialHref(link.href),
        `${link.label} の href がドメイン直下のままです: ${link.href}`
      ).toBe(false);
    }
  });

  it("SNS の href は https で絶対 URL になっている", () => {
    for (const link of footerContent.socialLinks) {
      expect(new URL(link.href).protocol, link.label).toBe("https:");
    }
  });
});
