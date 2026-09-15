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

  it("keeps bullet lines at the same line spacing as body copy", () => {
    // ショッピングガイドと特商法の・行は段落内の改行なので、行間は
    // line-height だけになる。LegalDocument の ul にも余白を付けない。
    const fileSource = source("components/legal/LegalDocument.tsx");

    expect(fileSource).toContain('const listClassName = "list-none";');
    expect(fileSource).not.toContain(
      'listClassName =\n  "mt-[calc(16px*var(--gap-scale-y))] list-none space-y-[calc(12px*var(--gap-scale-y))]"'
    );
  });
});
