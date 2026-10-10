import "server-only";

import { z } from "zod";

import { resolveCustomerAccountCallbackUrl } from "@/lib/commerce/account-login";
import {
  accountOrderIsTruncated,
  accountOrderWithoutCancelledFulfillments,
  shopifyCustomerProfileUrlFromAccountUrl,
} from "@/lib/commerce/account-page";

const customerAccountConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().optional(),
  accountUrl: z.string().url(),
  callbackUrl: z.string().url(),
});

type CustomerAccountConfig = z.infer<typeof customerAccountConfigSchema>;

type OpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

type CustomerApiConfiguration = {
  graphql_api: string;
};

export type CustomerTokenSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

export type CustomerMoney = { amount: string; currencyCode: string };

export type CustomerAddressDetail = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  zip?: string | null;
  country?: string | null;
  territoryCode?: string | null;
  province?: string | null;
  zoneCode?: string | null;
  city?: string | null;
  address1?: string | null;
  address2?: string | null;
  phoneNumber?: string | null;
  formattedArea?: string | null;
  formatted: string[];
};

export type CustomerAccount = {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl: string;
  creationDate: string;
  tags: string[];
  emailAddress?: {
    emailAddress?: string | null;
    marketingState: string;
  } | null;
  phoneNumber?: { phoneNumber: string } | null;
  defaultAddress?: CustomerAddressDetail | null;
  addresses: { nodes: CustomerAddressDetail[] };
};

export type CustomerFulfillmentDetail = {
  id: string;
  status?: string | null;
  latestShipmentStatus?: string | null;
  estimatedDeliveryAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isPickedUp: boolean;
  requiresShipping: boolean;
  trackingInformation: Array<{
    company?: string | null;
    number?: string | null;
    url?: string | null;
  }>;
  /** この小口に入っている注文行と、その個数 */
  fulfillmentLineItems: {
    nodes: Array<{
      id: string;
      quantity?: number | null;
      lineItem: { id: string };
    }>;
    pageInfo?: CustomerConnectionPageInfo;
  };
  events: { nodes: Array<{ id: string; status: string; happenedAt: string }> };
};

export type CustomerOrderTransaction = {
  id: string;
  type: string;
  kind?: string | null;
  status?: string | null;
  transactionAmount?: { presentmentMoney?: CustomerMoney | null } | null;
  typeDetails?: { name?: string | null; message?: string | null } | null;
  paymentDetails?: { cardBrand?: string | null; last4?: string | null } | null;
  paymentIcon?: { url: string; altText?: string | null } | null;
};

export type CustomerOrderDetail = {
  id: string;
  name: string;
  number: number;
  confirmationNumber?: string | null;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  edited: boolean;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  poNumber?: string | null;
  customerLocale?: string | null;
  locationName?: string | null;
  currencyCode: string;
  financialStatus?: string | null;
  fulfillmentStatus: string;
  requiresShipping: boolean;
  subtotal?: CustomerMoney | null;
  totalTax?: CustomerMoney | null;
  totalShipping: CustomerMoney;
  totalRefunded: CustomerMoney;
  totalPrice: CustomerMoney;
  shippingAddress?: CustomerAddressDetail | null;
  billingAddress?: CustomerAddressDetail | null;
  transactions: CustomerOrderTransaction[];
  fulfillments: {
    nodes: CustomerFulfillmentDetail[];
    pageInfo?: CustomerConnectionPageInfo;
  };
  lineItems: {
    pageInfo?: CustomerConnectionPageInfo;
    nodes: Array<{
      id: string;
      name: string;
      title: string;
      variantTitle?: string | null;
      sku?: string | null;
      vendor?: string | null;
      productType?: string | null;
      quantity: number;
      refundableQuantity: number;
      requiresShipping: boolean;
      giftCard: boolean;
      price?: CustomerMoney | null;
      totalPrice?: CustomerMoney | null;
      totalDiscount: CustomerMoney;
      image?: { url: string; altText?: string | null } | null;
    }>;
  };
};

/** 取れなかった理由も画面に出したいので、失敗を投げずに持ち回る */
export type CustomerSection<T> = { data: T | null; error: string | null };

/** 一覧の取得で打ち切った続きがあるかどうか */
export type CustomerConnectionPageInfo = { hasNextPage: boolean };

export type CustomerOrderHistory = {
  nodes: CustomerOrderDetail[];
  hasNextPage: boolean;
  /** 2 ページ目以降の取得に失敗したとき。読めた分はそのまま出す */
  moreError: string | null;
};

export type CustomerAccountSnapshot = {
  profile: CustomerAccount;
  orders: CustomerSection<CustomerOrderHistory>;
};

const ADDRESS_FIELDS = `
  id
  name
  firstName
  lastName
  company
  zip
  country
  territoryCode
  province
  zoneCode
  city
  address1
  address2
  phoneNumber
  formattedArea
  formatted
`;

function getCustomerAccountConfig(): CustomerAccountConfig {
  const accountUrl =
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL ??
    (process.env.SHOPIFY_STORE_DOMAIN
      ? `https://${process.env.SHOPIFY_STORE_DOMAIN}`
      : undefined);
  const parsed = customerAccountConfigSchema.safeParse({
    clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
    clientSecret:
      process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET || undefined,
    accountUrl,
    callbackUrl: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL,
  });

  if (!parsed.success) {
    throw new Error("Shopify Customer Account API is not configured.");
  }

  return {
    ...parsed.data,
    accountUrl: parsed.data.accountUrl.replace(/\/$/, ""),
  };
}

export function customerAccountCallbackUrlForRequest(request: Request) {
  return resolveCustomerAccountCallbackUrl(
    getCustomerAccountConfig().callbackUrl,
    request.url,
    request.headers
  );
}

async function discoverCustomerAccount() {
  const config = getCustomerAccountConfig();
  const [openidResponse, apiResponse] = await Promise.all([
    fetch(`${config.accountUrl}/.well-known/openid-configuration`, {
      cache: "no-store",
    }),
    fetch(`${config.accountUrl}/.well-known/customer-account-api`, {
      cache: "no-store",
    }),
  ]);

  if (!openidResponse.ok || !apiResponse.ok) {
    throw new Error("Shopify Customer Account discovery failed.");
  }

  return {
    config,
    openid: (await openidResponse.json()) as OpenIdConfiguration,
    api: (await apiResponse.json()) as CustomerApiConfiguration,
  };
}

export async function createCustomerAuthorizationUrl({
  state,
  codeChallenge,
  returnTo,
  loginHint,
  locale,
  callbackUrl,
}: {
  state: string;
  codeChallenge: string;
  returnTo?: string;
  loginHint?: string;
  locale?: string;
  callbackUrl: string;
}) {
  const { config, openid } = await discoverCustomerAccount();
  const url = new URL(openid.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "openid email customer-account-api:full");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (returnTo) {
    url.searchParams.set("return_to", returnTo);
  }

  if (loginHint) {
    url.searchParams.set("login_hint", loginHint);
  }

  if (locale) {
    url.searchParams.set("locale", locale);
  }

  return url;
}

async function requestToken(parameters: URLSearchParams) {
  const { config, openid } = await discoverCustomerAccount();
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  parameters.set("client_id", config.clientId);
  if (config.clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(
      `${config.clientId}:${config.clientSecret}`
    ).toString("base64")}`;
  }

  const response = await fetch(openid.token_endpoint, {
    method: "POST",
    headers,
    body: parameters,
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || "Customer token exchange failed."
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    idToken: payload.id_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  } satisfies CustomerTokenSession;
}

export function exchangeCustomerAuthorizationCode(
  code: string,
  codeVerifier: string,
  callbackUrl: string
) {
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    })
  );
}

export function refreshCustomerToken(refreshToken: string) {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

export async function fetchCustomerAccount(accessToken: string) {
  const data = await customerAccountRequest<{ customer?: CustomerAccount | null }>(
    accessToken,
    `query CustomerAccount {
      customer {
        id
        displayName
        firstName
        lastName
        imageUrl
        creationDate
        tags
        emailAddress { emailAddress marketingState }
        phoneNumber { phoneNumber }
        defaultAddress { ${ADDRESS_FIELDS} }
        addresses(first: 20) { nodes { ${ADDRESS_FIELDS} } }
      }
    }`
  );

  if (!data.customer) {
    throw new Error("Customer account request failed.");
  }

  return data.customer;
}

export type CustomerReceiptOrder = {
  id: string;
  name: string;
  processedAt: string;
  currencyCode: string;
  financialStatus?: string | null;
  subtotal?: CustomerMoney | null;
  totalTax?: CustomerMoney | null;
  totalShipping: CustomerMoney;
  totalRefunded: CustomerMoney;
  totalPrice: CustomerMoney;
  billingAddress?: CustomerAddressDetail | null;
  paymentInformation?: {
    paymentStatus?: string | null;
    totalPaidAmount: CustomerMoney;
  } | null;
  lineItems: {
    nodes: Array<{
      id: string;
      name: string;
      variantTitle?: string | null;
      quantity: number;
      price?: CustomerMoney | null;
      totalPrice?: CustomerMoney | null;
      totalDiscount: CustomerMoney;
    }>;
  };
};

/**
 * 領収書に使う 1 件分の注文。
 *
 * Customer Account API のトークンはログイン中の顧客に紐づくため、ID を
 * 指定しても他人の注文は返らない。
 */
export async function fetchCustomerOrder(accessToken: string, orderId: string) {
  const data = await customerAccountRequest<{
    order?: CustomerReceiptOrder | null;
  }>(
    accessToken,
    `query CustomerReceiptOrder($id: ID!) {
      order(id: $id) {
        id
        name
        processedAt
        currencyCode
        financialStatus
        subtotal { amount currencyCode }
        totalTax { amount currencyCode }
        totalShipping { amount currencyCode }
        totalRefunded { amount currencyCode }
        totalPrice { amount currencyCode }
        billingAddress { ${ADDRESS_FIELDS} }
        paymentInformation {
          paymentStatus
          totalPaidAmount { amount currencyCode }
        }
        lineItems(first: 100) {
          nodes {
            id
            name
            variantTitle
            quantity
            price { amount currencyCode }
            totalPrice { amount currencyCode }
            totalDiscount { amount currencyCode }
          }
        }
      }
    }`,
    { id: orderId }
  );

  return data.order ?? null;
}

function sectionError(cause: unknown): string {
  return cause instanceof Error ? cause.message : "取得に失敗しました。";
}

async function loadSection<T>(load: () => Promise<T>): Promise<CustomerSection<T>> {
  try {
    return { data: await load(), error: null };
  } catch (cause) {
    return { data: null, error: sectionError(cause) };
  }
}

/** 注文履歴を 1 回に読む件数。「さらに表示」を押すたびに、この件数ずつ増える */
export const CUSTOMER_ORDERS_PAGE_SIZE = 20;

/**
 * 1 回の表示で読み進められるページ数の上限。
 * ページごとに取得を重ねるので、URL を書き換えて際限なく読ませない。
 */
export const CUSTOMER_ORDER_PAGES_MAX = 10;

type CustomerOrderLimits = {
  fulfillments: number;
  fulfillmentLineItems: number;
  lineItems: number;
};

/**
 * 一覧で読む件数。Customer Account API はクエリ全体のコストに上限があり、
 * 注文ごとの件数がページの件数分掛け合わさるので、一覧では大きくしない。
 */
const ORDER_LIST_LIMITS: CustomerOrderLimits = {
  fulfillments: 10,
  fulfillmentLineItems: 20,
  lineItems: 20,
};

/** 一覧で読み切れなかった注文だけ、1 件ずつこの件数で読み直す */
const ORDER_FULL_LIMITS: CustomerOrderLimits = {
  fulfillments: 20,
  fulfillmentLineItems: 50,
  lineItems: 100,
};

function customerOrderFields(limits: CustomerOrderLimits) {
  return `
                  id
                  name
                  number
                  confirmationNumber
                  processedAt
                  createdAt
                  updatedAt
                  cancelledAt
                  cancelReason
                  edited
                  email
                  phone
                  note
                  poNumber
                  customerLocale
                  locationName
                  currencyCode
                  financialStatus
                  fulfillmentStatus
                  requiresShipping
                  subtotal { amount currencyCode }
                  totalTax { amount currencyCode }
                  totalShipping { amount currencyCode }
                  totalRefunded { amount currencyCode }
                  totalPrice { amount currencyCode }
                  shippingAddress { ${ADDRESS_FIELDS} }
                  billingAddress { ${ADDRESS_FIELDS} }
                  transactions {
                    id
                    type
                    kind
                    status
                    transactionAmount { presentmentMoney { amount currencyCode } }
                    typeDetails { name message }
                    paymentDetails {
                      ... on CardPaymentDetails {
                        cardBrand
                        last4
                      }
                    }
                    paymentIcon { url altText }
                  }
                  fulfillments(first: ${limits.fulfillments}) {
                    pageInfo { hasNextPage }
                    nodes {
                      id
                      status
                      latestShipmentStatus
                      estimatedDeliveryAt
                      createdAt
                      updatedAt
                      isPickedUp
                      requiresShipping
                      trackingInformation { company number url }
                      fulfillmentLineItems(first: ${limits.fulfillmentLineItems}) {
                        pageInfo { hasNextPage }
                        nodes {
                          id
                          quantity
                          lineItem { id }
                        }
                      }
                      events(first: 20, reverse: true) {
                        nodes { id status happenedAt }
                      }
                    }
                  }
                  lineItems(first: ${limits.lineItems}) {
                    pageInfo { hasNextPage }
                    nodes {
                      id
                      name
                      title
                      variantTitle
                      sku
                      vendor
                      productType
                      quantity
                      refundableQuantity
                      requiresShipping
                      giftCard
                      price { amount currencyCode }
                      totalPrice { amount currencyCode }
                      totalDiscount { amount currencyCode }
                      image { url altText }
                    }
                  }`;
}

async function fetchCustomerOrdersPage(
  accessToken: string,
  after: string | null
) {
  const data = await customerAccountRequest<{
    customer?: {
      orders: {
        nodes: CustomerOrderDetail[];
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
      };
    } | null;
  }>(
    accessToken,
    `query CustomerOrders($first: Int!, $after: String) {
      customer {
        orders(first: $first, after: $after, reverse: true) {
          pageInfo { hasNextPage endCursor }
          nodes { ${customerOrderFields(ORDER_LIST_LIMITS)} }
        }
      }
    }`,
    { first: CUSTOMER_ORDERS_PAGE_SIZE, after }
  );

  return (
    data.customer?.orders ?? { nodes: [], pageInfo: { hasNextPage: false } }
  );
}

/**
 * 一覧の件数に収まらなかった注文を読み直す。
 * 読み直しに失敗しても、注文履歴ごと出せなくなるよりは読めた分を出す。
 */
async function fetchFullCustomerOrder(
  accessToken: string,
  order: CustomerOrderDetail
) {
  try {
    const data = await customerAccountRequest<{
      order?: CustomerOrderDetail | null;
    }>(
      accessToken,
      `query CustomerOrderFull($id: ID!) {
        order(id: $id) { ${customerOrderFields(ORDER_FULL_LIMITS)} }
      }`,
      { id: order.id }
    );

    return data.order ?? order;
  } catch {
    return order;
  }
}

/**
 * 新しい順に `pages` ページ分の注文を読む。
 *
 * 1 回の取得量を増やすとコストの上限に当たるので、件数を増やすのではなく
 * 同じ量の取得をページ数だけ重ねる。
 */
async function fetchCustomerOrders(
  accessToken: string,
  pages: number
): Promise<CustomerOrderHistory> {
  const nodes: CustomerOrderDetail[] = [];
  let after: string | null = null;
  let hasNextPage = false;
  let moreError: string | null = null;

  for (let page = 0; page < pages; page += 1) {
    let result: Awaited<ReturnType<typeof fetchCustomerOrdersPage>>;

    try {
      result = await fetchCustomerOrdersPage(accessToken, after);
    } catch (cause) {
      if (page === 0) {
        throw cause;
      }
      moreError = sectionError(cause);
      break;
    }

    nodes.push(...result.nodes);
    after = result.pageInfo.endCursor ?? null;
    hasNextPage = result.pageInfo.hasNextPage && after !== null;

    if (!hasNextPage) {
      break;
    }
  }

  // 取得が重ならないよう 1 件ずつ。読み切れない注文はめったにない
  const completed: CustomerOrderDetail[] = [];
  for (const order of nodes) {
    completed.push(
      accountOrderIsTruncated(order)
        ? await fetchFullCustomerOrder(accessToken, order)
        : order
    );
  }

  return {
    nodes: completed.map(accountOrderWithoutCancelledFulfillments),
    hasNextPage,
    moreError,
  };
}

/**
 * 会員画面に出す情報をまとめて集める。
 *
 * 注文はプロフィールと別のアクセススコープに依存するので、片方が失敗しても
 * 道連れにならないようクエリを分ける。
 *
 * ストアクレジットは Headless の顧客トークンでは許可されないため扱わない。
 */
export async function fetchCustomerAccountSnapshot(
  accessToken: string,
  { orderPages = 1 }: { orderPages?: number } = {}
): Promise<CustomerAccountSnapshot> {
  const [profile, orders] = await Promise.all([
    fetchCustomerAccount(accessToken),
    loadSection(() => fetchCustomerOrders(accessToken, orderPages)),
  ]);

  return { profile, orders };
}

async function customerAccountRequest<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
) {
  const { api } = await discoverCustomerAccount();
  const response = await fetch(api.graphql_api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(
      payload.errors?.map((error) => error.message).join("; ") ||
        "Customer account request failed."
    );
  }

  return payload.data;
}

function assertCustomerMutation<T extends { userErrors: Array<{ message: string }> }>(
  payload: T
) {
  if (payload.userErrors.length) {
    throw new Error(payload.userErrors.map((error) => error.message).join("; "));
  }
  return payload;
}

/**
 * 書き込みが読み出しに現れるまでの待ち時間。
 * 合計 1 秒ほど。保存ボタンを押した直後の待ちなので、これ以上は長くしない。
 */
const CUSTOMER_UPDATE_RETRY_MS = [150, 300, 600];

/**
 * 保存した内容が読み出せるようになるまで、短い間だけ読み直す。
 *
 * Shopify は書き込んだ直後の読み出しで前の値を返すことがある。
 * そのまま画面へ戻すと、保存できたのに古い値が出てしまう。
 * 待ちきれなかったときは最後に読めた内容をそのまま返す。
 */
export async function readAfterCustomerUpdate<T>(
  read: () => Promise<T>,
  isApplied: (value: T) => boolean
): Promise<T> {
  let latest = await read();

  for (const waitMs of CUSTOMER_UPDATE_RETRY_MS) {
    if (isApplied(latest)) {
      return latest;
    }

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    latest = await read();
  }

  return latest;
}

export async function updateCustomerProfile(
  accessToken: string,
  input: { firstName?: string; lastName?: string }
) {
  const data = await customerAccountRequest<{
    customerUpdate: {
      customer?: { id: string; firstName?: string; lastName?: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    accessToken,
    `mutation CustomerUpdate($input: CustomerUpdateInput!) {
      customerUpdate(input: $input) {
        customer { id firstName lastName }
        userErrors { field message }
      }
    }`,
    { input }
  );

  return assertCustomerMutation(data.customerUpdate).customer;
}

export async function saveCustomerAddress(
  accessToken: string,
  {
    addressId,
    address,
    defaultAddress = false,
  }: {
    addressId?: string;
    /** null は「この項目を空にする」の意味で送る */
    address: Record<string, string | null | undefined>;
    /** 既定にするかは呼び出し側で決める。既定の住所を勝手に移さない */
    defaultAddress?: boolean;
  }
) {
  if (addressId) {
    const data = await customerAccountRequest<{
      customerAddressUpdate: {
        customerAddress?: { id: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(
      accessToken,
      `mutation CustomerAddressUpdate(
        $addressId: ID!
        $address: CustomerAddressInput
        $defaultAddress: Boolean
      ) {
        customerAddressUpdate(
          addressId: $addressId
          address: $address
          defaultAddress: $defaultAddress
        ) {
          customerAddress { id }
          userErrors { field message }
        }
      }`,
      { addressId, address, defaultAddress }
    );
    return assertCustomerMutation(data.customerAddressUpdate).customerAddress;
  }

  const data = await customerAccountRequest<{
    customerAddressCreate: {
      customerAddress?: { id: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    accessToken,
    `mutation CustomerAddressCreate(
      $address: CustomerAddressInput!
      $defaultAddress: Boolean
    ) {
      customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { address, defaultAddress }
  );
  return assertCustomerMutation(data.customerAddressCreate).customerAddress;
}

/** 住所の中身は変えず、既定の住所だけ切り替える */
export async function setDefaultCustomerAddress(
  accessToken: string,
  addressId: string
) {
  const data = await customerAccountRequest<{
    customerAddressUpdate: {
      customerAddress?: { id: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    accessToken,
    `mutation CustomerAddressSetDefault($addressId: ID!) {
      customerAddressUpdate(addressId: $addressId, defaultAddress: true) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { addressId }
  );

  return assertCustomerMutation(data.customerAddressUpdate).customerAddress;
}

export async function deleteCustomerAddress(
  accessToken: string,
  addressId: string
) {
  const data = await customerAccountRequest<{
    customerAddressDelete: {
      deletedAddressId?: string | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    accessToken,
    `mutation CustomerAddressDelete($addressId: ID!) {
      customerAddressDelete(addressId: $addressId) {
        deletedAddressId
        userErrors { field message }
      }
    }`,
    { addressId }
  );

  return assertCustomerMutation(data.customerAddressDelete).deletedAddressId;
}

/**
 * メール配信の購読・解除。
 *
 * Customer Account API ではメールアドレス自体は変更できず、
 * 配信状態だけをこの 2 つの mutation で切り替える。
 */
export async function setCustomerEmailMarketing(
  accessToken: string,
  subscribed: boolean
) {
  if (subscribed) {
    const data = await customerAccountRequest<{
      customerEmailMarketingSubscribe: {
        emailAddress?: { marketingState: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(
      accessToken,
      `mutation CustomerEmailMarketingSubscribe {
        customerEmailMarketingSubscribe {
          emailAddress { emailAddress marketingState }
          userErrors { field message }
        }
      }`
    );

    return assertCustomerMutation(data.customerEmailMarketingSubscribe)
      .emailAddress;
  }

  const data = await customerAccountRequest<{
    customerEmailMarketingUnsubscribe: {
      emailAddress?: { marketingState: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    accessToken,
    `mutation CustomerEmailMarketingUnsubscribe {
      customerEmailMarketingUnsubscribe {
        emailAddress { emailAddress marketingState }
        userErrors { field message }
      }
    }`
  );

  return assertCustomerMutation(data.customerEmailMarketingUnsubscribe)
    .emailAddress;
}

/** 「購読中」と扱うのは SUBSCRIBED だけ。PENDING は二重オプトイン待ち */
export function isEmailMarketingSubscribed(marketingState?: string | null) {
  return marketingState === "SUBSCRIBED";
}

/** メール変更など、Shopify 標準の会員画面へ案内するときの URL */
export async function getShopifyCustomerProfileUrl() {
  try {
    const { config, openid } = await discoverCustomerAccount();
    return (
      shopifyCustomerProfileUrlFromAccountUrl(config.accountUrl) ??
      shopifyCustomerProfileUrlFromAccountUrl(openid.authorization_endpoint)
    );
  } catch {
    const accountUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_URL;
    return accountUrl
      ? shopifyCustomerProfileUrlFromAccountUrl(accountUrl)
      : null;
  }
}

export async function getCustomerLogoutUrl(
  idToken?: string,
  postLogoutRedirectUri?: string
) {
  const { config, openid } = await discoverCustomerAccount();
  if (!openid.end_session_endpoint) {
    return null;
  }

  const url = new URL(openid.end_session_endpoint);
  if (idToken) {
    url.searchParams.set("id_token_hint", idToken);
  }
  url.searchParams.set(
    "post_logout_redirect_uri",
    postLogoutRedirectUri ?? new URL("/", config.callbackUrl).toString()
  );
  return url;
}
