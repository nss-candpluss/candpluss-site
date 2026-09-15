import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  productLaunchNoticeByHandle,
  productLaunchStartsAtByHandle,
} from "@/data/product-launch-notices";
import { isWebPurchaseEnabled } from "@/lib/commerce/purchase-channel";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

const heroSources = [
  "components/products/product-detail/ProductDetailDesktopHero.tsx",
  "components/products/product-detail/ProductDetailMobileHero.tsx",
] as const;

describe("isWebPurchaseEnabled", () => {
  // 第一弾は公開ページの購入を止める。10/2 の販売開始でここが両方 true になる
  it("公開ページは止めて、テスト領域は買える", () => {
    expect(isWebPurchaseEnabled("public")).toBe(false);
    expect(isWebPurchaseEnabled("test")).toBe(true);
  });
});

describe("COMING SOON 枠", () => {
  const noticeSource = () =>
    readSource("components/products/product-detail/ProductComingSoonNotice.tsx");

  it("押せない要素として組む", () => {
    expect(noticeSource()).not.toContain("<button");
    expect(noticeSource()).not.toContain("onClick");
  });

  it("販売開始時期が未登録の商品でも枠は出る", () => {
    expect(noticeSource()).toContain("{notice ? (");
  });

  // 詳細ページで価格を出しているのはこの枠だけなので、消すと価格が見えなくなる
  it("価格を税込で出す", () => {
    expect(noticeSource()).toContain("¥{priceAmount}");
    expect(noticeSource()).toContain("税込");
  });

  // justify-between なら 1 行のときは左右、折り返したときは各行が左揃えになる
  it("折り返したときは左揃えにする", () => {
    expect(noticeSource()).toContain("flex-wrap");
    expect(noticeSource()).toContain("justify-between");
    expect(noticeSource()).not.toContain("ml-auto");
  });

  it("販売開始日そのものは折り返さない", () => {
    expect(noticeSource()).toContain("whitespace-nowrap");
  });

  // 折り返した 2 行が近づき過ぎないようにする
  it("行間を確保する", () => {
    expect(noticeSource()).toContain("gap-y-[10px]");
  });

  // 帯の幅は画面幅に比例するので、日付のサイズも vw に合わせないとはみ出す
  it("日付のサイズを帯の幅に追従させる", () => {
    for (const path of heroSources) {
      expect(readSource(path)).toMatch(/noticeClassName="text-\[clamp\([\d.]+px,[\d.]+vw,[\d.]+px\)\]/);
    }
  });

  // 大文字だけでディセンダが無く、中央寄せのままだと字面が枠の上寄りに見える
  it("ラベルを枠の上下中央に見せる", () => {
    const source = readSource("components/products/ProductComingSoonBadge.tsx");

    expect(source).toContain("items-center");
    expect(source).toMatch(/translate-y-\[0\.0\d+em\]/);
  });

  it("枠とラベルが同じ赤を使う", () => {
    expect(noticeSource()).toContain("#c40000");
    expect(readSource("components/products/ProductComingSoonBadge.tsx")).toContain(
      "#c40000"
    );
  });

  // 購入停止中に隠したステータスラベルと同じ位置に出す
  it("ラベルは商品名の下に出す", () => {
    for (const path of heroSources) {
      const source = readSource(path);

      expect(source.indexOf("ProductComingSoonBadge className")).toBeGreaterThan(
        source.indexOf("{displayTitle}")
      );
    }
  });
});

describe("商品詳細の購入エリア", () => {
  it("購入停止中は ADD TO CART の代わりに枠を出す", () => {
    for (const path of heroSources) {
      const source = readSource(path);

      expect(source).toContain("isPurchaseEnabled ? (");
      expect(source).toContain("ProductComingSoonNotice");
    }
  });

  it("購入停止中は ADD TO CART を押せる状態にしない", () => {
    for (const path of heroSources) {
      expect(readSource(path)).toContain("const canAddToCart = isPurchaseEnabled");
    }
  });

  // 商品名上の COMING SOON と枠が役目を果たすので、同じ文言を重ねない
  it("購入停止中はステータスラベルを重ねて出さない", () => {
    for (const path of heroSources) {
      const source = readSource(path);
      const labelIndex = source.indexOf("<ProductStatusLabel");
      const guardIndex = source.lastIndexOf("isPurchaseEnabled ? (", labelIndex);

      expect(guardIndex).toBeGreaterThan(-1);
    }
  });
});

describe("一覧カード", () => {
  const cardSource = () => readSource("components/products/ProductCard.tsx");

  it("購入停止中は COMING SOON と販売開始日を出す", () => {
    expect(cardSource()).toContain("const showComingSoon = !isWebPurchaseEnabled(channel)");
    expect(cardSource()).toContain("ProductComingSoonBadge");
    expect(cardSource()).toContain("productLaunchNoticeByHandle");
  });

  // 一覧と詳細で日付がずれないよう、文言は同じデータから引く
  it("詳細ページと同じデータから文言を引く", () => {
    const detailSource = readSource(
      "components/products/product-detail/ProductComingSoonNotice.tsx"
    );

    for (const source of [cardSource(), detailSource]) {
      expect(source).toContain('from "@/data/product-launch-notices"');
    }
  });

  it("購入停止中は Shopify のステータスを重ねて出さない", () => {
    expect(cardSource()).toContain("!showComingSoon &&");
  });

  // 商品名と同じ太さにして、カード内で日付が沈まないようにする
  it("販売開始日はセミボールドで出す", () => {
    expect(cardSource()).toContain(
      "font-body-ja font-semibold text-[#c40000]"
    );
  });

  it("バッジは販売開始日の上に出す", () => {
    const source = cardSource();

    expect(source.indexOf("ProductComingSoonBadge className")).toBeLessThan(
      source.indexOf("{launchNotice}")
    );
  });
});

describe("販売開始時期のデータ", () => {
  it("MOYA420 系は 2027年春、NOKUTA は 2026年12月、それ以外は 10/2", () => {
    expect(productLaunchNoticeByHandle.moya500).toBe(
      "2026年10月2日(金)20:00 販売開始"
    );
    expect(productLaunchNoticeByHandle.moya420).toBe("2027年春 発売予定");
    expect(productLaunchNoticeByHandle.nokuta).toBe("2026年12月 発売予定");

    for (const [handle, notice] of Object.entries(productLaunchNoticeByHandle)) {
      const expected = handle.startsWith("moya420")
        ? "2027年春 発売予定"
        : handle === "nokuta"
          ? "2026年12月 発売予定"
          : "2026年10月2日(金)20:00 販売開始";

      expect(notice, handle).toBe(expected);
    }
  });

  // 日時が決まっていない商品に availabilityStarts を出すと、ずれても気付けない
  it("日時が決まっている 10/2 の商品だけ availabilityStarts の対象にする", () => {
    expect(productLaunchStartsAtByHandle.moya500).toBe(
      "2026-10-02T20:00:00+09:00"
    );
    expect(productLaunchStartsAtByHandle.nokuta).toBeUndefined();
    expect(productLaunchStartsAtByHandle.moya420).toBeUndefined();
  });

  // 未登録だと赤枠の左が空くので、公開中の全商品を入れておく
  it("公開中の商品をすべて登録している", () => {
    const handles = [
      "moya500",
      "moya420",
      "nokuta",
      "zig-stake",
      "moya500_roofsheet",
      "moya500_groundsheet",
      "moya500_innertent",
      "moya500_innertent-mesh",
      "moya500_tpu",
      "moya420_roofsheet",
      "moya420_groundsheet",
      "moya420_innertent",
      "moya420_innertent-mesh",
      "guyrope",
      "triangle-guylineadjuster",
      "gearaid-seam-grip",
      "gearaid-sil-nylon-patch",
    ];

    for (const handle of handles) {
      expect(productLaunchNoticeByHandle[handle]).toBeTruthy();
    }
  });
});
