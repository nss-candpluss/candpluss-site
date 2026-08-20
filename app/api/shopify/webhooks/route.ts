import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";

function isValidShopifyWebhook(body: string, receivedHmac: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !receivedHmac) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body, "utf8").digest();
  let received: Buffer;

  try {
    received = Buffer.from(receivedHmac, "base64");
  } catch {
    return false;
  }

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const body = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  if (!isValidShopifyWebhook(body, hmac)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  let handle: string | undefined;

  try {
    const payload = JSON.parse(body) as { handle?: string };
    handle = payload.handle;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  revalidateTag("shopify-products", { expire: 0 });
  revalidatePath("/products");

  if (handle) {
    revalidateTag(`shopify-product:${handle}`, { expire: 0 });
    revalidatePath(`/products/${handle}`);
  }

  return Response.json({ received: true, topic, handle: handle ?? null });
}
