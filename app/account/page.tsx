import { redirect } from "next/navigation";

import { fetchCustomerAccount } from "@/lib/shopify/customer-account";
import { getCustomerTokenSession } from "@/lib/shopify/customer-session";
import { inputText } from "@/lib/typography";

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

const inputClassName =
  `mt-2 w-full border border-[#ccc] bg-transparent px-4 py-3 font-body-ja ${inputText(14)}`;

export default async function AccountPage() {
  const isStaticExport = process.env.STATIC_EXPORT === "true";
  const session = isStaticExport ? null : await getCustomerTokenSession();
  const customer = session
    ? await fetchCustomerAccount(session.accessToken).catch(() => null)
    : null;

  if (!customer && !isStaticExport) {
    redirect("/account/login");
  }

  return (
    <main
      data-header-theme="onLight"
      className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <h1 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-none">
        Account
      </h1>

      {!customer ? (
        <div className="mt-12 max-w-[620px]">
          <p className="font-body-ja text-sm leading-relaxed">
            Shopifyアカウントでログインすると、プロフィールと注文履歴を確認できます。
          </p>
          <p className="mt-6 font-body-ja text-sm text-[var(--color-muted)]">
            アカウント機能はVercel環境への移行後に利用できます。
          </p>
        </div>
      ) : (
        <div className="mt-12">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#ddd] pb-8">
            <div>
              <p className="font-body-ja text-xl font-semibold">
                {[customer.lastName, customer.firstName].filter(Boolean).join(" ")}
              </p>
              <p className="mt-2 font-ui-en text-sm text-[var(--color-muted)]">
                {customer.emailAddress?.emailAddress}
              </p>
              {customer.defaultAddress?.formatted.length ? (
                <p className="mt-5 whitespace-pre-line font-body-ja text-sm leading-relaxed">
                  {customer.defaultAddress.formatted.join("\n")}
                </p>
              ) : null}
            </div>
            <form action="/account/logout" method="post">
              <button
                type="submit"
                className="border-b border-current font-ui-en text-sm"
              >
                LOGOUT
              </button>
            </form>
          </div>

          <section className="mt-14">
            <h2 className="font-ui-en text-xl font-semibold">ORDER HISTORY</h2>
            {customer.orders.nodes.length ? (
              <ul className="mt-6 divide-y divide-[#ddd] border-y border-[#ddd]">
                {customer.orders.nodes.map((order) => (
                  <li
                    key={order.id}
                    className="grid gap-3 py-6 font-body-ja text-sm min-[768px]:grid-cols-4"
                  >
                    <span className="font-ui-en font-semibold">{order.name}</span>
                    <time dateTime={order.processedAt}>
                      {new Intl.DateTimeFormat("ja-JP").format(
                        new Date(order.processedAt)
                      )}
                    </time>
                    <span>
                      {order.fulfillmentStatus || order.financialStatus || "-"}
                    </span>
                    <span className="font-ui-en min-[768px]:text-right">
                      {formatMoney(
                        order.totalPrice.amount,
                        order.totalPrice.currencyCode
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 font-body-ja text-sm">注文履歴はありません。</p>
            )}
          </section>

          <section className="mt-14 max-w-[720px]">
            <h2 className="font-ui-en text-xl font-semibold">PROFILE</h2>
            <form
              action="/api/shopify/customer/profile"
              method="post"
              className="mt-6 grid gap-5 min-[640px]:grid-cols-2"
            >
              <label className="font-body-ja text-sm">
                姓
                <input
                  name="lastName"
                  defaultValue={customer.lastName ?? ""}
                  maxLength={100}
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                名
                <input
                  name="firstName"
                  defaultValue={customer.firstName ?? ""}
                  maxLength={100}
                  className={inputClassName}
                />
              </label>
              <button
                type="submit"
                className="bg-[var(--foreground)] px-6 py-4 font-ui-en text-sm text-white min-[640px]:col-span-2 min-[640px]:w-fit"
              >
                UPDATE PROFILE
              </button>
            </form>
          </section>

          <section className="mt-14 max-w-[720px]">
            <h2 className="font-ui-en text-xl font-semibold">ADDRESS</h2>
            <form
              action="/api/shopify/customer/address"
              method="post"
              className="mt-6 grid gap-5 min-[640px]:grid-cols-2"
            >
              <input
                type="hidden"
                name="addressId"
                value={customer.defaultAddress?.id ?? ""}
              />
              <input type="hidden" name="territoryCode" value="JP" />
              <label className="font-body-ja text-sm">
                姓
                <input
                  name="lastName"
                  defaultValue={customer.defaultAddress?.lastName ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                名
                <input
                  name="firstName"
                  defaultValue={customer.defaultAddress?.firstName ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                郵便番号
                <input
                  name="zip"
                  defaultValue={customer.defaultAddress?.zip ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm">
                都道府県コード
                <input
                  name="zoneCode"
                  defaultValue={customer.defaultAddress?.zoneCode ?? ""}
                  placeholder="JP-40"
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                市区町村
                <input
                  name="city"
                  defaultValue={customer.defaultAddress?.city ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                住所1
                <input
                  name="address1"
                  defaultValue={customer.defaultAddress?.address1 ?? ""}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="font-body-ja text-sm min-[640px]:col-span-2">
                住所2
                <input
                  name="address2"
                  defaultValue={customer.defaultAddress?.address2 ?? ""}
                  className={inputClassName}
                />
              </label>
              <button
                type="submit"
                className="bg-[var(--foreground)] px-6 py-4 font-ui-en text-sm text-white min-[640px]:col-span-2 min-[640px]:w-fit"
              >
                UPDATE ADDRESS
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
