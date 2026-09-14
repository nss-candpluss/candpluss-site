import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

/** 総額表示義務。価格を出す箇所には «税込» を添える */
describe("カートの税込表記", () => {
  it("カートページとカートダイアログの両方が税込を表示する", () => {
    for (const relativePath of [
      "components/commerce/CartPageContent.tsx",
      "components/commerce/CartDialog.tsx",
    ]) {
      expect(readSource(relativePath)).toContain("税込");
    }
  });

  it("税込価格と矛盾する «税は確定します» の注記を残さない", () => {
    for (const relativePath of [
      "components/commerce/CartPageContent.tsx",
      "components/commerce/CartDialog.tsx",
    ]) {
      const source = readSource(relativePath);

      expect(source).not.toContain("税・送料はチェックアウト画面で確定します");
      expect(source).toContain("配送料はご購入画面で確定します");
    }
  });
});
