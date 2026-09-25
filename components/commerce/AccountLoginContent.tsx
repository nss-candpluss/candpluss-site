import { redirect } from "next/navigation";

import { AccountConsentGate } from "@/components/commerce/AccountConsentGate";
import { accountSecondaryButtonClassName } from "@/components/commerce/accountStyles";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicyContent } from "@/data/legal/privacyPolicy";
import { termsContent } from "@/data/legal/terms";
import {
  ACCOUNT_BASE_PATH,
  safeAccountReturnTo,
} from "@/lib/commerce/account-login";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";
import { bodyText, uiText } from "@/lib/typography";

type AccountLoginContentProps = {
  returnTo?: string;
  error?: string;
};

const pageTitleClassName = `font-body-ja font-semibold text-[var(--foreground)] ${uiText(20)}`;
const blockTitleClassName = `font-body-ja font-bold text-[var(--foreground)] ${uiText(18)}`;
const bodyClassName = `font-body-ja text-[var(--foreground)] ${bodyText(15)}`;

/** 区画ひとつ。ふたつの入口を対等に見せたいので、同じ形で並べる */
function LoginBlock({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--color-divider)] py-[clamp(42px,calc(72px*var(--gap-scale-y)),72px)] first:border-t-0 first:pt-0 last:pb-0">
      <h2 className={blockTitleClassName}>{title}</h2>
      <p
        className={`mt-[clamp(12px,calc(16px*var(--gap-scale-y)),16px)] ${bodyClassName}`}
      >
        {lead}
      </p>
      <div className="mt-[clamp(24px,calc(32px*var(--gap-scale-y)),32px)]">
        {children}
      </div>
    </section>
  );
}

/**
 * 会員ページに入る前の入口。公開ページの `/account/login` とテスト領域の
 * `/shopify-test/account/login` で共有する。
 *
 * ログイン済みならここは通らず、そのまま会員ページへ戻す。
 *
 * 未ログインの人には、はじめての方と登録済みの方で道を分ける。
 * Shopify のサインイン画面は新規と既存が一体で、こちらからは
 * どちらなのか分からない。はじめての方にだけ規約を読んでもらうには、
 * 進む前に本人に選んでもらうしかない。
 */
export async function AccountLoginContent({
  returnTo: requestedReturnTo,
  error,
}: AccountLoginContentProps) {
  const isStaticExport = process.env.STATIC_EXPORT === "true";
  const returnTo = safeAccountReturnTo(requestedReturnTo);
  const showConfigError = error === "config";
  // 既定の行き先なら送らない。始める側で同じ値を入れてくれる
  const carriedReturnTo = returnTo === ACCOUNT_BASE_PATH ? undefined : returnTo;

  if (!isStaticExport) {
    const session = await getCustomerTokenSession();
    if (session) {
      redirect(returnTo);
    }
  }

  return (
    <main
      data-header-theme="onLight"
      className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <div className="mx-auto w-full max-w-[720px]">
        <h1 className={pageTitleClassName}>ログイン / 会員登録</h1>

        {showConfigError ? (
          <p
            role="alert"
            className={`mt-[16px] font-body-ja text-[#9b1b30] ${bodyText(14)}`}
          >
            ログイン設定が完了していないため、現在ご利用いただけません。
          </p>
        ) : null}

        {isStaticExport ? (
          <p
            className={`mt-[32px] font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}
          >
            アカウント機能はVercel環境への移行後に利用できます。
          </p>
        ) : (
          <div className="mt-[clamp(32px,calc(56px*var(--gap-scale-y)),56px)] flex flex-col">
            <LoginBlock
              title="登録済みの方"
              lead="ご登録のメールアドレスに確認コードをお送りします。パスワードは必要ありません。"
            >
              <form action="/account/login/start" method="post">
                {carriedReturnTo ? (
                  <input type="hidden" name="returnTo" value={carriedReturnTo} />
                ) : null}
                <button
                  type="submit"
                  className={`${accountSecondaryButtonClassName} w-full`}
                >
                  ログインに進む
                </button>
              </form>
            </LoginBlock>

            <LoginBlock
              title="はじめての方"
              lead="会員登録には、利用規約とプライバシーポリシーへの同意が必要です。それぞれ最後までお読みください。"
            >
              <AccountConsentGate
                returnTo={carriedReturnTo}
                documents={[
                  {
                    id: "terms",
                    label: "利用規約",
                    body: <LegalDocument content={termsContent} embedded />,
                  },
                  {
                    id: "privacy",
                    label: "プライバシーポリシー",
                    body: (
                      <LegalDocument content={privacyPolicyContent} embedded />
                    ),
                  },
                ]}
              />
            </LoginBlock>
          </div>
        )}
      </div>
    </main>
  );
}
