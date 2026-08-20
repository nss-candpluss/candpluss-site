import "server-only";

import { z } from "zod";

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

export type CustomerAccount = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress: string } | null;
  defaultAddress?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    zoneCode?: string | null;
    territoryCode?: string | null;
    zip?: string | null;
    formatted: string[];
  } | null;
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      processedAt: string;
      financialStatus?: string | null;
      fulfillmentStatus?: string | null;
      totalPrice: { amount: string; currencyCode: string };
    }>;
  };
};

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
}: {
  state: string;
  codeChallenge: string;
  returnTo?: string;
}) {
  const { config, openid } = await discoverCustomerAccount();
  const url = new URL(openid.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("scope", "openid email customer-account-api:full");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (returnTo) {
    url.searchParams.set("return_to", returnTo);
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
  codeVerifier: string
) {
  const config = getCustomerAccountConfig();
  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.callbackUrl,
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
        firstName
        lastName
        emailAddress { emailAddress }
        defaultAddress {
          id
          firstName
          lastName
          address1
          address2
          city
          zoneCode
          territoryCode
          zip
          formatted
        }
        orders(first: 20, reverse: true) {
          nodes {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice { amount currencyCode }
          }
        }
      }
    }`
  );

  if (!data.customer) {
    throw new Error("Customer account request failed.");
  }

  return data.customer;
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
  }: {
    addressId?: string;
    address: Record<string, string>;
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
      ) {
        customerAddressUpdate(
          addressId: $addressId
          address: $address
          defaultAddress: true
        ) {
          customerAddress { id }
          userErrors { field message }
        }
      }`,
      { addressId, address }
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
    `mutation CustomerAddressCreate($address: CustomerAddressInput!) {
      customerAddressCreate(address: $address, defaultAddress: true) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { address }
  );
  return assertCustomerMutation(data.customerAddressCreate).customerAddress;
}

export async function getCustomerLogoutUrl(idToken?: string) {
  const { config, openid } = await discoverCustomerAccount();
  if (!openid.end_session_endpoint) {
    return null;
  }

  const url = new URL(openid.end_session_endpoint);
  if (idToken) {
    url.searchParams.set("id_token_hint", idToken);
  }
  url.searchParams.set("post_logout_redirect_uri", new URL("/", config.callbackUrl).toString());
  return url;
}
