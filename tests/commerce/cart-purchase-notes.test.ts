import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cartPurchaseNotes } from "@/data/cart";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

const supportNoteClass =
  "font-body-ja text-[clamp(12px,calc(13px*var(--text-scale)),13px)] leading-[1.3] text-[var(--foreground)]";

describe("カートの購入前の注釈", () => {
  // 取り消せないこと → いつ届くか → 送料 → どこへ送れるか の順に並べる
  it("キャンセル・発送・送料・配送範囲を、一行ずつ短く出す", () => {
    expect(cartPurchaseNotes).toEqual([
      "※ご注文確定後のキャンセルは原則承っておりません。",
      "※通常、12時までのご注文で翌日発送。（休業日を除く・銀行振込はご入金確認後）",
      "※税込合計5,000円以上のお買い上げで送料無料。",
      "※配送は日本国内のみです。(Japan domestic shipping only.)",
    ]);
  });

  /*
    狭い画面ではカートの半分近くを占めてしまう。
    詳しい条件はショッピングガイドに書き、ここでは要点だけ出す。
  */
  it("一行が長くならないようにする", () => {
    for (const note of cartPurchaseNotes) {
      // 英語を併記する行がいちばん長い。それを上限の目安にする
      expect(note.length).toBeLessThanOrEqual(45);
    }
  });

  it("Support ページの注釈と同じフォント仕様を使う", () => {
    expect(readSource("sections/support/SupportGuide.tsx")).toContain(
      supportNoteClass
    );
    expect(
      readSource("components/commerce/CartPurchaseNotes.tsx")
    ).toContain(supportNoteClass);
  });

  it("カートダイアログとカートページの購入ボタン下に出す", () => {
    expect(readSource("components/commerce/CartDialog.tsx")).toContain(
      "CartPurchaseNotes"
    );
    expect(readSource("components/commerce/CartPageContent.tsx")).toContain(
      "CartPurchaseNotes"
    );
  });
});
