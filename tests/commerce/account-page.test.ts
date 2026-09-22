import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { accountFieldNotes, accountMemberCopy } from "@/lib/commerce/account-field-notes";
import {
  ACCOUNT_PAGE_TABS,
  accountAddressDeleteHref,
  accountAddressEditHref,
  accountAddressIdFromSearch,
  accountPageNotice,
  accountPageTabHref,
  accountOrderLineImageAlt,
  accountOrderLineTitle,
  accountOrderLineVariantTitle,
  accountOrderOptionalFields,
  accountOrderPaymentMethods,
  accountOrderShipmentDisplay,
  accountOrderSubtotalWithTax,
  formatAccountCardBrand,
  formatAccountAddressLine,
  formatAccountAddressName,
  formatAccountDate,
  formatAccountFinancialStatus,
  formatAccountMoney,
  formatAccountOrderPaymentStatus,
  formatAccountName,
  formatAccountOrderDateTime,
  formatAccountPostalCode,
  formatAccountPrefecture,
  formatAccountShipmentStatus,
  resolveAccountPageTabId,
  shopifyCustomerProfileUrlFromAccountUrl,
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

  it("注文履歴はサムネイルと商品名で出す", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("SiteImage");
    expect(source).toContain("accountOrderLineTitle");
    expect(source).toContain("購入商品");
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
    });
  });

  it("配送状況は発送後の最新ステータスを優先する", () => {
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
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "UNFULFILLED",
        fulfillments: { nodes: [] },
      })
    ).toBe("未発送");
    expect(
      accountOrderShipmentDisplay({
        fulfillmentStatus: "FULFILLED",
        fulfillments: {
          nodes: [
            {
              latestShipmentStatus: "CONFIRMED",
              updatedAt: "2026-03-15T10:00:00.000Z",
            },
            {
              latestShipmentStatus: "OUT_FOR_DELIVERY",
              updatedAt: "2026-03-16T10:00:00.000Z",
            },
          ],
        },
      })
    ).toBe("配達中");
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
    expect(source).toContain('label="商品の小計"');
    expect(source).toContain('label="配送料"');
    expect(source).toContain('label="ご請求額"');
    expect(source).not.toContain('label="税"');
    expect(source).toContain("accountOrderSubtotalWithTax");
    expect(source).toContain("formatAccountMoney");
    expect(source).toContain("発送情報");
    expect(source).toContain("追跡情報");
    expect(source).toContain("配送履歴");
    expect(source).toContain("領収書を見る");
    expect(source).toContain("決済方法");
    expect(source).toContain("accountOrderPaymentMethods");
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

  it("小計は税を足して税込にする", () => {
    expect(
      accountOrderSubtotalWithTax({
        subtotal: { amount: "10000", currencyCode: "JPY" },
        totalTax: { amount: "1000", currencyCode: "JPY" },
      })
    ).toEqual({ amount: "11000", currencyCode: "JPY" });
    expect(
      formatAccountMoney({ amount: "426230", currencyCode: "JPY" })
    ).toBe("￥426,230 税込");
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
      ])
    ).toEqual([
      expect.objectContaining({ id: "tx-bank", label: "銀行振込" }),
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
      "関連レコード",
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

  it("タブ切替は ?tab= のリンクでサーバー側に渡す", () => {
    const contentSource = readSource("components/commerce/AccountPageContent.tsx");
    const tabsSource = readSource("components/commerce/AccountTabs.tsx");
    const testPageSource = readSource("app/shopify-test/account/page.tsx");
    const publicPageSource = readSource("app/account/page.tsx");

    expect(testPageSource).toContain("searchParams={await searchParams}");
    expect(publicPageSource).toContain("searchParams={await searchParams}");
    expect(contentSource).toContain("activeTabId={activeTabId}");
    expect(tabsSource).toContain("accountPageTabHref");
    expect(tabsSource).toContain("justify-center");
    expect(tabsSource).toContain("scroll={false}");
    expect(tabsSource).not.toContain('"use client"');
    expect(contentSource).not.toContain("AccountTabPanel");
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

    expect(source).toContain("AddressForm");
    expect(source).toContain('intent="default"');
    expect(source).toContain('intent="delete"');
    expect(source).toContain("この住所を削除しますか？");
    expect(source).toContain("accountAddressDeleteHref");
    expect(source).toContain("accountAddressAddHref");
    expect(source).not.toContain("accountAddressEditHref");
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
    expect(accountFieldNotes.related.draftOrders).toContain("下書き");
  });

  it("本文幅をリーガルの max-width ではなく Home と同じ Container にする", () => {
    const source = readSource("components/commerce/AccountPageContent.tsx");

    expect(source).toContain("import { Container }");
    expect(source).not.toContain("max-w-[860px]");
    expect(source).not.toContain("max-w-[620px]");
    expect(source).not.toContain("max-w-[980px]");
  });
});
