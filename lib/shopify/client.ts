import "server-only";

import { getShopifyConfig } from "@/lib/shopify/config";

type GraphqlError = {
  message: string;
  path?: Array<string | number>;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

type ShopifyRequestOptions = {
  variables?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number | false;
  buyerIp?: string | null;
};

export class ShopifyRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly errors?: GraphqlError[]
  ) {
    super(message);
    this.name = "ShopifyRequestError";
  }
}

export async function shopifyStorefrontRequest<T>(
  query: string,
  {
    variables = {},
    tags = [],
    revalidate = 300,
    buyerIp,
  }: ShopifyRequestOptions = {}
): Promise<T> {
  const config = getShopifyConfig();
  const response = await fetch(
    `https://${config.storeDomain}/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Shopify-Storefront-Private-Token": config.privateToken,
        ...(buyerIp ? { "Shopify-Storefront-Buyer-IP": buyerIp } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: revalidate === false ? "no-store" : undefined,
      next:
        revalidate === false
          ? undefined
          : {
              revalidate,
              tags,
            },
    }
  );

  let payload: GraphqlResponse<T>;
  try {
    payload = (await response.json()) as GraphqlResponse<T>;
  } catch {
    throw new ShopifyRequestError(
      `Shopify returned a non-JSON response (${response.status}).`,
      response.status
    );
  }

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new ShopifyRequestError(
      payload.errors?.map((error) => error.message).join("; ") ||
        `Shopify request failed (${response.status}).`,
      response.status,
      payload.errors
    );
  }

  return payload.data;
}
