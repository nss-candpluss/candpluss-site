import "server-only";

import { shopifyStorefrontRequest } from "@/lib/shopify/client";
import type { ShopifyCart } from "@/types/cart";

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    nodes {
      id
      quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id
          title
          sku
          availableForSale
          image { url altText width height }
          product { handle title productType }
          price { amount currencyCode }
        }
      }
    }
  }
`;

type CartPayload = {
  cart?: ShopifyCart | null;
  userErrors: Array<{ field?: string[] | null; message: string; code?: string | null }>;
  warnings?: Array<{ message: string; code?: string | null }>;
};

export async function getCartMerchandisePolicy(merchandiseId: string) {
  const data = await shopifyStorefrontRequest<{
    node?: {
      availableForSale: boolean;
      product: {
        memberOnly?: { value?: string | null } | null;
        salesStatus?: {
          reference?: {
            fields: Array<{ key: string; value?: string | null }>;
          } | null;
        } | null;
      };
    } | null;
  }>(
    `query CartMerchandisePolicy($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          availableForSale
          product {
            memberOnly: metafield(namespace: "custom", key: "member_only") {
              value
            }
            salesStatus: metafield(namespace: "custom", key: "sales_status") {
              reference {
                ... on Metaobject {
                  fields { key value }
                }
              }
            }
          }
        }
      }
    }`,
    {
      variables: { id: merchandiseId },
      revalidate: false,
    }
  );
  const status = data.node?.product.salesStatus?.reference?.fields.find(
    (field) => field.key === "status"
  )?.value;

  return {
    availableForSale: Boolean(data.node?.availableForSale),
    memberAccessConfigured: Boolean(data.node?.product.memberOnly?.value),
    memberOnly: data.node?.product.memberOnly?.value === "true",
    status,
  };
}

function assertCartPayload(payload: CartPayload) {
  if (payload.userErrors.length || !payload.cart) {
    throw new Error(
      payload.userErrors.map((error) => error.message).join("; ") ||
        "Shopify did not return a cart."
    );
  }

  return payload.cart;
}

export async function createCart(
  merchandiseId: string,
  quantity: number,
  buyerIp?: string | null
) {
  const data = await shopifyStorefrontRequest<{
    cartCreate: CartPayload;
  }>(
    `mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ${CART_FIELDS} }
        userErrors { field message code }
        warnings { message code }
      }
    }`,
    {
      variables: {
        input: {
          lines: [{ merchandiseId, quantity }],
        },
      },
      revalidate: false,
      buyerIp,
    }
  );

  return assertCartPayload(data.cartCreate);
}

export async function getCart(cartId: string, buyerIp?: string | null) {
  const data = await shopifyStorefrontRequest<{
    cart: ShopifyCart | null;
  }>(
    `query Cart($id: ID!) {
      cart(id: $id) { ${CART_FIELDS} }
    }`,
    { variables: { id: cartId }, revalidate: false, buyerIp }
  );

  return data.cart;
}

export async function addCartLines(
  cartId: string,
  merchandiseId: string,
  quantity: number,
  buyerIp?: string | null
) {
  const data = await shopifyStorefrontRequest<{
    cartLinesAdd: CartPayload;
  }>(
    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { field message code }
        warnings { message code }
      }
    }`,
    {
      variables: { cartId, lines: [{ merchandiseId, quantity }] },
      revalidate: false,
      buyerIp,
    }
  );

  return assertCartPayload(data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lineId: string,
  quantity: number,
  buyerIp?: string | null
) {
  const data = await shopifyStorefrontRequest<{
    cartLinesUpdate: CartPayload;
  }>(
    `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { field message code }
        warnings { message code }
      }
    }`,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      revalidate: false,
      buyerIp,
    }
  );

  return assertCartPayload(data.cartLinesUpdate);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
  buyerIp?: string | null
) {
  const data = await shopifyStorefrontRequest<{
    cartLinesRemove: CartPayload;
  }>(
    `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_FIELDS} }
        userErrors { field message code }
        warnings { message code }
      }
    }`,
    {
      variables: { cartId, lineIds },
      revalidate: false,
      buyerIp,
    }
  );

  return assertCartPayload(data.cartLinesRemove);
}

export async function updateCartBuyerIdentity(
  cartId: string,
  customerAccessToken: string,
  buyerIp?: string | null
) {
  const data = await shopifyStorefrontRequest<{
    cartBuyerIdentityUpdate: CartPayload;
  }>(
    `mutation CartBuyerIdentityUpdate(
      $cartId: ID!
      $buyerIdentity: CartBuyerIdentityInput!
    ) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { ${CART_FIELDS} }
        userErrors { field message code }
        warnings { message code }
      }
    }`,
    {
      variables: { cartId, buyerIdentity: { customerAccessToken } },
      revalidate: false,
      buyerIp,
    }
  );

  return assertCartPayload(data.cartBuyerIdentityUpdate);
}
