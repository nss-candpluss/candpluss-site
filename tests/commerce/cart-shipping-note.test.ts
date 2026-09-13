import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cartDomesticShippingNotes } from "@/data/cart";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

const supportNoteClass =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";

describe("カートの国内配送注釈", () => {
  it("日本語と英語の注釈を持つ", () => {
    expect(cartDomesticShippingNotes).toEqual([
      "※国内配送のみ対応しております。海外への発送は承っておりませんので、あらかじめご了承ください。",
      "*We only ship within Japan. We are unable to ship internationally, so please note this before placing your order.",
    ]);
  });

  it("Support ページの注釈と同じフォント仕様を使う", () => {
    expect(readSource("sections/support/SupportGuide.tsx")).toContain(
      supportNoteClass
    );
    expect(
      readSource("components/commerce/CartDomesticShippingNotes.tsx")
    ).toContain(supportNoteClass);
  });

  it("カートダイアログとカートページの購入ボタン下に出す", () => {
    expect(readSource("components/commerce/CartDialog.tsx")).toContain(
      "CartDomesticShippingNotes"
    );
    expect(readSource("app/cart/page.tsx")).toContain(
      "CartDomesticShippingNotes"
    );
  });
});
