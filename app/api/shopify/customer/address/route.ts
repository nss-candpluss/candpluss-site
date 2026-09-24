import { z } from "zod";

import {
  ACCOUNT_BASE_PATH,
  ACCOUNT_LOGIN_PATH,
  publicOriginFromRequest,
} from "@/lib/commerce/account-login";
import {
  accountAddressEditHref,
  accountAddressNoticeKey,
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
  phoneNumber: z.string().trim().max(20).optional(),
});

/** 一覧の「既定に設定」「削除」と、編集フォームの保存を 1 つの口で受ける */
const intentSchema = z.enum(["save", "default", "delete"]).catch("save");

export async function POST(request: Request) {
  const session = await getCustomerTokenSession();
  const origin = publicOriginFromRequest(request.url, request.headers);

  if (!session) {
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
      phoneNumber: formData.get("phoneNumber") || undefined,
    });
    const { addressId: savedAddressId, phoneNumber, ...address } = parsed;

    const saved = await saveCustomerAddress(session.accessToken, {
      addressId: savedAddressId,
      // 空で送られたら null。消したいときに消せるようにする
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
