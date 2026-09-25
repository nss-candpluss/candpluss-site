import { z } from "zod";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
} from "@/lib/commerce/account-login";
import {
  ACCOUNT_SESSION_EXPIRED_NOTICE,
  accountPageErrorMessage,
  applyAccountSavedParams,
} from "@/lib/commerce/account-page";
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

/*
  名前と配信設定は別のフォームで変える。
  どちらのフォームから来たかで、触る項目を分ける。
  片方のフォームに両方の値を持たせると、
  ページを読み直さない保存では古い値のまま上書きしてしまう。
*/
const intentSchema = z.enum(["name", "emailMarketing"]).catch("name");

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  const origin = publicOriginFromRequest(request.url, request.headers);
  /*
    ページを読み直さずに保存する画面からは JSON を求めて送ってくる。
    JavaScript が動かないときは普通のフォーム送信になり、
    これまでどおりリダイレクトで結果を伝える。
  */
  const wantsJson = (request.headers.get("accept") ?? "").includes(
    "application/json"
  );

  if (!session) {
    if (wantsJson) {
      return Response.json(
        { ok: false, message: ACCOUNT_SESSION_EXPIRED_NOTICE },
        { status: 401 }
      );
    }

    return Response.redirect(new URL(ACCOUNT_LOGIN_PATH, origin), 303);
  }

  const redirectUrl = new URL(
    `${ACCOUNT_BASE_PATH}?tab=account`,
    origin
  );

  try {
    const formData = await request.formData();

    if (intentSchema.parse(formData.get("intent")) === "name") {
      const input = profileSchema.parse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
      });
      await updateCustomerProfile(session.accessToken, input);

      // 保存した名前が読めるようになってから戻す。すぐ戻すと前の名前が出る
      await readAfterCustomerUpdate(
        () => fetchCustomerAccount(session.accessToken),
        (current) =>
          (current.firstName ?? "") === input.firstName &&
          (current.lastName ?? "") === input.lastName
      );
    } else {
      // 送信値と今の配信状態を比べ、変わったときだけ購読を切り替える
      const wantsEmailMarketing = formData.get("emailMarketing") === "on";
      const profile = await fetchCustomerAccount(session.accessToken);

      if (
        wantsEmailMarketing !==
        isEmailMarketingSubscribed(profile.emailAddress?.marketingState)
      ) {
        await setCustomerEmailMarketing(
          session.accessToken,
          wantsEmailMarketing
        );
        await readAfterCustomerUpdate(
          () => fetchCustomerAccount(session.accessToken),
          (current) =>
            isEmailMarketingSubscribed(current.emailAddress?.marketingState) ===
            wantsEmailMarketing
        );
      }
    }

    if (wantsJson) {
      return Response.json({ ok: true });
    }

    // 押したフォームのその場に結果を出すので、どのフォームだったかを返す
    const notice = formData.get("notice");
    applyAccountSavedParams(
      redirectUrl,
      typeof notice === "string" && notice ? notice : "profile"
    );
    return Response.redirect(redirectUrl, 303);
  } catch {
    if (wantsJson) {
      return Response.json(
        { ok: false, message: accountPageErrorMessage("profile") },
        { status: 400 }
      );
    }

    redirectUrl.searchParams.set("error", "profile");
    return Response.redirect(redirectUrl, 303);
  }
}
