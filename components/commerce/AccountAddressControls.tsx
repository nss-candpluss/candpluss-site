"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { FieldNote } from "@/components/commerce/AccountFieldNote";
import { AccountShallowLink } from "@/components/commerce/AccountShallowLink";
import { accountFieldNotes } from "@/lib/commerce/account-field-notes";
import {
  NEW_ACCOUNT_ADDRESS,
  accountAddressAddHref,
  accountAddressDeleteHref,
  accountAddressDeleteIdFromSearch,
  accountAddressIdFromSearch,
  accountPageTabHref,
} from "@/lib/commerce/account-page";

const addressActionClassName =
  "cursor-pointer border-b border-current font-body-ja text-sm text-[var(--foreground)]";

/** 住所 1 件に対する操作。フォームなので JavaScript なしで動く */
function AddressIntentButton({
  addressId,
  intent,
  children,
}: {
  addressId: string;
  intent: "default" | "delete";
  children: string;
}) {
  return (
    <form action="/api/shopify/customer/address" method="post">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="addressId" value={addressId} />
      <button type="submit" className={addressActionClassName}>
        {children}
      </button>
    </form>
  );
}

/**
 * 住所 1 件の見出しと操作。
 *
 * 削除の確認は JavaScript のダイアログではなく URL の `confirmDelete` で表す。
 * 開け閉てするだけなのでサーバーへは取りに行かない。
 */
export function AccountAddressHeader({
  addressId,
  title,
  isDefault,
}: {
  addressId: string;
  title: string;
  isDefault: boolean;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isConfirmingDelete =
    accountAddressDeleteIdFromSearch(search) === addressId;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="font-body-ja text-sm font-bold">{title}</p>
        {isDefault ? null : (
          <div>
            <AddressIntentButton addressId={addressId} intent="default">
              既定にする
            </AddressIntentButton>
            <FieldNote>{accountFieldNotes.address.setDefault}</FieldNote>
          </div>
        )}
        {isConfirmingDelete ? null : (
          <div>
            <AccountShallowLink
              href={accountAddressDeleteHref(addressId)}
              className={addressActionClassName}
            >
              削除する
            </AccountShallowLink>
            <FieldNote>{accountFieldNotes.address.remove}</FieldNote>
          </div>
        )}
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border border-[#ddd] p-4">
          <p className="font-body-ja text-sm">この住所を削除しますか？</p>
          <AddressIntentButton addressId={addressId} intent="delete">
            削除する
          </AddressIntentButton>
          <AccountShallowLink
            href={accountPageTabHref("addresses", search)}
            className={addressActionClassName}
          >
            やめる
          </AccountShallowLink>
        </div>
      ) : null}
    </>
  );
}

/**
 * 住所の追加フォームの出し入れ。
 *
 * フォームはサーバーで描画済みのものを受け取り、開いたときに差し込む。
 */
export function AccountAddressAdd({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const isOpen =
    accountAddressIdFromSearch(searchParams.toString()) === NEW_ACCOUNT_ADDRESS;

  if (isOpen) {
    return (
      <div>
        <p className="font-body-ja text-sm font-bold">住所を追加</p>
        <div className="mt-[calc(24px*var(--gap-scale-y))]">{children}</div>
      </div>
    );
  }

  return (
    <div>
      <AccountShallowLink
        href={accountAddressAddHref()}
        className={addressActionClassName}
      >
        住所を追加する
      </AccountShallowLink>
      <FieldNote>{accountFieldNotes.address.add}</FieldNote>
    </div>
  );
}
