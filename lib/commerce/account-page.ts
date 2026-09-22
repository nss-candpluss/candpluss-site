import { prefectureFromJapanZoneCode } from "@/lib/commerce/japan-zone-code";

/**
 * 閲覧と編集はタブを分けない。編集できる項目は入力済みのフォームとして出し、
 * 変更したときだけ更新ボタンを押せるようにする。
 */
export const ACCOUNT_PAGE_TABS = [
  { id: "orders", label: "注文履歴" },
  { id: "profile", label: "プロフィール" },
  { id: "addresses", label: "住所" },
  { id: "related-records", label: "関連レコード" },
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

  return payments.map((transaction) => {
    if (isBankTransferTransaction(transaction)) {
      return {
        id: transaction.id,
        label: "銀行振込",
        iconUrl: transaction.paymentIcon?.url,
        iconAlt: "銀行振込",
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
    };
  });
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
  AUTHORIZED: "与信済み",
  EXPIRED: "期限切れ",
  PAID: "お支払い済み",
  PARTIALLY_PAID: "一部入金",
  PARTIALLY_REFUNDED: "一部返金",
  PENDING: "お支払い待ち",
  REFUNDED: "返金済み",
  VOIDED: "無効",
};

const ACCOUNT_FULFILLMENT_STATUS_JA: Record<string, string> = {
  FULFILLED: "発送済み",
  IN_PROGRESS: "発送準備中",
  ON_HOLD: "保留",
  OPEN: "未発送",
  PARTIALLY_FULFILLED: "一部発送",
  PENDING_FULFILLMENT: "発送準備中",
  RESTOCKED: "在庫戻し",
  SCHEDULED: "発送予定",
  UNFULFILLED: "未発送",
};

const ACCOUNT_SHIPMENT_STATUS_JA: Record<string, string> = {
  ATTEMPTED_DELIVERY: "配達を試みました",
  CARRIER_PICKED_UP: "集荷済み",
  CONFIRMED: "配送確認済み",
  DELAYED: "遅延",
  DELIVERED: "配達済み",
  FAILURE: "配送失敗",
  IN_TRANSIT: "輸送中",
  LABEL_PRINTED: "伝票発行済み",
  LABEL_PURCHASED: "伝票購入済み",
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

function hasPositiveAmount(amount?: string | null) {
  return Number(amount ?? 0) > 0;
}

/** 小計は税別で来るので、税を足して税込にする */
export function accountOrderSubtotalWithTax(order: {
  subtotal?: { amount: string; currencyCode: string } | null;
  totalTax?: { amount: string; currencyCode: string } | null;
}) {
  const currencyCode =
    order.subtotal?.currencyCode ?? order.totalTax?.currencyCode;

  if (!currencyCode) {
    return null;
  }

  return {
    amount: String(
      Number(order.subtotal?.amount ?? 0) + Number(order.totalTax?.amount ?? 0)
    ),
    currencyCode,
  };
}

export function formatAccountMoney(
  money?: { amount: string; currencyCode: string } | null
) {
  if (!money) {
    return null;
  }

  const amount = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(money.amount));

  return `${amount} 税込`;
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

export function formatAccountFulfillmentStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_FULFILLMENT_STATUS_JA);
}

export function formatAccountShipmentStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_SHIPMENT_STATUS_JA);
}

export function formatAccountFulfillmentUnitStatus(value?: string | null) {
  return formatShopifyStatusLabel(value, ACCOUNT_FULFILLMENT_UNIT_STATUS_JA);
}

/** 発送後は配送会社の最新状況、それ以前は注文の発送状態 */
export function accountOrderShipmentDisplay(order: {
  fulfillmentStatus: string;
  fulfillments: {
    nodes: Array<{
      latestShipmentStatus?: string | null;
      updatedAt: string;
    }>;
  };
}) {
  const latestShipment = [...order.fulfillments.nodes]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .find((fulfillment) => fulfillment.latestShipmentStatus?.trim());

  return (
    formatAccountShipmentStatus(latestShipment?.latestShipmentStatus) ??
    formatAccountFulfillmentStatus(order.fulfillmentStatus)
  );
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

  return {
    showUpdatedAt: order.edited,
    showCancelledAt: isCancelled,
    showCancelReason: isCancelled && Boolean(order.cancelReason?.trim()),
    showEdited: order.edited,
    showNote: Boolean(order.note?.trim()),
    showRefunded: hasPositiveAmount(order.totalRefunded?.amount),
    showPoNumber: Boolean(order.poNumber?.trim()),
    showLocationName: Boolean(order.locationName?.trim()),
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

  if (key === "profile") {
    return "profile" satisfies AccountPageTabId;
  }

  if (key?.startsWith("address")) {
    return "addresses" satisfies AccountPageTabId;
  }

  return undefined;
}

export function accountPageTabIdFromHash(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return isAccountPageTabId(id) ? id : undefined;
}

export function queryStringFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>
) {
  const params = new URLSearchParams();

  if (!searchParams) {
    return "";
  }

  for (const [key, value] of Object.entries(searchParams)) {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (typeof normalized === "string" && normalized.length > 0) {
      params.set(key, normalized);
    }
  }

  return params.toString();
}

export function accountPageTabHref(tabId: AccountPageTabId, currentSearch = "") {
  const query = currentSearch.startsWith("?")
    ? currentSearch.slice(1)
    : currentSearch;
  const params = new URLSearchParams(query);
  params.delete("updated");
  params.delete("error");
  // 編集中の住所はタブを移ったら持ち越さない
  params.delete("address");
  params.delete("confirmDelete");
  params.set("tab", tabId);
  return `?${params.toString()}`;
}

/** 住所を新しく登録するときに `address` へ入れる値 */
export const NEW_ACCOUNT_ADDRESS = "new";

/** 住所タブの末尾に、空の追加フォームを出すリンク */
export function accountAddressAddHref() {
  return `?tab=addresses&address=${NEW_ACCOUNT_ADDRESS}`;
}

/**
 * 保存失敗時の戻り先。既存住所は一覧内のフォームへ、新規は追加フォームを開く。
 */
export function accountAddressEditHref(addressId?: string) {
  if (!addressId || addressId === NEW_ACCOUNT_ADDRESS) {
    return accountAddressAddHref();
  }

  return `?tab=addresses`;
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
    tab: "addresses",
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
