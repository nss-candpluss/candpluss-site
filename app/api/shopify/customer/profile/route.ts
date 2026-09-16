import { z } from "zod";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
} from "@/lib/commerce/account-login";
import { updateCustomerProfile } from "@/lib/shopify/customer-account";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

const profileSchema = z.object({
  firstName: z.string().trim().max(100),
  lastName: z.string().trim().max(100),
});

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  if (!session) {
    return Response.redirect(new URL(ACCOUNT_LOGIN_PATH, request.url), 303);
  }

  try {
    const formData = await request.formData();
    const input = profileSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    });
    await updateCustomerProfile(session.accessToken, input);
    return Response.redirect(
      new URL(`${ACCOUNT_BASE_PATH}?updated=profile`, request.url),
      303
    );
  } catch {
    return Response.redirect(
      new URL(`${ACCOUNT_BASE_PATH}?error=profile`, request.url),
      303
    );
  }
}
