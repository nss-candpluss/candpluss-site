"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import {
  accountDialogActionsClassName,
  accountDialogClassName,
  accountPrimaryButtonClassName,
  accountSecondaryButtonClassName,
  accountSubHeadingClassName,
  accountTextLinkClassName,
} from "@/components/commerce/accountStyles";
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
import { bodyText, uiText } from "@/lib/typography";

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
 * 削除の確認。取り消しがきかないので、画面を覆って手を止めてもらう。
 *
 * 開いているかどうかは URL の `confirmDelete` が持つ。
 * ただし `open` 属性は React に触らせない。
 * `showModal()` で開いたダイアログは最前面の層に載っていて、
 * 属性を外しただけでは層と覆いが残り、ページ全体が押せなくなる。
 * 閉じるのは必ず `close()` を通す。
 *
 * JavaScript が動かないときは `<noscript>` の確認を出す。
 */
function AddressDeleteDialog({
  addressId,
  isOpen,
  closeHref,
  message,
}: {
  addressId: string;
  isOpen: boolean;
  closeHref: string;
  message: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  /*
    閉じるのは URL から合図を外すだけ。
    実際に閉じるのは上の効果なので、閉じ方が増えても 1 か所で済む。
  */
  const dismiss = useCallback(() => {
    window.history.replaceState(null, "", closeHref);
  }, [closeHref]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${addressId}-delete-message`}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        // 覆っている部分を押したときだけ閉じる。中身を押しても閉じない
        if (event.target === dialogRef.current) {
          dismiss();
        }
      }}
      className={accountDialogClassName}
    >
      <p
        id={`${addressId}-delete-message`}
        className={`font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
      >
        {message}
      </p>
      <div className={accountDialogActionsClassName}>
        {/*
          こちらはフォームに包まれているので、半分になるのは包みのほう。
          中のボタンは文字の分しか広がらないので、包みに合わせる。
        */}
        <AddressIntentButton
          addressId={addressId}
          intent="delete"
          className={`${accountPrimaryButtonClassName} w-full`}
        >
          削除する
        </AddressIntentButton>
        <button
          type="button"
          onClick={dismiss}
          className={accountSecondaryButtonClassName}
        >
          キャンセル
        </button>
      </div>
    </dialog>
  );
}

/** JavaScript が動かないときの確認。覆えないので、その場に並べる */
function AddressDeleteFallback({
  addressId,
  closeHref,
  message,
}: {
  addressId: string;
  closeHref: string;
  message: string;
}) {
  return (
    <noscript>
      <div className="flex w-full flex-wrap items-center gap-x-[clamp(12px,calc(16px*var(--gap-scale-x)),16px)] gap-y-3 rounded-[16px] border border-[var(--color-divider)] p-[clamp(16px,calc(24px*var(--gap-scale-x)),24px)]">
        <p
          className={`basis-full font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
        >
          {message}
        </p>
        <AddressIntentButton
          addressId={addressId}
          intent="delete"
          className={accountPrimaryButtonClassName}
        >
          削除する
        </AddressIntentButton>
        <a href={closeHref} className={accountSecondaryButtonClassName}>
          キャンセル
        </a>
      </div>
    </noscript>
  );
}

/**
 * 住所 1 件に対する操作。入力欄を読んだあとに押すものなので、フォームの下に置く。
 */
export function AccountAddressActions({
  addressId,
  isDefault,
  deleteMessage,
}: {
  addressId: string;
  isDefault: boolean;
  /** 削除の確認に出す文。既定かどうかで変わるのでサーバーで組む */
  deleteMessage: string;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isConfirmingDelete =
    accountAddressDeleteIdFromSearch(search) === addressId;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {isDefault ? null : (
        // 既定を移すのは保存と同じ「変える」操作なので、保存ボタンと同じ見た目にする
        <AddressIntentButton
          addressId={addressId}
          intent="default"
          className={accountPrimaryButtonClassName}
        >
          既定にする
        </AddressIntentButton>
      )}
      <AccountShallowLink
        href={accountAddressDeleteHref(addressId)}
        className={accountSecondaryButtonClassName}
      >
        削除する
      </AccountShallowLink>
      <AddressDeleteDialog
        addressId={addressId}
        isOpen={isConfirmingDelete}
        closeHref={accountPageTabHref("account", search)}
        message={deleteMessage}
      />
      {isConfirmingDelete ? (
        <AddressDeleteFallback
          addressId={addressId}
          closeHref={accountPageTabHref("account", search)}
          message={deleteMessage}
        />
      ) : null}
    </div>
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
        <p className={accountSubHeadingClassName}>住所を追加</p>
        <div className="mt-[clamp(24px,calc(32px*var(--gap-scale-y)),32px)]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* 押してもフォームが開くだけなので、「編集」と同じ下線付きの文字で置く */}
      <AccountShallowLink
        href={accountAddressAddHref()}
        className={accountTextLinkClassName}
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
