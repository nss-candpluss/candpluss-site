import { z } from "zod";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
} from "@/lib/commerce/account-login";
import { applyAccountSavedParams } from "@/lib/commerce/account-page";
import {
  fetchCustomerAccount,
  isEmailMarketingSubscribed,
  readAfterCustomerUpdate,
  setCustomerEmailMarketing,
  updateCustomerProfile,
} from "@/lib/shopify/customer-account";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

const profileSchema = z.object({
  firstName: z.string().trim().max(100),
  lastName: z.string().trim().max(100),
});

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  const origin = publicOriginFromRequest(request.url, request.headers);

  if (!session) {
    return Response.redirect(new URL(ACCOUNT_LOGIN_PATH, origin), 303);
  }

  const redirectUrl = new URL(
    `${ACCOUNT_BASE_PATH}?tab=account`,
    origin
  );

  try {
    const formData = await request.formData();
    const input = profileSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
    });
    await updateCustomerProfile(session.accessToken, input);

    // 保存した名前が読めるようになってから戻す。すぐ戻すと前の名前が出る
    const profile = await readAfterCustomerUpdate(
      () => fetchCustomerAccount(session.accessToken),
      (current) =>
        (current.firstName ?? "") === input.firstName &&
        (current.lastName ?? "") === input.lastName
    );

    // 送信値と今の配信状態を比べ、変わったときだけ購読を切り替える
    const wantsEmailMarketing = formData.get("emailMarketing") === "on";

    if (
      wantsEmailMarketing !==
      isEmailMarketingSubscribed(profile.emailAddress?.marketingState)
    ) {
      await setCustomerEmailMarketing(session.accessToken, wantsEmailMarketing);
      await readAfterCustomerUpdate(
        () => fetchCustomerAccount(session.accessToken),
        (current) =>
          isEmailMarketingSubscribed(current.emailAddress?.marketingState) ===
          wantsEmailMarketing
      );
    }

    // 押したフォームのその場に結果を出すので、どのフォームだったかを返す
    const notice = formData.get("notice");
    applyAccountSavedParams(
      redirectUrl,
      typeof notice === "string" && notice ? notice : "profile"
    );
    return Response.redirect(redirectUrl, 303);
  } catch {
    redirectUrl.searchParams.set("error", "profile");
    return Response.redirect(redirectUrl, 303);
  }
}
