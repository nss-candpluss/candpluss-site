import { prefectureFromJapanZoneCode } from "@/lib/commerce/japan-zone-code";

/**
 * 閲覧と編集はタブを分けない。編集できる項目は入力済みのフォームとして出し、
 * 変更したときだけ更新ボタンを押せるようにする。
 */
export const ACCOUNT_PAGE_TABS = [
  { id: "orders", label: "ご注文履歴" },
  // プロフィールと住所は、どちらも会員自身の登録内容なので 1 つにまとめる
  { id: "account", label: "アカウント設定" },
] as const;

export type AccountPageTabId = (typeof ACCOUNT_PAGE_TABS)[number]["id"];

const ACCOUNT_PAGE_TAB_IDS = new Set<string>(
  ACCOUNT_PAGE_TABS.map((tab) => tab.id)
);

export function isAccountPageTabId(value: string): value is AccountPageTabId {
  return ACCOUNT_PAGE_TAB_IDS.has(value);
}

export type AccountOrderLineDisplay = {
  name: string;
  title?: string | null;
  variantTitle?: string | null;
  image?: { url: string; altText?: string | null } | null;
};

/** 通常商品は title、カスタム行など title が空なら注文行名 */
export function accountOrderLineTitle(line: AccountOrderLineDisplay) {
  return line.title?.trim() || line.name.trim();
}

/** Default Title と、商品名にすでに含まれるバリエーションは重ねない */
export function accountOrderLineVariantTitle(line: AccountOrderLineDisplay) {
  const variantTitle = line.variantTitle?.trim();

  if (!variantTitle || variantTitle === "Default Title") {
    return null;
  }

  if (accountOrderLineTitle(line).includes(variantTitle)) {
    return null;
  }

  return variantTitle;
}

export function accountOrderLineImageAlt(line: AccountOrderLineDisplay) {
  return line.image?.altText?.trim() || accountOrderLineTitle(line);
}

type AccountOrderLineAmount = {
  price?: { amount: string } | null;
  totalPrice?: { amount: string } | null;
};

function accountOrderLineAmount(line: AccountOrderLineAmount) {
  const amount = Number((line.totalPrice ?? line.price)?.amount ?? 0);

  return Number.isFinite(amount) ? amount : 0;
}

/**
 * 購入商品を金額の高い順に並べる。
 *
 * 画面に出しているのは行の合計額なので、並べ替えも同じ金額で揃える。
 * 同額の行は Shopify から返った順のままにする。
 */
export function accountOrderLinesByAmount<T extends AccountOrderLineAmount>(
  lines: readonly T[]
): T[] {
  return [...lines].sort(
    (a, b) => accountOrderLineAmount(b) - accountOrderLineAmount(a)
  );
}

/** 分割発送の見出し。左の購入商品と右の発送情報で同じ呼び方にする */
export function accountOrderParcelLabel(index: number, total: number) {
  return `全${total}個口の${index + 1}個口目`;
}

/** 購入商品 1 行分の表示単位。個口ごとに出すときは個数が注文行と変わる */
export type AccountOrderLineEntry<T> = { line: T; quantity: number };

type AccountOrderParcelLine = AccountOrderLineAmount & {
  id: string;
  quantity: number;
};

type AccountOrderParcelSource = {
  id: string;
  fulfillmentLineItems: {
    nodes: Array<{ quantity?: number | null; lineItem: { id: string } }>;
  };
};

function accountOrderEntryAmount<T extends AccountOrderLineAmount>(
  entry: AccountOrderLineEntry<T>
) {
  const unitPrice = Number(entry.line.price?.amount ?? 0);

  return Number.isFinite(unitPrice) ? unitPrice * entry.quantity : 0;
}

function accountOrderEntriesByAmount<T extends AccountOrderLineAmount>(
  entries: AccountOrderLineEntry<T>[]
) {
  return entries.sort(
    (a, b) => accountOrderEntryAmount(b) - accountOrderEntryAmount(a)
  );
}

/**
 * 注文を個口ごとに分ける。
 *
 * 1 つの注文行が複数の個口に分かれることがあるので、個数は注文行の数量では
 * なく、その個口に入っている数を使う。どの個口にも入っていない残りは
 * まだ発送されていない分として `pending` に回す。
 */
export function accountOrderParcels<T extends AccountOrderParcelLine>(
  lineItems: readonly T[],
  fulfillments: readonly AccountOrderParcelSource[]
) {
  const lineById = new Map(lineItems.map((line) => [line.id, line]));
  const shippedQuantity = new Map<string, number>();

  const parcels = fulfillments.map((fulfillment) => {
    const lines: AccountOrderLineEntry<T>[] = [];

    for (const item of fulfillment.fulfillmentLineItems.nodes) {
      const line = lineById.get(item.lineItem.id);
      const quantity = item.quantity ?? 0;

      if (!line || quantity <= 0) {
        continue;
      }

      shippedQuantity.set(
        line.id,
        (shippedQuantity.get(line.id) ?? 0) + quantity
      );
      lines.push({ line, quantity });
    }

    return { id: fulfillment.id, lines: accountOrderEntriesByAmount(lines) };
  });

  const pending = accountOrderEntriesByAmount(
    lineItems
      .map((line) => ({
        line,
        quantity: line.quantity - (shippedQuantity.get(line.id) ?? 0),
      }))
      .filter((entry) => entry.quantity > 0)
  );

  return { parcels, pending };
}

export function formatAccountPostalCode(value?: string | null) {
  const zip = value?.trim().replace(/^〒\s*/, "");

  return zip ? `〒${zip}` : null;
}

export function formatAccountPrefecture(address: {
  zoneCode?: string | null;
  province?: string | null;
}) {
  return (
    prefectureFromJapanZoneCode(address.zoneCode) ||
    address.province?.trim() ||
    null
  );
}

export function formatAccountAddressName(address: {
  name?: string | null;
  lastName?: string | null;
  firstName?: string | null;
}) {
  const lastName = address.lastName?.trim() ?? "";
  const firstName = address.firstName?.trim() ?? "";

  const name =
    lastName || firstName
      ? `${lastName}${firstName}`
      : address.name?.trim() || "";

  return name ? `${name} 様` : null;
}

const HIDDEN_PAYMENT_KINDS = new Set([
  "REFUND",
  "VOID",
  "SUGGESTED_REFUND",
  "CARD_DECLINE",
  "CHANGE",
]);

const CARD_BRAND_LABELS: Record<string, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  MASTER: "Mastercard",
  AMERICANEXPRESS: "AmericanExpress",
  AMEX: "AmericanExpress",
  JCB: "JapanCreditBureau",
  JAPANCREDITBUREAU: "JapanCreditBureau",
  DINERSCLUB: "DinersClub",
  DINERS: "DinersClub",
  DISCOVER: "Discover",
};

function brandKey(value?: string | null) {
  return value?.trim().toUpperCase().replace(/[\s_-]+/g, "") ?? "";
}

export function formatAccountCardBrand(value?: string | null) {
  const key = brandKey(value);

  if (!key) {
    return null;
  }

  return CARD_BRAND_LABELS[key] ?? value?.trim() ?? null;
}

function isBankTransferTransaction(transaction: {
  type: string;
  typeDetails?: { name?: string | null } | null;
}) {
  if (transaction.type === "BANK_DEPOSIT") {
    return true;
  }

  return /銀行|振込|bank\s*deposit|bank\s*transfer/i.test(
    transaction.typeDetails?.name ?? ""
  );
}

export type AccountPaymentMethodDisplay = {
  id: string;
  label: string;
  iconUrl?: string | null;
  iconAlt: string;
  /** カードは決済が済めば状況を書く必要がない。振込は入金の有無が気になる */
  isCard: boolean;
};

export function accountOrderPaymentMethods(
  transactions: Array<{
    id: string;
    type: string;
    kind?: string | null;
    status?: string | null;
    typeDetails?: { name?: string | null } | null;
    paymentDetails?: { cardBrand?: string | null; last4?: string | null } | null;
    paymentIcon?: { url: string; altText?: string | null } | null;
  }>
): AccountPaymentMethodDisplay[] {
  const visible = transactions.filter((transaction) => {
    if (HIDDEN_PAYMENT_KINDS.has(transaction.kind ?? "")) {
      return false;
    }

    return transaction.status !== "FAILURE" && transaction.status !== "ERROR";
  });

  const hasCaptured = visible.some(
    (transaction) => transaction.kind === "SALE" || transaction.kind === "CAPTURE"
  );
  const payments = hasCaptured
    ? visible.filter(
        (transaction) =>
          transaction.kind !== "AUTHORIZATION" &&
          transaction.kind !== "CARD_APPROVAL"
      )
    : visible;

  const methods = payments.map((transaction) => {
    if (isBankTransferTransaction(transaction)) {
      return {
        id: transaction.id,
        label: "銀行振込",
        iconUrl: transaction.paymentIcon?.url,
        iconAlt: "銀行振込",
        isCard: false,
      };
    }

    const brand = formatAccountCardBrand(transaction.paymentDetails?.cardBrand);
    const last4 = transaction.paymentDetails?.last4?.trim();

    if (brand && last4) {
      return {
        id: transaction.id,
        label: `${brand}••••${last4}`,
        iconUrl: transaction.paymentIcon?.url,
        iconAlt: brand,
        isCard: true,
      };
    }

    return {
      id: transaction.id,
      label:
        brand ||
        transaction.typeDetails?.name?.trim() ||
        transaction.type,
      iconUrl: transaction.paymentIcon?.url,
      iconAlt: brand || "決済方法",
      isCard: Boolean(brand),
    };
  });

  /*
    知りたいのは「何で払ったか」なので、同じ手段は 1 行にまとめる。
    銀行振込のような手動の決済では、受付時と入金確認時で取引が 2 件残り、
    同じ「銀行振込」が並んでしまう。
  */
  return methods.filter(
    (method, index) =>
      methods.findIndex((other) => other.label === method.label) === index
  );
}

export function formatAccountAddressLine(address: {
  zip?: string | null;
  zoneCode?: string | null;
  province?: string | null;
  city?: string | null;
  address1?: string | null;
  address2?: string | null;
}) {
  const line = [
    formatAccountPostalCode(address.zip),
    formatAccountPrefecture(address),
    address.city?.trim(),
    address.address1?.trim(),
    address.address2?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return line || null;
}

const ACCOUNT_FINANCIAL_STATUS_JA: Record<string, string> = {
  AUTHORIZED: "お支払い確定前",
  // 銀行振込の入金期限と読み違えられないよう、カードの話だと明示する
  EXPIRED: "カード決済の期限切れ",
  PAID: "お支払い済み",
  PARTIALLY_PAID: "一部入金",
  PARTIALLY_REFUNDED: "一部返金",
  PENDING: "お支払い待ち",
  REFUNDED: "返金済み",
  VOIDED: "お支払い取消",
};

/** 発送前は、発送情報の欄と同じ「発送準備中」で揃える */
const ACCOUNT_FULFILLMENT_STATUS_JA: Record<string, string> = {
  FULFILLED: "発送済み",
  IN_PROGRESS: "発送準備中",
  ON_HOLD: "発送保留中",
  OPEN: "発送準備中",
  PARTIALLY_FULFILLED: "一部発送",
  PENDING_FULFILLMENT: "発送準備中",
  RESTOCKED: "ご注文取消",
  SCHEDULED: "発送予定",
  UNFULFILLED: "発送準備中",
};

/**
 * 運送会社の配送状況。
 *
 * CONFIRMED / LABEL_PURCHASED / LABEL_PRINTED は、お客様から見れば
 * どれも「出荷情報は登録されたが、まだ集荷されていない」段階なので
 * 「発送手配済み」にまとめる。
 */
const ACCOUNT_SHIPMENT_STATUS_JA: Record<string, string> = {
  ATTEMPTED_DELIVERY: "ご不在でした",
  CARRIER_PICKED_UP: "集荷済み",
  CONFIRMED: "発送手配済み",
  DELAYED: "遅延",
  DELIVERED: "配達済み",
  FAILURE: "配送失敗",
  IN_TRANSIT: "輸送中",
  LABEL_PRINTED: "発送手配済み",
  LABEL_PURCHASED: "発送手配済み",
  OUT_FOR_DELIVERY: "配達中",
  PICKED_UP: "受け取り済み",
  READY_FOR_PICKUP: "受け取り準備完了",
};

const ACCOUNT_FULFILLMENT_UNIT_STATUS_JA: Record<string, string> = {
  CANCELLED: "発送キャンセル",
  ERROR: "発送エラー",
  FAILURE: "発送失敗",
  OPEN: "未処理",
  PENDING: "処理待ち",
  SUCCESS: "発送完了",
};

/**
 * Shopify が返す配送業者名。
 *
 * 日本の運送会社でも「Sagawa (JA)」のように英語表記で来るものがあるので、
 * 日本語に置き換える。西濃運輸などもとから日本語で来るものや、海外の
 * 運送会社はそのまま出す。
 * https://shopify.dev/docs/api/admin-rest/latest/resources/fulfillment
 */
const ACCOUNT_CARRIER_NAME_JA: Record<string, string> = {
  "japan post (en)": "日本郵便",
  "japan post (ja)": "日本郵便",
  other: "その他",
  "sagawa (en)": "佐川急便",
  "sagawa (ja)": "佐川急便",
  "yamato (en)": "ヤマト運輸",
  "yamato (ja)": "ヤマト運輸",
};

export function formatAccountCarrierName(value?: string | null) {
  const name = value?.trim();

  if (!name) {
    return null;
  }

  return ACCOUNT_CARRIER_NAME_JA[name.toLowerCase()] ?? name;
}

function hasPositiveAmount(amount?: string | null) {
  return Number(amount ?? 0) > 0;
}

/**
 * 金額だけを整形する。
 *
 * サマリーのように税を別の行で出す場所や、税込の注記を本体と違う大きさで
 * 並べたい場所で使う。
 */
export function formatAccountMoneyAmount(
  money?: { amount: string; currencyCode: string } | null
) {
  if (!money) {
    return null;
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(money.amount));
}

export function formatAccountMoney(
  money?: { amount: string; currencyCode: string } | null
) {
  const amount = formatAccountMoneyAmount(money);

  return amount === null ? null : `${amount} 税込`;
}

function formatShopifyStatusLabel(
  value: string | null | undefined,
  labels: Record<string, string>
) {
  const key = value?.trim();

  if (!key) {
    return null;
  }

  return labels[key.toUpperCase()] ?? key;
}

export function formatAccountFinancialStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_FINANCIAL_STATUS_JA);
}

/**
 * バッジの色分け。
 *
 * waiting は注文したままでまだ何も動いていない状態、active は動き出したが
 * まだ終わっていない状態、done は終わったもの、alert は確認や対応が要るもの。
 * Shopify のコードで判定するので、日本語を変えても色は変わらない。
 */
export type AccountStatusTone = "waiting" | "active" | "done" | "alert";

export type AccountStatusDisplay = { label: string; tone: AccountStatusTone };

/** 注文したときのまま動いていない状態 */
const ACCOUNT_WAITING_STATUSES = new Set([
  "IN_PROGRESS",
  "OPEN",
  "PENDING",
  "PENDING_FULFILLMENT",
  "UNFULFILLED",
]);

const ACCOUNT_DONE_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "PAID",
  "PICKED_UP",
]);

/**
 * 発送保留は在庫待ちなど運営都合のことも多いので、赤にはしない。
 * お客様に動いてほしい、または取引が成立しなかったものだけを赤にする。
 */
const ACCOUNT_ALERT_STATUSES = new Set([
  "ATTEMPTED_DELIVERY",
  "DELAYED",
  "EXPIRED",
  "FAILURE",
  "RESTOCKED",
  "VOIDED",
]);

function accountStatusTone(code?: string | null): AccountStatusTone {
  const key = code?.trim().toUpperCase();

  if (!key || ACCOUNT_WAITING_STATUSES.has(key)) {
    return "waiting";
  }

  if (ACCOUNT_DONE_STATUSES.has(key)) {
    return "done";
  }

  return ACCOUNT_ALERT_STATUSES.has(key) ? "alert" : "active";
}

/** 銀行振込で入金確認前は「ご入金確認中」。それ以外の PENDING は「お支払い待ち」 */
export function formatAccountOrderPaymentStatus(
  financialStatus?: string | null,
  transactions: Array<{
    type: string;
    typeDetails?: { name?: string | null } | null;
  }> = []
) {
  const status = financialStatus?.trim().toUpperCase();

  if (
    status === "PENDING" &&
    transactions.some((transaction) => isBankTransferTransaction(transaction))
  ) {
    return "ご入金確認中";
  }

  return formatAccountFinancialStatus(financialStatus);
}

export function accountOrderPaymentDisplay(
  financialStatus: string | null | undefined,
  transactions: Array<{
    type: string;
    typeDetails?: { name?: string | null } | null;
  }>
): AccountStatusDisplay | null {
  const label = formatAccountOrderPaymentStatus(financialStatus, transactions);

  return label ? { label, tone: accountStatusTone(financialStatus) } : null;
}

export function formatAccountFulfillmentStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_FULFILLMENT_STATUS_JA);
}

export function formatAccountShipmentStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_SHIPMENT_STATUS_JA);
}

export function formatAccountFulfillmentUnitStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_FULFILLMENT_UNIT_STATUS_JA);
}

/** キャンセル理由。誰の都合で取り消したのかが分かる言い方にする */
const ACCOUNT_CANCEL_REASON_JA: Record<string, string> = {
  CUSTOMER: "お客様のご希望",
  DECLINED: "決済が承認されなかったため",
  FRAUD: "確認が取れなかったため",
  INVENTORY: "在庫を確保できなかったため",
  OTHER: "その他の理由",
  STAFF: "当店の都合",
};

export function formatAccountCancelReason(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_CANCEL_REASON_JA);
}

/** 取り消された注文はこのバッジだけにして、発送状況は出さない */
export const ACCOUNT_CANCELLED_BADGE: AccountStatusDisplay = {
  label: "キャンセル済",
  tone: "alert",
};

/**
 * 領収書を出してよいか。
 *
 * 入金が済んでいない注文で領収書が出ると、支払いの証明として使われてしまう。
 * 代金を受け取った注文だけに絞る。一部返金は受け取った事実が残るので出す。
 */
export function accountOrderHasReceipt(order: {
  cancelledAt?: string | null;
  financialStatus?: string | null;
}) {
  if (order.cancelledAt) {
    return false;
  }

  const status = order.financialStatus?.trim().toUpperCase();

  return status === "PAID" || status === "PARTIALLY_REFUNDED";
}

/**
 * 注文カードの配送状況バッジ。
 *
 * 個口が分かれていて状況もばらばらのときに、どれか 1 つの個口を選んで出すと
 * 「配達済み」なのにまだ届いていない個口がある、という誤解になる。全部の
 * 個口が同じ状況のときだけ運送会社の状況を出し、それ以外は注文全体の
 * 発送状態（発送済み / 一部発送など）で伝える。
 */
export function accountOrderShipmentDisplay(order: {
  fulfillmentStatus: string;
  fulfillments: {
    nodes: Array<{ latestShipmentStatus?: string | null }>;
  };
}): AccountStatusDisplay | null {
  const shipmentStatuses = order.fulfillments.nodes.map((fulfillment) =>
    fulfillment.latestShipmentStatus?.trim().toUpperCase()
  );
  const sharedStatus = shipmentStatuses[0];
  const usesShipmentStatus =
    Boolean(sharedStatus) &&
    shipmentStatuses.every((status) => status === sharedStatus);

  const code = usesShipmentStatus ? sharedStatus! : order.fulfillmentStatus;
  const label = usesShipmentStatus
    ? formatAccountShipmentStatus(code)
    : formatAccountFulfillmentStatus(code);

  return label ? { label, tone: accountStatusTone(code) } : null;
}

export type AccountOrderOptionalFields = {
  showUpdatedAt: boolean;
  showCancelledAt: boolean;
  showCancelReason: boolean;
  showEdited: boolean;
  showNote: boolean;
  showRefunded: boolean;
  showPoNumber: boolean;
  showLocationName: boolean;
  /** どれか 1 つでも出るか。1 つも無ければ区画ごと出さない */
  showAnyDetail: boolean;
};

/** 通常は隠して、該当する状況のときだけ出す注文項目 */
export function accountOrderOptionalFields(order: {
  edited: boolean;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  note?: string | null;
  poNumber?: string | null;
  locationName?: string | null;
  totalRefunded?: { amount: string } | null;
}): AccountOrderOptionalFields {
  const isCancelled = Boolean(order.cancelledAt);
  const fields = {
    showUpdatedAt: order.edited,
    showCancelledAt: isCancelled,
    showCancelReason: isCancelled && Boolean(order.cancelReason?.trim()),
    showEdited: order.edited,
    showNote: Boolean(order.note?.trim()),
    showRefunded: hasPositiveAmount(order.totalRefunded?.amount),
    showPoNumber: Boolean(order.poNumber?.trim()),
    showLocationName: Boolean(order.locationName?.trim()),
  };

  return {
    ...fields,
    // 返金額はサマリーに出すので、この区画の有無には関係しない
    showAnyDetail: Object.entries(fields).some(
      ([key, shown]) => key !== "showRefunded" && shown
    ),
  };
}

/** 姓・名があれば日本語順でつなぎ、なければ Shopify の表示名を使う */
export function formatAccountName(profile: {
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const lastName = profile.lastName?.trim() ?? "";
  const firstName = profile.firstName?.trim() ?? "";
  const fullName = [lastName, firstName].filter(Boolean).join(" ");

  return fullName || profile.displayName.trim();
}

/** 注文カード見出し用。2026/09/20 20:28 */
export function formatAccountOrderDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${valueOf("year")}/${valueOf("month")}/${valueOf("day")} ${valueOf("hour")}:${valueOf("minute")}`;
}

/** タイトル下に出す年月日。時刻は含めない */
export function formatAccountDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Shopify 標準の会員プロフィール。
 * メールアドレスなど、このサイトの会員ページから変えられない項目はこちら。
 *
 * 店舗ドメインへ `/profile` を足すと 404 になる。認証用 URL か、
 * 会員専用サブドメイン（`account.`）だけをプロフィール画面に変える。
 */
export function shopifyCustomerProfileUrlFromAccountUrl(accountUrl: string) {
  try {
    const url = new URL(accountUrl);
    const authenticationMatch = url.pathname.match(/\/authentication\/([^/]+)/);

    if (authenticationMatch) {
      return `https://shopify.com/${authenticationMatch[1]}/account/profile`;
    }

    const shopifyAccountMatch = url.pathname.match(
      /^\/(\d+)\/account(?:\/profile)?\/?$/
    );
    if (url.hostname === "shopify.com" && shopifyAccountMatch) {
      return `https://shopify.com/${shopifyAccountMatch[1]}/account/profile`;
    }

    if (url.hostname.startsWith("account.")) {
      return `${url.origin}/profile`;
    }

    return null;
  } catch {
    return null;
  }
}

export function accountPageTabIdFromSearch(search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const tab = params.get("tab");

  if (tab && isAccountPageTabId(tab)) {
    return tab;
  }

  // 更新後のリダイレクトで tab が付いていないときの受け皿
  const key = params.get("updated") ?? params.get("error");

  if (key === "profile" || key?.startsWith("address")) {
    return "account" satisfies AccountPageTabId;
  }

  return undefined;
}

export function accountPageTabIdFromHash(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return isAccountPageTabId(id) ? id : undefined;
}

export function accountPageTabHref(tabId: AccountPageTabId, currentSearch = "") {
  const query = currentSearch.startsWith("?")
    ? currentSearch.slice(1)
    : currentSearch;
  const params = new URLSearchParams(query);
  params.delete("updated");
  params.delete("saved");
  params.delete("savedAt");
  params.delete("error");
  // 編集中の住所はタブを移ったら持ち越さない
  params.delete("address");
  params.delete("confirmDelete");
  params.set("tab", tabId);
  return `?${params.toString()}`;
}

/**
 * 保存できたことは、ページの先頭にまとめて出すのではなく、
 * 押したフォームのその場に短く出す。
 */
export const ACCOUNT_SAVED_NOTICE = "変更が保存されました。";

/** 読み終わる頃には消したい。残り続けると、今の操作の結果か分からなくなる */
export const ACCOUNT_SAVED_NOTICE_MS = 4000;

/** 何が起きたか分からないまま終わらせないための、最後の受け皿 */
export const ACCOUNT_SAVE_FAILED_NOTICE = "保存できませんでした。";

/** セッションが切れていたら、保存できない理由をその場で伝える */
export const ACCOUNT_SESSION_EXPIRED_NOTICE =
  "ログインの有効期限が切れました。お手数ですが、もう一度ログインしてください。";

/** どのフォームの保存だったかを URL から取り出す */
export function accountSavedNoticeKey(search = "") {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("saved") ?? undefined;
}

/**
 * 保存後の戻り先に、どのフォームだったかと保存した時刻を付ける。
 *
 * 時刻を入れて毎回違う URL にする。2 回続けて同じ項目を保存すると
 * 戻り先が前回とまったく同じ URL になり、ブラウザが前の描画を使い回して
 * 保存前の値が残ることがある。
 */
export function applyAccountSavedParams(url: URL, noticeKey: string) {
  url.searchParams.set("saved", noticeKey);
  url.searchParams.set("savedAt", String(Date.now()));
}

/** 保存できた合図のクエリ。出し終えたら URL から外す */
export const ACCOUNT_SAVED_NOTICE_PARAMS = ["saved", "savedAt"] as const;

/** 一覧側の操作（既定の変更・削除）の合図のクエリ */
export const ACCOUNT_UPDATED_NOTICE_PARAMS = ["updated"] as const;

/**
 * 知らせのクエリを落とした「?…」を返す。落とすものが無ければ空文字。
 *
 * 合図を URL に残すと、リロードするたびに同じ知らせが出てしまう。
 * 一度出したら URL からも消す。
 */
export function accountSearchWithoutNoticeKeys(
  search: string,
  keys: readonly string[]
) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);

  for (const key of keys) {
    params.delete(key);
  }

  const next = params.toString();
  return next ? `?${next}` : "";
}

/** 住所フォームは件数分あるので、どの住所を保存したかで見分ける */
export function accountAddressNoticeKey(addressId?: string) {
  return `address-${addressId ?? NEW_ACCOUNT_ADDRESS}`;
}

/** 全角を半角に寄せて、数字と先頭の + だけ残す */
function normalizePhoneDigits(value?: string | null) {
  return (value ?? "")
    .replace(/[０-９＋]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    .replace(/[^\d+]/g, "");
}

/**
 * Shopify は電話番号を E.164（+819012345678）でしか受け取らない。
 * お客様は 090-1234-5678 のように書くので、保存前に国番号を足す。
 * すでに + で始まっていれば国外の番号として、そのまま送る。
 */
export function toShopifyJapanPhoneNumber(value?: string | null) {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.startsWith("+")) {
    return digits;
  }

  return digits.startsWith("0") ? `+81${digits.slice(1)}` : `+81${digits}`;
}

/** 入力欄に戻すときは、読み慣れた国内表記にする */
export function formatJapanPhoneNumberInput(value?: string | null) {
  const digits = normalizePhoneDigits(value);

  return digits.startsWith("+81") ? `0${digits.slice(3)}` : digits;
}

/** 住所を新しく登録するときに `address` へ入れる値 */
export const NEW_ACCOUNT_ADDRESS = "new";

/** 住所一覧の末尾に、空の追加フォームを出すリンク */
export function accountAddressAddHref() {
  return `?tab=account&address=${NEW_ACCOUNT_ADDRESS}`;
}

/**
 * 保存失敗時の戻り先。既存住所は一覧内のフォームへ、新規は追加フォームを開く。
 */
export function accountAddressEditHref(addressId?: string) {
  if (!addressId || addressId === NEW_ACCOUNT_ADDRESS) {
    return accountAddressAddHref();
  }

  return `?tab=account`;
}

export function accountAddressIdFromSearch(search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("address") ?? undefined;
}

/**
 * 削除は取り消せないので、一覧の中で 1 度確認を挟む。
 * JavaScript の確認ダイアログではなく、URL で確認中の住所を持つ。
 */
export function accountAddressDeleteHref(addressId: string) {
  const params = new URLSearchParams({
    tab: "account",
    confirmDelete: addressId,
  });
  return `?${params.toString()}`;
}

export function accountAddressDeleteIdFromSearch(search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("confirmDelete") ?? undefined;
}

const ACCOUNT_PAGE_NOTICES = {
  profile: "プロフィールを更新しました。",
  address: "住所を保存しました。",
  "address-default": "既定の住所を変更しました。",
  "address-deleted": "住所を削除しました。",
} as const;

const ACCOUNT_PAGE_ERRORS = {
  profile: "プロフィールを更新できませんでした。",
  address: "住所を保存できませんでした。",
  "address-default": "既定の住所を変更できませんでした。",
  "address-deleted": "住所を削除できませんでした。",
} as const;

export type AccountPageNotice = {
  tone: "success" | "error";
  message: string;
};

/** 失敗した操作の 1 行。ページを読み直さない保存では、これをその場に出す */
export function accountPageErrorMessage(key: string) {
  return (
    ACCOUNT_PAGE_ERRORS[key as keyof typeof ACCOUNT_PAGE_ERRORS] ??
    ACCOUNT_SAVE_FAILED_NOTICE
  );
}

/** 更新後のリダイレクトに付くクエリを、画面に出す 1 行に変える */
export function accountPageNotice(search = ""): AccountPageNotice | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const updated = params.get("updated");
  const failed = params.get("error");

  if (updated && updated in ACCOUNT_PAGE_NOTICES) {
    return {
      tone: "success",
      message:
        ACCOUNT_PAGE_NOTICES[updated as keyof typeof ACCOUNT_PAGE_NOTICES],
    };
  }

  if (failed && failed in ACCOUNT_PAGE_ERRORS) {
    return {
      tone: "error",
      message: ACCOUNT_PAGE_ERRORS[failed as keyof typeof ACCOUNT_PAGE_ERRORS],
    };
  }

  return null;
}

/** 更新リダイレクトのクエリを優先し、なければ tab / ハッシュ、最後に注文履歴 */
export function resolveAccountPageTabId({
  search = "",
  hash = "",
}: {
  search?: string;
  hash?: string;
} = {}): AccountPageTabId {
  return (
    accountPageTabIdFromSearch(search) ??
    accountPageTabIdFromHash(hash) ??
    "orders"
  );
}

export type AccountShallowClick = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/**
 * クエリだけを書き換えるリンクを、自前で処理してよいクリックか判定する。
 *
 * 新しいタブで開く操作や中クリックまで奪うと、リンクとして壊れる。
 */
export function shouldHandleAccountShallowClick(
  event: AccountShallowClick
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}
