import { z } from "zod";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
} from "@/lib/commerce/account-login";
import {
  ACCOUNT_SESSION_EXPIRED_NOTICE,
  accountAddressEditHref,
  accountAddressNoticeKey,
  accountPageErrorMessage,
  applyAccountSavedParams,
  toShopifyJapanPhoneNumber,
} from "@/lib/commerce/account-page";
import {
  deleteCustomerAddress,
  fetchCustomerAccount,
  readAfterCustomerUpdate,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from "@/lib/shopify/customer-account";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";

export const runtime = "nodejs";

/*
  配送先なので、欠けたまま保存させない。
  フォーム側の required はブラウザに任せた確認でしかないので、
  ここでも 1 文字以上あることを確かめる。
  建物名・部屋番号だけは、戸建てで書きようがないので任意のまま。
*/
const addressSchema = z.object({
  addressId: z.string().optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  zip: z.string().trim().min(1).max(20),
  territoryCode: z.string().trim().length(2).default("JP"),
  zoneCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  address1: z.string().trim().min(1).max(255),
  address2: z.string().trim().max(255).optional(),
  phoneNumber: z.string().trim().min(1).max(20),
});

/** 一覧の「既定に設定」「削除」と、編集フォームの保存を 1 つの口で受ける */
const intentSchema = z.enum(["save", "default", "delete"]).catch("save");

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  const origin = publicOriginFromRequest(request.url, request.headers);
  /*
    すでにある住所の保存は、ページを読み直さずに JSON で結果だけ受け取る。
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

  const listUrl = new URL(`${ACCOUNT_BASE_PATH}?tab=account`, origin);
  const formData = await request.formData();
  const intent = intentSchema.parse(formData.get("intent"));
  const addressId = formData.get("addressId");

  if (intent === "default" || intent === "delete") {
    const updatedKey = intent === "default" ? "address-default" : "address-deleted";

    try {
      if (typeof addressId !== "string" || !addressId) {
        throw new Error("addressId is required.");
      }

      if (intent === "default") {
        await setDefaultCustomerAddress(session.accessToken, addressId);
        await readAfterCustomerUpdate(
          () => fetchCustomerAccount(session.accessToken),
          (current) => current.defaultAddress?.id === addressId
        );
      } else {
        await deleteCustomerAddress(session.accessToken, addressId);
        await readAfterCustomerUpdate(
          () => fetchCustomerAccount(session.accessToken),
          (current) =>
            !current.addresses.nodes.some((node) => node.id === addressId)
        );
      }

      listUrl.searchParams.set("updated", updatedKey);
    } catch {
      listUrl.searchParams.set("error", updatedKey);
    }

    return Response.redirect(listUrl, 303);
  }

  try {
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
      phoneNumber: formData.get("phoneNumber"),
    });
    const { addressId: savedAddressId, phoneNumber, ...address } = parsed;

    const saved = await saveCustomerAddress(session.accessToken, {
      addressId: savedAddressId,
      // Shopify は E.164 でしか受け取らないので、送る前に整える
      address: { ...address, phoneNumber: toShopifyJapanPhoneNumber(phoneNumber) },
      // 既定にするかはフォームのチェックで決める（1 件目は既定で入る）
      defaultAddress: formData.get("defaultAddress") === "on",
    });

    // 保存した住所が読めるようになってから戻す。すぐ戻すと前の内容が出る
    const savedId = saved?.id;
    if (savedId) {
      await readAfterCustomerUpdate(
        () => fetchCustomerAccount(session.accessToken),
        (current) => {
          const node = current.addresses.nodes.find(
            (candidate) => candidate.id === savedId
          );
          return (
            (node?.address1 ?? "") === address.address1 &&
            (node?.zip ?? "") === address.zip
          );
        }
      );
    }

    if (wantsJson) {
      return Response.json({ ok: true });
    }

    // 押したフォームのその場に結果を出すので、どのフォームだったかを返す
    const notice = formData.get("notice");
    applyAccountSavedParams(
      listUrl,
      typeof notice === "string" && notice
        ? notice
        : accountAddressNoticeKey(savedAddressId)
    );
    return Response.redirect(listUrl, 303);
  } catch {
    if (wantsJson) {
      return Response.json(
        { ok: false, message: accountPageErrorMessage("address") },
        { status: 400 }
      );
    }

    // 入力内容を直せるよう、編集していた住所のフォームへ戻す
    const editUrl = new URL(
      `${ACCOUNT_BASE_PATH}${accountAddressEditHref(
        typeof addressId === "string" && addressId ? addressId : undefined
      )}`,
      origin
    );
    editUrl.searchParams.set("error", "address");
    return Response.redirect(editUrl, 303);
  }
}
