import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { safeAccountReturnTo } from "@/lib/commerce/account-login";
import { siteConfig } from "@/lib/site";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";
import { bodyText, uiText } from "@/lib/typography";

export const metadata: Metadata = {
  title: `ログインまたはアカウント作成 | ${siteConfig.name}`,
  description: `${siteConfig.name}のログイン・アカウント作成ページです。`,
};

type AccountLoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    error?: string;
  }>;
};

export default async function AccountLoginPage({
  searchParams,
}: AccountLoginPageProps) {
  const params = await searchParams;
  const isStaticExport = process.env.STATIC_EXPORT === "true";
  const returnTo = safeAccountReturnTo(params.returnTo);
  const showConfigError = params.error === "config";

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
      <div className="mx-auto w-full max-w-[420px]">
        <h1 className={`font-body-ja font-semibold ${uiText(20)}`}>
          ログインまたはアカウント作成
        </h1>
        <p
          className={`mt-[16px] font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}
        >
          メールアドレスを入力し、ログインまたはアカウント作成を行ってください。
        </p>

        {isStaticExport ? (
          <p
            className={`mt-[32px] font-body-ja text-[var(--color-muted)] ${bodyText(15)}`}
          >
            アカウント機能はVercel環境への移行後に利用できます。
          </p>
        ) : (
          <form
            action="/account/login/start"
            method="post"
            className="mt-[32px]"
          >
            {returnTo !== "/account" ? (
              <input type="hidden" name="returnTo" value={returnTo} />
            ) : null}

            {showConfigError ? (
              <p
                role="alert"
                className={`mb-[16px] font-body-ja text-[#9b1b30] ${bodyText(14)}`}
              >
                ログイン設定が完了していないため、現在ご利用いただけません。
              </p>
            ) : null}

            <label className="block">
              <span className="sr-only">メールアドレス（必須）</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="メールアドレス *"
                className={`w-full bg-[#f5f5f5] px-[16px] py-[16px] font-body-ja text-[var(--foreground)] outline-none placeholder:text-[var(--color-muted)] ${uiText(16)}`}
              />
            </label>

            <button
              type="submit"
              className={`mt-[16px] flex w-full items-center justify-center rounded-full bg-[var(--foreground)] px-[16px] py-[16px] font-body-ja font-medium text-white ${uiText(16)}`}
            >
              続ける
            </button>
          </form>
        )}

        <p
          className={`mt-[32px] font-body-ja text-[var(--color-muted)] ${bodyText(14)}`}
        >
          当サイトの利用を継続すると、
          <Link href="/legal/terms" className="underline">
            利用規約
          </Link>
          と
          <Link href="/legal/privacy-policy" className="underline">
            プライバシーポリシー
          </Link>
          に同意されたことになります。
        </p>
      </div>
    </main>
  );
}
