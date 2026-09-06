import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function source(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const documentPaths = [
  "components/shopping-guide/ShoppingGuideDocument.tsx",
  "components/legal/CommercialTransactionsDocument.tsx",
  "components/legal/LegalDocument.tsx",
] as const;

describe("legal and shopping-guide nakaguro lists", () => {
  it("renders list items with a nakaguro prefix instead of disc bullets", () => {
    for (const path of documentPaths) {
      const fileSource = source(path);

      expect(fileSource).toContain("list-none");
      expect(fileSource).toContain("・{item}");
      expect(fileSource).not.toContain("list-disc");
    }
  });
});
