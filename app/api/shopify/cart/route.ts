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
import { evaluateCartMerchandisePolicy } from "@/lib/commerce/cart-policy";
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
  const message = error instanceof Error ? error.message : "";
  const configurationError =
    message.includes("SHOPIFY") || message.includes("SESSION_SECRET");

  if (error instanceof z.ZodError) {
    return Response.json({ error: "Invalid cart request." }, { status: 400 });
  }

  return Response.json(
    {
      error: configurationError
        ? "Commerce is not configured."
        : "Cart request failed.",
    },
    { status: configurationError ? 503 : 400 }
  );
}

async function isCustomerAuthenticated() {
  const customerSession = await getCustomerTokenSession();
  return Boolean(customerSession && customerSession.expiresAt > Date.now());
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
    const decision = evaluateCartMerchandisePolicy(
      policy,
      await isCustomerAuthenticated()
    );

    if (!decision.ok) {
      return Response.json({ error: decision.error }, { status: decision.status });
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
    const ip = buyerIp(request);

    if (input.quantity === 0) {
      const cart = await removeCartLines(cartId, [input.lineId], ip);
      return Response.json({ cart });
    }

    const existingCart = await getCart(cartId, ip);
    const line = existingCart?.lines.nodes.find((item) => item.id === input.lineId);

    if (!existingCart || !line) {
      return Response.json({ error: "Cart line not found." }, { status: 404 });
    }

    // 数量を増やすときだけ再検証する。減らす操作は通す。
    if (input.quantity > line.quantity) {
      const policy = await getCartMerchandisePolicy(line.merchandise.id);
      const decision = evaluateCartMerchandisePolicy(
        policy,
        await isCustomerAuthenticated()
      );

      if (!decision.ok) {
        return Response.json({ error: decision.error }, { status: decision.status });
      }
    }

    const cart = await updateCartLines(cartId, input.lineId, input.quantity, ip);

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
