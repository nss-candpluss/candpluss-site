import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { accountFieldNotes, accountMemberCopy } from "@/lib/commerce/account-field-notes";
import {
  ACCOUNT_CANCELLED_BADGE,
  ACCOUNT_PAGE_TABS,
  accountAddressDeleteHref,
  accountOrderHasReceipt,
  accountAddressEditHref,
  accountAddressIdFromSearch,
  accountPageNotice,
  accountPageTabHref,
  accountOrderLineImageAlt,
  accountOrderLineTitle,
  accountOrderLineVariantTitle,
  accountOrderLinesByAmount,
  accountOrderOptionalFields,
  accountOrderParcelLabel,
  accountOrderParcels,
  accountOrderPaymentDisplay,
  accountOrderPaymentMethods,
  accountOrderShipmentDisplay,
  formatAccountCardBrand,
  formatAccountCarrierName,
  formatAccountAddressLine,
  formatAccountAddressName,
  formatAccountCancelReason,
  formatAccountDate,
  formatAccountFinancialStatus,
  formatAccountMoney,
  formatAccountMoneyAmount,
  formatAccountOrderPaymentStatus,
  formatAccountName,
  formatAccountOrderDateTime,
  formatAccountPostalCode,
  formatAccountPrefecture,
  formatAccountShipmentStatus,
  resolveAccountPageTabId,
  shopifyCustomerProfileUrlFromAccountUrl,
  shouldHandleAccountShallowClick,
} from "@/lib/commerce/account-page";
import {
  japanZones,
  normalizeJapanZoneCode,
  prefectureFromJapanZoneCode,
} from "@/lib/commerce/japan-zone-code";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

describe("会員ページの見出し", () => {
  it("姓と名があれば日本語順でつなぐ", () => {
    expect(
      formatAccountName({
        displayName: "Taro Yamada",
        lastName: "山田",
        firstName: "太郎",
      })
    ).toBe("山田 太郎");
  });

  it("姓名が空なら表示名を使う", () => {
    expect(
      formatAccountName({
        displayName: "Member",
        lastName: "  ",
        firstName: null,
      })
    ).toBe("Member");
  });

  it("作成日を年月日だけにする", () => {
    expect(formatAccountDate("2026-03-15T12:00:00.000Z")).toBe("2026年3月15日");
    expect(formatAccountDate(null)).toBeNull();
  });

  it("注文日時を 2026/09/20 20:28 形式にする", () => {
    expect(formatAccountOrderDateTime("2026-09-20T11:28:00.000Z")).toBe(
      "2026/09/20 20:28"
    );
    expect(formatAccountOrderDateTime(null)).toBeNull();
  });

  it("認証用 URL から Shopify のプロフィール画面 URL を組み立てる", () => {
    expect(
      shopifyCustomerProfileUrlFromAccountUrl(
        "https://shopify.com/authentication/68762402914"
      )
    ).toBe("https://shopify.com/68762402914/account/profile");
    expect(
      shopifyCustomerProfileUrlFromAccountUrl(
        "https://shopify.com/authentication/68762402914/oauth/authorize"
      )
    ).toBe("https://shopify.com/68762402914/account/profile");
    expect(
      shopifyCustomerProfileUrlFromAccountUrl(
        "https://account.example.com"
      )
    ).toBe("https://account.example.com/profile");
    expect(
      shopifyCustomerProfileUrlFromAccountUrl("https://candpluss.camp")
    ).toBeNull();
    expect(shopifyCustomerProfileUrlFromAccountUrl("not-a-url")).toBeNull();
  });
});

describe("注文履歴の商品行", () => {
  it("商品名はタイトルを優先し、なければ注文行名を使う", () => {
    expect(
      accountOrderLineTitle({ name: "MOYA500 - Sand", title: "MOYA500" })
    ).toBe("MOYA500");
    expect(accountOrderLineTitle({ name: "ギフト包装", title: "  " })).toBe(
      "ギフト包装"
    );
  });

  it("Default Title と、商品名に含まれるバリエーションは出さない", () => {
    expect(
      accountOrderLineVariantTitle({
        name: "MOYA500",
        title: "MOYA500",
        variantTitle: "Default Title",
      })
    ).toBeNull();
    expect(
      accountOrderLineVariantTitle({
        name: "MOYA500 - Sand",
        title: "MOYA500 - Sand",
        variantTitle: "Sand",
      })
    ).toBeNull();
    expect(
      accountOrderLineVariantTitle({
        name: "MOYA500 - Sand",
        title: "MOYA500",
        variantTitle: "Sand",
      })
    ).toBe("Sand");
  });

  it("画像 alt は代替テキスト、なければ商品名", () => {
    expect(
      accountOrderLineImageAlt({
        name: "MOYA500",
        title: "MOYA500",
        image: { url: "https://cdn.shopify.com/a.jpg", altText: "テント" },
      })
    ).toBe("テント");
    expect(
      accountOrderLineImageAlt({
        name: "MOYA500",
        title: "MOYA500",
        image: { url: "https://cdn.shopify.com/a.jpg", altText: "  " },
      })
    ).toBe("MOYA500");
  });

  it("金額の高い順に並べ、同額なら Shopify の順を保つ", () => {
    const lines = [
      { id: "peg", totalPrice: { amount: "550" } },
      { id: "tent", totalPrice: { amount: "372000" } },
      { id: "rope-a", totalPrice: { amount: "2400" } },
      { id: "rope-b", totalPrice: { amount: "2400" } },
      { id: "gift", price: { amount: "1680" } },
    ];

    expect(accountOrderLinesByAmount(lines).map((line) => line.id)).toEqual([
      "tent",
      "rope-a",
      "rope-b",
      "gift",
      "peg",
    ]);
  });

  it("金額が取れない行は 0 として扱い、並べ替えで落とさない", () => {
    const lines = [
      { id: "unknown" },
      { id: "broken", totalPrice: { amount: "" } },
      { id: "tarp", totalPrice: { amount: "48000" } },
    ];

    expect(accountOrderLinesByAmount(lines).map((line) => line.id)).toEqual([
      "tarp",
      "unknown",
      "broken",
    ]);
  });

  it("個口ごとに注文行を振り分け、未発送の残りを分けて返す", () => {
    const lineItems = [
      { id: "tent", quantity: 1, price: { amount: "48000" } },
      { id: "peg", quantity: 3, price: { amount: "1200" } },
      { id: "rope", quantity: 2, price: { amount: "800" } },
    ];
    const { parcels, pending } = accountOrderParcels(lineItems, [
      {
        id: "f1",
        fulfillmentLineItems: {
          nodes: [
            { quantity: 2, lineItem: { id: "peg" } },
            { quantity: 1, lineItem: { id: "tent" } },
          ],
        },
      },
      {
        id: "f2",
        fulfillmentLineItems: { nodes: [{ quantity: 1, lineItem: { id: "peg" } }] },
      },
    ]);

    // 個口の中も金額の高い順
    expect(
      parcels.map((parcel) =>
        parcel.lines.map((entry) => [entry.line.id, entry.quantity])
      )
    ).toEqual([
      [
        ["tent", 1],
        ["peg", 2],
      ],
      [["peg", 1]],
    ]);
    // どの個口にも入っていない分だけが残る
    expect(pending.map((entry) => [entry.line.id, entry.quantity])).toEqual([
      ["rope", 2],
    ]);
  });

  it("個口の見出しは左右で同じ呼び方にする", () => {
    expect(accountOrderParcelLabel(0, 3)).toBe("全3個口の1個口目");
    expect(accountOrderParcelLabel(2, 3)).toBe("全3個口の3個口目");
  });

  it("配送業者は日本語にし、知らない会社はそのまま出す", () => {
    expect(formatAccountCarrierName("Sagawa (JA)")).toBe("佐川急便");
    expect(formatAccountCarrierName("Yamato (EN)")).toBe("ヤマト運輸");
    expect(formatAccountCarrierName("Japan Post (JA)")).toBe("日本郵便");
    // もとから日本語で来る運送会社と、海外の運送会社は触らない
    expect(formatAccountCarrierName("西濃運輸")).toBe("西濃運輸");
    expect(formatAccountCarrierName("DHL Express")).toBe("DHL Express");
    expect(formatAccountCarrierName("  ")).toBeNull();
  });

  it("注文履歴はサムネイルと商品名で出す", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("SiteImage");
    expect(source).toContain("accountOrderLineTitle");
    expect(source).toContain("accountOrderLinesByAmount(order.lineItems.nodes)");
    // 何の一覧かは商品を見れば分かるので、個口で分かれないときは見出しなし
    expect(source).not.toContain("ご購入商品");
    expect(source).not.toContain('label="画像 URL"');
    expect(source).not.toContain("LINE ITEMS");
  });

  it("通常の注文では内部項目を出さず、状況がある項目だけ出す", () => {
    expect(
      accountOrderOptionalFields({
        edited: false,
        cancelledAt: null,
        cancelReason: null,
        note: "  ",
        poNumber: null,
        locationName: null,
        totalRefunded: { amount: "0" },
      })
    ).toEqual({
      showUpdatedAt: false,
      showCancelledAt: false,
      showCancelReason: false,
      showEdited: false,
      showNote: false,
      showRefunded: false,
      showPoNumber: false,
      showLocationName: false,
      showAnyDetail: false,
    });
    expect(
      accountOrderOptionalFields({
        edited: true,
        cancelledAt: "2026-03-16T00:00:00.000Z",
        cancelReason: "顧客都合",
        note: "置き配希望",
        poNumber: "PO-1",
        locationName: "福岡倉庫",
        totalRefunded: { amount: "1000" },
      })
    ).toEqual({
      showUpdatedAt: true,
      showCancelledAt: true,
      showCancelReason: true,
      showEdited: true,
      showNote: true,
      showRefunded: true,
      showPoNumber: true,
      showLocationName: true,
      showAnyDetail: true,
    });
    // 返金額はサマリーに出すので、この区画だけのためには開かない
    expect(
      accountOrderOptionalFields({
        edited: false,
        cancelledAt: null,
        cancelReason: null,
        note: null,
        poNumber: null,
        locationName: null,
        totalRefunded: { amount: "1000" },
      }).showAnyDetail
    ).toBe(false);
  });

  it("配送状況は個口すべてが同じときだけ運送会社の状況を出す", () => {
    expect(formatAccountFinancialStatus("PAID")).toBe("お支払い済み");
    expect(formatAccountFinancialStatus("PENDING")).toBe("お支払い待ち");
    expect(
      formatAccountOrderPaymentStatus("PENDING", [{ type: "BANK_DEPOSIT" }])
    ).toBe("ご入金確認中");
    expect(
      formatAccountOrderPaymentStatus("PENDING", [{ type: "CARD" }])
    ).toBe("お支払い待ち");
    expect(
      formatAccountOrderPaymentStatus("PAID", [{ type: "BANK_DEPOSIT" }])
    ).toBe("お支払い済み");
    expect(formatAccountShipmentStatus("IN_TRANSIT")).toBe("輸送中");
    // 発送前はバッジも発送情報の欄と同じ言い方にする
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "UNFULFILLED",
        fulfillments: { nodes: [] },
      })
    ).toEqual({ label: "発送準備中", tone: "waiting" });
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "FULFILLED",
        fulfillments: { nodes: [{ latestShipmentStatus: "OUT_FOR_DELIVERY" }] },
      })
    ).toEqual({ label: "配達中", tone: "active" });
    // 個口ごとに状況が違うなら、注文全体の発送状態で伝える
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "PARTIALLY_FULFILLED",
        fulfillments: {
          nodes: [
            { latestShipmentStatus: "DELIVERED" },
            { latestShipmentStatus: "IN_TRANSIT" },
          ],
        },
      })
    ).toEqual({ label: "一部発送", tone: "active" });
    // 全部の個口が同じ状況なら、その状況を出してよい
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "FULFILLED",
        fulfillments: {
          nodes: [
            { latestShipmentStatus: "DELIVERED" },
            { latestShipmentStatus: "DELIVERED" },
          ],
        },
      })
    ).toEqual({ label: "配達済み", tone: "done" });
  });

  it("バッジの色は Shopify のコードで決める", () => {
    expect(accountOrderPaymentDisplay("PAID", [])).toEqual({
      label: "お支払い済み",
      tone: "done",
    });
    expect(
      accountOrderPaymentDisplay("PENDING", [{ type: "BANK_DEPOSIT" }])
    ).toEqual({ label: "ご入金確認中", tone: "waiting" });
    expect(accountOrderPaymentDisplay("VOIDED", [])).toEqual({
      label: "お支払い取消",
      tone: "alert",
    });
    // 発送保留は在庫待ちなど運営都合が多いので、進行中と同じ扱いにする
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "ON_HOLD",
        fulfillments: { nodes: [] },
      })
    ).toEqual({ label: "発送保留中", tone: "active" });
    expect(accountOrderPaymentDisplay(null, [])).toBeNull();
    // 配達を試みたまま止まっているのは、お客様に動いてほしい状態
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "FULFILLED",
        fulfillments: {
          nodes: [{ latestShipmentStatus: "ATTEMPTED_DELIVERY" }],
        },
      })
    ).toEqual({ label: "ご不在でした", tone: "alert" });
    // 運送会社が動き出したら、注文したままの状態とは色を変える
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "FULFILLED",
        fulfillments: { nodes: [{ latestShipmentStatus: "IN_TRANSIT" }] },
      })
    ).toEqual({ label: "輸送中", tone: "active" });
    expect(accountOrderPaymentDisplay("AUTHORIZED", [])).toEqual({
      label: "お支払い確定前",
      tone: "active",
    });
    // 集荷前の3つは、お客様から見ると同じ状態なのでまとめる
    expect(formatAccountShipmentStatus("CONFIRMED")).toBe("発送手配済み");
    expect(formatAccountShipmentStatus("LABEL_PURCHASED")).toBe("発送手配済み");
    expect(formatAccountShipmentStatus("LABEL_PRINTED")).toBe("発送手配済み");
  });

  it("注文履歴から内部用の常時表示項目を外す", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("accountOrderOptionalFields");
    expect(source).toContain("accountOrderShipmentDisplay");
    expect(source).toContain("ご注文番号：");
    expect(source).toContain("ご注文日時：");
    expect(source).toContain("OrderStatusBadge");
    expect(source).not.toContain('label="注文番号"');
    expect(source).not.toContain('label="注文日時"');
    expect(source).not.toContain('label="支払い状況"');
    expect(source).toContain("サマリー");
    expect(source).toContain('label="小計"');
    expect(source).toContain('label="配送料"');
    expect(source).toContain('label="消費税"');
    expect(source).toContain('label="ご請求額"');
    // 税はサマリーの独立した行にするので、金額に税込を付けない
    expect(source).toContain("formatAmount(order.totalPrice)");
    expect(source).not.toContain("formatMoney(order.totalPrice)");
    expect(source).toContain("formatAccountMoney");
    expect(source).toContain("発送情報");
    // 発送が未登録なのは「値がない」ではなく、まだ発送手配が済んでいない状態
    expect(source).toContain("発送準備中");
    expect(source).toContain('label="配送状況"');
    // 個口の見分けは左右で同じ呼び方にし、中身は左の購入商品だけで出す
    expect(source).toContain("accountOrderParcelLabel");
    expect(source).toContain("fulfillments.length > 1");
    expect(source).not.toContain("つ目の発送");
    expect(readSource("lib/shopify/customer-account.ts")).toContain(
      "fulfillmentLineItems(first: 20)"
    );
    expect(source).toContain('label="配送業者"');
    expect(source).toContain('label="追跡番号"');
    expect(source).toContain("配送状況を追跡する");
    expect(source).toContain("配送履歴");
    // 同じ内容を Shopify のページで見せ直さず、問い合わせ導線だけ置く
    expect(source).not.toContain("statusPageUrl");
    expect(source).toContain("キャンセル・返品、その他ご注文に関するお問い合わせ");
    expect(source).toContain('href="/contact"');
    // 発送の社内管理項目はお客様には出さない
    expect(source).not.toContain('label="発送 ID"');
    expect(source).not.toContain('label="発送状態"');
    expect(source).not.toContain('label="店頭受け取り済み"');
    expect(source).toContain("領収書を見る");
    expect(source).toContain("決済方法");
    expect(source).toContain("accountOrderPaymentMethods");
    // 決済方法は「銀行振込：ご入金確認中」のように支払い状況まで見せる
    expect(source).toContain("`${method.label}：${inlineStatus}`");
    expect(source).toContain("status={paymentStatus}");
    // 通ったカードに状況は要らない。カードだけ、要対応を下に赤で出す
    expect(source).toContain('method.isCard && status.tone === "done"');
    expect(source).toContain('status?.tone === "alert"');
    expect(source).toContain("shownStatus && isAlert && method.isCard");
    expect(source).toContain("text-[#9b1b30]");
    expect(source).toContain("ご請求先");
    expect(source).toContain("order.billingAddress");
    expect(source).not.toContain(">請求先<");
    expect(source).not.toContain("FULFILLMENTS");
    expect(source).not.toContain("TRACKING");
    expect(source).not.toContain("EVENTS");
    expect(source).not.toContain("SHIPPING ADDRESS");
    expect(source).not.toContain("BILLING ADDRESS");
    expect(source).not.toContain("VIEW RECEIPT");
    expect(source).not.toContain('label="チップ"');
    expect(source).not.toContain('label="関税"');
    expect(source).not.toContain('label="連番"');
    expect(source).not.toContain('label="確認番号"');
    expect(source).not.toContain('label="ID"');
    expect(source).not.toContain('label="作成日時"');
    expect(source).not.toContain('label="配送が必要"');
    expect(source).not.toContain('label="通貨"');
    expect(source).not.toContain("order.email");
    expect(source).not.toContain("order.phone");
    expect(source).not.toContain("order.customerLocale");
    expect(source).not.toContain("order.currencyCode");
    expect(source).not.toContain("order.confirmationNumber");
    expect(source).not.toContain("order.requiresShipping");
    expect(source).toContain("formatAccountAddressLine");
    expect(source).toContain("お届け先");
    expect(source).not.toContain(">配送先<");
    expect(source).not.toContain("accountFieldNotes.order.shippingAddress");
    expect(source).not.toContain("accountFieldNotes.order.billingAddress");
    expect(source).not.toContain(' / ID"');
    expect(source).not.toContain(' / 姓"');
    expect(source).not.toContain(' / 名"');
    expect(source).not.toContain(" / 氏名");
    expect(source).not.toContain(' / 国"');
    expect(source).not.toContain(' / 国コード"');
    expect(source).not.toContain(' / 都道府県コード"');
    expect(source).not.toContain(' / エリア表記"');
    expect(source).not.toContain(' / 整形済み住所"');
  });

  it("キャンセルした注文は発送状況を出さず、キャンセル済とだけ伝える", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(ACCOUNT_CANCELLED_BADGE).toEqual({
      label: "キャンセル済",
      tone: "alert",
    });
    // バッジも発送情報の区画も、取り消した注文には出さない
    expect(source).toContain("ACCOUNT_CANCELLED_BADGE");
    expect(source).toContain("const showFulfillments = !isCancelled");
    expect(source).toContain("{showFulfillments ? (");

    // キャンセル理由は Shopify の enum のままにしない
    expect(formatAccountCancelReason("CUSTOMER")).toBe("お客様のご希望");
    expect(formatAccountCancelReason("INVENTORY")).toBe(
      "在庫を確保できなかったため"
    );
    expect(formatAccountCancelReason("DECLINED")).toBe(
      "決済が承認されなかったため"
    );
    expect(formatAccountCancelReason("STAFF")).toBe("当店の都合");
    expect(formatAccountCancelReason("FRAUD")).toBe("確認が取れなかったため");
    expect(formatAccountCancelReason(null)).toBeNull();
    expect(source).toContain("formatAccountCancelReason(order.cancelReason)");
  });

  it("代金を受け取った注文だけ領収書を出す", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(accountOrderHasReceipt({ financialStatus: "PAID" })).toBe(true);
    // 受け取った事実は残るので、一部返金でも出す
    expect(accountOrderHasReceipt({ financialStatus: "PARTIALLY_REFUNDED" })).toBe(
      true
    );
    expect(accountOrderHasReceipt({ financialStatus: "PENDING" })).toBe(false);
    expect(accountOrderHasReceipt({ financialStatus: "AUTHORIZED" })).toBe(false);
    expect(accountOrderHasReceipt({ financialStatus: "PARTIALLY_PAID" })).toBe(
      false
    );
    expect(accountOrderHasReceipt({ financialStatus: "REFUNDED" })).toBe(false);
    expect(
      accountOrderHasReceipt({
        financialStatus: "PAID",
        cancelledAt: "2026-09-20T10:00:00Z",
      })
    ).toBe(false);

    expect(source).toContain("accountOrderHasReceipt(order)");
    // 金額の話のすぐ後、発送情報より前に置く
    expect(source.indexOf("領収書を見る")).toBeGreaterThan(
      source.indexOf("<OrderAmountSummary")
    );
    expect(source.indexOf("領収書を見る")).toBeLessThan(
      source.indexOf('title="発送情報"')
    );
  });

  it("注文カードは既定で折りたたみ、続きがあることを見せる", () => {
    const card = readSource("components/commerce/AccountPageContent.tsx");
    const collapse = readSource("components/commerce/OrderCardCollapse.tsx");

    // 見出しは残したまま、中身だけを畳む
    expect(card).toContain("<OrderCardCollapse>");
    expect(card).toContain("data-order-line");
    expect(card.indexOf("ご注文番号：")).toBeLessThan(
      card.indexOf("<OrderCardCollapse>")
    );

    expect(collapse).toContain('"use client"');
    // 既定は閉じた状態
    expect(collapse).toContain("useState(false)");
    // 2 つ目の画像が半分見えるところで切る
    expect(collapse).toContain("[data-order-line]");
    expect(collapse).toContain("halfImage");
    // 切れ目は白へのグラデーションでぼかす
    expect(collapse).toContain("linear-gradient(to_bottom,transparent,#fff)");
    expect(collapse).toContain("すべて表示");
    expect(collapse).toContain("閉じる");
    expect(collapse).toContain("font-semibold ${uiText(16)}");
    expect(collapse).toContain("aria-expanded");
    // 画面幅で画像の大きさが変わるので測り直す
    expect(collapse).toContain("ResizeObserver");
  });

  it("お届け先は氏名と1行の住所にする", () => {
    expect(formatAccountPostalCode("812-0011")).toBe("〒812-0011");
    expect(formatAccountPostalCode("〒 8120011")).toBe("〒8120011");
    expect(formatAccountPostalCode("  ")).toBeNull();
    expect(
      formatAccountPrefecture({ zoneCode: "JP-40", province: "FUKUOKA" })
    ).toBe("福岡県");
    expect(
      formatAccountAddressName({
        name: "Taro Yamada",
        lastName: "山田",
        firstName: "太郎",
      })
    ).toBe("山田太郎 様");
    expect(
      formatAccountAddressLine({
        zip: "100-0000",
        zoneCode: "JP-13",
        province: "TOKYO",
        city: "中央区千代田町",
        address1: "1-2-3",
        address2: "ハイツ未来 101号室",
      })
    ).toBe("〒100-0000 東京都 中央区千代田町 1-2-3 ハイツ未来 101号室");
  });

  it("金額は税込の注記を付ける版と、金額だけの版を出し分ける", () => {
    expect(
      formatAccountMoney({ amount: "426230", currencyCode: "JPY" })
    ).toBe("￥426,230 税込");
    expect(
      formatAccountMoneyAmount({ amount: "426230", currencyCode: "JPY" })
    ).toBe("￥426,230");
    expect(formatAccountMoneyAmount(null)).toBeNull();
  });

  it("決済方法は銀行振込か、カードブランドと下4桁を出す", () => {
    expect(formatAccountCardBrand("jcb")).toBe("JapanCreditBureau");
    expect(
      accountOrderPaymentMethods([
        {
          id: "tx-bank",
          type: "BANK_DEPOSIT",
          kind: "SALE",
          status: "PENDING",
        },
        // 手動の決済は受付と入金確認で取引が 2 件残る。手段は 1 つ
        {
          id: "tx-bank-paid",
          type: "BANK_DEPOSIT",
          kind: "SALE",
          status: "SUCCESS",
        },
      ])
    ).toEqual([
      expect.objectContaining({
        id: "tx-bank",
        label: "銀行振込",
        isCard: false,
      }),
    ]);
    expect(
      accountOrderPaymentMethods([
        {
          id: "tx-card",
          type: "CARD",
          kind: "SALE",
          status: "SUCCESS",
          paymentDetails: { cardBrand: "JCB", last4: "0399" },
        },
        {
          id: "tx-auth",
          type: "CARD",
          kind: "AUTHORIZATION",
          status: "SUCCESS",
          paymentDetails: { cardBrand: "JCB", last4: "0399" },
        },
      ])
    ).toEqual([
      expect.objectContaining({
        id: "tx-card",
        label: "JapanCreditBureau••••0399",
        isCard: true,
      }),
    ]);
  });
});

describe("会員ページのタブ", () => {
  it("閲覧と編集を分けず、既存セクションだけをタブにする", () => {
    expect(ACCOUNT_PAGE_TABS.map((tab) => tab.label)).toEqual([
      "注文履歴",
      "プロフィール",
      "住所",
    ]);
    expect(ACCOUNT_PAGE_TABS.map((tab) => tab.id)).not.toContain("update-profile");
    expect(ACCOUNT_PAGE_TABS.map((tab) => tab.id)).not.toContain("update-address");
  });

  it("更新リダイレクトは同じタブへ戻す", () => {
    expect(resolveAccountPageTabId({ search: "?updated=profile" })).toBe(
      "profile"
    );
    expect(resolveAccountPageTabId({ search: "?error=address" })).toBe(
      "addresses"
    );
  });

  it("tab クエリで開き、なければ注文履歴", () => {
    expect(resolveAccountPageTabId({ search: "?tab=profile" })).toBe("profile");
    expect(resolveAccountPageTabId({})).toBe("orders");
  });

  it("タブリンクは ?tab= を付け、更新クエリと編集中の住所は外す", () => {
    expect(accountPageTabHref("orders")).toBe("?tab=orders");
    expect(accountPageTabHref("profile", "updated=profile&tab=profile")).toBe(
      "?tab=profile"
    );
    expect(
      accountPageTabHref("addresses", "tab=addresses&address=gid&confirmDelete=gid")
    ).toBe("?tab=addresses");
  });

  it("tab があれば更新クエリより優先する", () => {
    expect(
      resolveAccountPageTabId({ search: "?tab=addresses&updated=address" })
    ).toBe("addresses");
    expect(resolveAccountPageTabId({ search: "?updated=address-deleted" })).toBe(
      "addresses"
    );
  });

  it("ハッシュがあればそのタブを開き、なければ注文履歴", () => {
    expect(resolveAccountPageTabId({ hash: "#profile" })).toBe("profile");
    expect(resolveAccountPageTabId({})).toBe("orders");
  });
});

describe("住所の都道府県コード", () => {
  it("47 都道府県を Shopify と同じ JIS 順のコードで持つ", () => {
    expect(japanZones).toHaveLength(47);
    expect(japanZones[0]).toEqual({ prefecture: "北海道", zoneCode: "JP-01" });
    expect(japanZones.at(-1)).toEqual({
      prefecture: "沖縄県",
      zoneCode: "JP-47",
    });
    expect(prefectureFromJapanZoneCode("JP-13")).toBe("東京都");
    expect(prefectureFromJapanZoneCode("JP-40")).toBe("福岡県");
  });

  // Shopify から来る値の表記ゆれで、選択済みの都道府県が消えないようにする
  it("桁揃えや大小文字の違いを JP-01 形式に寄せる", () => {
    expect(normalizeJapanZoneCode("jp-1")).toBe("JP-01");
    expect(normalizeJapanZoneCode("40")).toBe("JP-40");
    expect(normalizeJapanZoneCode("JP-99")).toBe("");
    expect(normalizeJapanZoneCode(null)).toBe("");
  });
});

describe("住所の編集導線", () => {
  it("保存失敗は住所タブへ戻し、新規だけ追加フォームを開く", () => {
    expect(accountAddressEditHref("gid://shopify/CustomerAddress/1")).toBe(
      "?tab=addresses"
    );
    expect(accountAddressEditHref()).toBe("?tab=addresses&address=new");
    expect(accountAddressDeleteHref("gid://shopify/CustomerAddress/1")).toBe(
      "?tab=addresses&confirmDelete=gid%3A%2F%2Fshopify%2FCustomerAddress%2F1"
    );
    expect(
      accountAddressIdFromSearch("tab=addresses&address=gid%3A%2F%2Fa")
    ).toBe("gid://a");
  });

  it("更新結果を日本語の 1 行に変える", () => {
    expect(accountPageNotice("?updated=address")?.tone).toBe("success");
    expect(accountPageNotice("?updated=address-deleted")?.message).toBe(
      "住所を削除しました。"
    );
    expect(accountPageNotice("?error=address-default")).toEqual({
      tone: "error",
      message: "既定の住所を変更できませんでした。",
    });
    expect(accountPageNotice("")).toBeNull();
  });
});

describe("会員が自分で変更できる範囲", () => {
  // Customer Account API はメールアドレスと電話番号の変更に対応していない
  it("プロフィール更新は名前とメール配信だけを送る", () => {
    const source = readSource("app/api/shopify/customer/profile/route.ts");

    expect(source).toContain("updateCustomerProfile");
    expect(source).toContain("setCustomerEmailMarketing");
    expect(source).toContain("isEmailMarketingSubscribed");
    expect(source).not.toContain("emailAddress:");
    expect(source).not.toContain("phoneNumber:");
  });

  it("住所は保存・既定設定・削除を 1 つのルートで受ける", () => {
    const source = readSource("app/api/shopify/customer/address/route.ts");

    expect(source).toContain('z.enum(["save", "default", "delete"])');
    expect(source).toContain("setDefaultCustomerAddress");
    expect(source).toContain("deleteCustomerAddress");
  });

  // ngrok 経由だと request.url が localhost のままで、戻り先を見失う
  it("更新後のリダイレクトは公開オリジンへ戻す", () => {
    for (const path of [
      "app/api/shopify/customer/profile/route.ts",
      "app/api/shopify/customer/address/route.ts",
    ]) {
      const source = readSource(path);

      expect(source).toContain("publicOriginFromRequest");
      expect(source).not.toContain("request.url)");
    }
  });

  it("既定の住所は呼び出し側が決める", () => {
    const source = readSource("lib/shopify/customer-account.ts");

    expect(source).toContain("defaultAddress = false");
    expect(source).toContain("$defaultAddress: Boolean");
    expect(source).toContain("customerAddressDelete");
    expect(source).toContain("customerEmailMarketingSubscribe");
    expect(source).toContain("customerEmailMarketingUnsubscribe");
  });
});

describe("会員ページの画面構成", () => {
  it("Account 見出しを出さず、名前とタブに切り替える", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).not.toContain(">Account<");
    expect(source).toContain("formatAccountName");
    expect(source).toContain("formatAccountDate");
    expect(source).toContain("AccountTabs");
  });

  // 全タブ分を 1 回で取得しているので、タブを移るたびに取り直す必要がない
  it("タブ切替はサーバーへ取りに行かず、表示だけを切り替える", () => {
    const contentSource = readSource("components/commerce/AccountPageContent.tsx");
    const tabsSource = readSource("components/commerce/AccountTabs.tsx");
    const testPageSource = readSource("app/shopify-test/account/page.tsx");
    const publicPageSource = readSource("app/account/page.tsx");

    expect(tabsSource).toContain('"use client"');
    expect(tabsSource).toContain("useSearchParams");
    expect(tabsSource).toContain("accountPageTabHref");
    expect(tabsSource).toContain("justify-center");
    expect(tabsSource).toContain("hidden={tab.id !== activeTabId}");
    expect(contentSource).toContain("<OrdersPanel");
    expect(contentSource).toContain("<ProfilePanel");
    expect(contentSource).toContain("<AddressesPanel");
    expect(contentSource).not.toContain("activeTabId");
    expect(testPageSource).not.toContain("searchParams");
    expect(publicPageSource).not.toContain("searchParams");
  });

  // リンクのまま残すことで、JavaScript が動く前のクリックでも同じ場所へ行ける
  it("表示だけ切り替えるリンクは通常の遷移も残す", () => {
    const linkSource = readSource("components/commerce/AccountShallowLink.tsx");

    expect(linkSource).toContain("href={href}");
    expect(linkSource).toContain("window.history.pushState");
    expect(linkSource).toContain("shouldHandleAccountShallowClick");
  });

  it("修飾キー付きや中クリックはブラウザに任せる", () => {
    const plainClick = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      defaultPrevented: false,
    };

    expect(shouldHandleAccountShallowClick(plainClick)).toBe(true);
    expect(
      shouldHandleAccountShallowClick({ ...plainClick, metaKey: true })
    ).toBe(false);
    expect(
      shouldHandleAccountShallowClick({ ...plainClick, ctrlKey: true })
    ).toBe(false);
    expect(
      shouldHandleAccountShallowClick({ ...plainClick, shiftKey: true })
    ).toBe(false);
    expect(shouldHandleAccountShallowClick({ ...plainClick, button: 1 })).toBe(
      false
    );
    expect(
      shouldHandleAccountShallowClick({ ...plainClick, defaultPrevented: true })
    ).toBe(false);
  });

  // タブを移ると URL から updated が外れるので、表示も一緒に消す必要がある
  it("更新結果の 1 行は URL に追従させる", () => {
    const noticeSource = readSource("components/commerce/AccountNotice.tsx");
    const contentSource = readSource("components/commerce/AccountPageContent.tsx");

    expect(noticeSource).toContain('"use client"');
    expect(noticeSource).toContain("useSearchParams");
    expect(noticeSource).toContain("accountPageNotice");
    expect(contentSource).toContain("<AccountNotice />");
    expect(contentSource).not.toContain("accountPageNotice");
  });

  // 会員の更新フォームだけ別デザインになると、同じサイト内で入力の作法が変わる
  it("更新フォームは問い合わせフォームと同じ部品を使う", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");
    const formSource = readSource("components/commerce/AccountUpdateForm.tsx");

    expect(source).toContain("AccountUpdateForm");
    expect(source).toContain("ContactField");
    expect(source).toContain("SupportFloatingInput");
    expect(formSource).not.toContain("contactFormShellClassName");
    expect(formSource).not.toContain("border border-[var(--color-divider)]");
    expect(formSource).toContain("supportContactButtonClassName");
    expect(formSource).toContain("arrowMaskStyle");
    expect(formSource).toContain("disabled={!isChanged}");
    expect(source).not.toContain("border border-[#ccc]");
    expect(source).not.toContain("inputText(");
  });

  // コード直接入力は住所を書き間違えるので、問い合わせと同じ選択式にする
  it("都道府県は問い合わせと同じセレクトで選ばせる", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("getContactFloatingSelectClassName");
    expect(source).toContain("contactSelectChevronClassName");
    expect(source).toContain("japanZones.map");
    expect(source).not.toContain('placeholder="JP-40"');
  });

  it("住所タブ内で編集・既定設定・削除でき、削除は確認を挟む", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");
    const controlsSource = readSource(
      "components/commerce/AccountAddressControls.tsx"
    );

    expect(source).toContain("AddressForm");
    expect(controlsSource).toContain('intent="default"');
    expect(controlsSource).toContain('intent="delete"');
    expect(controlsSource).toContain("この住所を削除しますか？");
    expect(controlsSource).toContain("accountAddressDeleteHref");
    expect(controlsSource).toContain("accountAddressAddHref");
    expect(controlsSource).not.toContain("accountAddressEditHref");
  });

  // 開け閉てするだけの操作でページを取り直すと、入力途中の内容が消える
  it("住所の追加フォームと削除確認はサーバーへ取りに行かず開閉する", () => {
    const controlsSource = readSource(
      "components/commerce/AccountAddressControls.tsx"
    );
    const contentSource = readSource("components/commerce/AccountPageContent.tsx");

    expect(controlsSource).toContain('"use client"');
    expect(controlsSource).toContain("useSearchParams");
    expect(controlsSource).toContain("AccountShallowLink");
    expect(controlsSource).toContain("accountAddressDeleteIdFromSearch");
    expect(controlsSource).toContain("accountAddressIdFromSearch");
    expect(contentSource).toContain("<AccountAddressHeader");
    expect(contentSource).toContain("<AccountAddressAdd>");
    expect(contentSource).not.toContain("confirmDelete");
  });

  it("プロフィールはここで直せる項目と、別画面で直す案内に分ける", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("ProfileNameForm");
    expect(source).toContain("EmailMarketingForm");
    expect(source).toContain('name="emailMarketing"');
    expect(source).toContain("isEmailMarketingSubscribed");
    expect(source).toContain("getShopifyCustomerProfileUrl");
    expect(source).toContain("accountMemberCopy.accountDetails.title");
    expect(source).toContain("accountMemberCopy.payments.title");
    expect(source).toContain("accountMemberCopy.payments.link");
    expect(source).not.toContain("このページで変更できない情報は");
    expect(source).not.toContain("label=\"アバター画像 URL\"");
  });

  it("全タブの項目に役割の注釈を出す", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("accountFieldNotes");
    expect(source).toContain("accountMemberCopy");
    expect(accountMemberCopy.accountDetails.login).toContain("パスワードはありません");
    expect(accountFieldNotes.address.name).toContain("宛名");
    expect(accountFieldNotes.order.lineItems).toContain("購入した商品");
    expect(accountFieldNotes.order.shippingAddress).toContain("注文時点");
  });

  it("本文幅をリーガルの max-width ではなく Home と同じ Container にする", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("import { Container }");
    expect(source).not.toContain("max-w-[860px]");
    expect(source).not.toContain("max-w-[620px]");
    expect(source).not.toContain("max-w-[980px]");
  });
});
