import { z } from "zod";

import {
  addCartLines,
  createCart,
  getCartMerchandisePolicy,
  getCart,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify/cart";
import {
  clearCartSession,
  getCartIdFromSession,
  saveCartIdToSession,
} from "@/lib/shopify/cart-session";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

const addLineSchema = z.object({
  merchandiseId: z.string().startsWith("gid://shopify/ProductVariant/"),
  quantity: z.number().int().min(1).max(99).default(1),
});
const updateLineSchema = z.object({
  lineId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});
const removeLineSchema = z.object({
  lineId: z.string().min(1),
});

function buyerIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")
  );
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Cart request failed.";
  const configurationError =
    message.includes("SHOPIFY") || message.includes("SESSION_SECRET");

  return Response.json(
    { error: configurationError ? "Commerce is not configured." : message },
    { status: configurationError ? 503 : 400 }
  );
}

export async function GET(request: Request) {
  try {
    const cartId = await getCartIdFromSession();
    if (!cartId) {
      return Response.json({ cart: null });
    }

    const cart = await getCart(cartId, buyerIp(request));
    if (!cart) {
      await clearCartSession();
    }

    return Response.json({ cart });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = addLineSchema.parse(await request.json());
    const policy = await getCartMerchandisePolicy(input.merchandiseId);
    const blockedStatuses = new Set([
      "new",
      "comingSoon",
      "waiting",
      "ended",
      "soldOut",
      "discontinued",
    ]);

    if (
      !policy.availableForSale ||
      (policy.status && blockedStatuses.has(policy.status))
    ) {
      return Response.json(
        { error: "This product is not currently available for purchase." },
        { status: 409 }
      );
    }

    if (!policy.memberAccessConfigured) {
      return Response.json(
        { error: "Product member access has not been configured." },
        { status: 409 }
      );
    }

    if (policy.memberOnly) {
      const customerSession = await getCustomerTokenSession();
      if (!customerSession || customerSession.expiresAt <= Date.now()) {
        return Response.json(
          { error: "Customer login is required to purchase this product." },
          { status: 403 }
        );
      }
    }

    const cartId = await getCartIdFromSession();
    const cart = cartId
      ? await addCartLines(
          cartId,
          input.merchandiseId,
          input.quantity,
          buyerIp(request)
        )
      : await createCart(
          input.merchandiseId,
          input.quantity,
          buyerIp(request)
        );

    await saveCartIdToSession(cart.id);
    return Response.json({ cart });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const cartId = await getCartIdFromSession();
    if (!cartId) {
      return Response.json({ error: "Cart not found." }, { status: 404 });
    }

    const input = updateLineSchema.parse(await request.json());
    const cart =
      input.quantity === 0
        ? await removeCartLines(cartId, [input.lineId], buyerIp(request))
        : await updateCartLines(
            cartId,
            input.lineId,
            input.quantity,
            buyerIp(request)
          );

    return Response.json({ cart });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const cartId = await getCartIdFromSession();
    if (!cartId) {
      return Response.json({ error: "Cart not found." }, { status: 404 });
    }

    const input = removeLineSchema.parse(await request.json());
    const cart = await removeCartLines(cartId, [input.lineId], buyerIp(request));
    return Response.json({ cart });
  } catch (error) {
    return errorResponse(error);
  }
}
