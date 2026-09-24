"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import {
  accountPrimaryButtonClassName,
  accountSecondaryButtonClassName,
} from "@/components/commerce/accountButtonStyles";
import { AccountShallowLink } from "@/components/commerce/AccountShallowLink";
import { useAccountSavedNotice } from "@/components/commerce/useAccountSavedNotice";
import {
  ACCOUNT_SAVED_NOTICE,
  NEW_ACCOUNT_ADDRESS,
  accountAddressAddHref,
  accountAddressDeleteHref,
  accountAddressDeleteIdFromSearch,
  accountAddressIdFromSearch,
  accountAddressNoticeKey,
  accountPageTabHref,
} from "@/lib/commerce/account-page";
import { uiText } from "@/lib/typography";

/** 住所 1 件に対する操作。フォームなので JavaScript なしで動く */
function AddressIntentButton({
  addressId,
  intent,
  className = accountSecondaryButtonClassName,
  children,
}: {
  addressId: string;
  intent: "default" | "delete";
  className?: string;
  children: string;
}) {
  return (
    <form action="/api/shopify/customer/address" method="post">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="addressId" value={addressId} />
      <button type="submit" className={className}>
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
          <AddressIntentButton addressId={addressId} intent="default">
            既定にする
          </AddressIntentButton>
        )}
        {isConfirmingDelete ? null : (
          <AccountShallowLink
            href={accountAddressDeleteHref(addressId)}
            className={accountSecondaryButtonClassName}
          >
            削除する
          </AccountShallowLink>
        )}
      </div>

      {isConfirmingDelete ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border border-[#ddd] p-4">
          <p className="font-body-ja text-sm">この住所を削除しますか？</p>
          <AddressIntentButton
            addressId={addressId}
            intent="delete"
            className={accountPrimaryButtonClassName}
          >
            削除する
          </AddressIntentButton>
          <AccountShallowLink
            href={accountPageTabHref("account", search)}
            className={accountSecondaryButtonClassName}
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
  /*
    追加した住所のフォームは保存後に閉じるので、結果を出す場所が無くなる。
    追加ボタンの横に出して、どの操作の結果か分かるようにする。
  */
  const showSaved = useAccountSavedNotice(accountAddressNoticeKey());

  if (isOpen) {
    return (
      <div>
        <p className="font-body-ja text-sm font-bold">住所を追加</p>
        <div className="mt-[calc(24px*var(--gap-scale-y))]">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <AccountShallowLink
        href={accountAddressAddHref()}
        className={accountPrimaryButtonClassName}
      >
        住所を追加する
      </AccountShallowLink>
      {showSaved ? (
        <p
          role="status"
          className={`font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
        >
          {ACCOUNT_SAVED_NOTICE}
        </p>
      ) : null}
    </div>
  );
}
