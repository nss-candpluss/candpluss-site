import { z } from "zod";

import { saveCustomerAddress } from "@/lib/shopify/customer-account";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

const addressSchema = z.object({
  addressId: z.string().optional(),
  firstName: z.string().trim().max(100),
  lastName: z.string().trim().max(100),
  zip: z.string().trim().max(20),
  territoryCode: z.string().trim().length(2).default("JP"),
  zoneCode: z.string().trim().max(20),
  city: z.string().trim().max(100),
  address1: z.string().trim().max(255),
  address2: z.string().trim().max(255).optional(),
});

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  if (!session) {
    return Response.redirect(new URL("/account/login", request.url), 303);
  }

  try {
    const formData = await request.formData();
    const parsed = addressSchema.parse({
      addressId: formData.get("addressId") || undefined,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      zip: formData.get("zip"),
      territoryCode: formData.get("territoryCode") || "JP",
      zoneCode: formData.get("zoneCode"),
      city: formData.get("city"),
      address1: formData.get("address1"),
      address2: formData.get("address2") || undefined,
    });
    const { addressId, ...address } = parsed;
    await saveCustomerAddress(session.accessToken, { addressId, address });
    return Response.redirect(new URL("/account?updated=address", request.url), 303);
  } catch {
    return Response.redirect(new URL("/account?error=address", request.url), 303);
  }
}
