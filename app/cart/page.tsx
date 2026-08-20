"use client";

import Link from "next/link";

import { useCart } from "@/components/commerce/CartProvider";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import { SiteImage } from "@/components/ui/SiteImage";

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function checkoutUrl(url: string, isLoggedIn: boolean) {
  if (!isLoggedIn) {
    return url;
  }

  const checkout = new URL(url);
  checkout.searchParams.set("sso", "silent");
  return checkout.toString();
}

export default function CartPage() {
  const { cart, error, isLoading, removeLine, updateLine } = useCart();
  const { customer } = useCustomer();

  return (
    <main
      data-header-theme="onLight"
      className="px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <h1 className="font-heading text-[clamp(38px,calc(24.13px+3.7vw),62px)] leading-none">
        Cart
      </h1>

      {isLoading && !cart ? (
        <p className="mt-12 text-sm">カートを読み込んでいます。</p>
      ) : null}

      {!isLoading && !cart?.lines.nodes.length ? (
        <div className="mt-12">
          <p className="font-body-ja text-sm">カートに商品はありません。</p>
          <Link
            href="/products"
            className="mt-8 inline-flex border-b border-current font-ui-en text-sm"
          >
            VIEW PRODUCTS
          </Link>
        </div>
      ) : null}

      {cart?.lines.nodes.length ? (
        <>
          <ul className="mt-12 divide-y divide-[#ddd] border-y border-[#ddd]">
            {cart.lines.nodes.map((line) => (
              <li
                key={line.id}
                className="grid grid-cols-[96px_1fr] gap-6 py-6 min-[768px]:grid-cols-[144px_1fr_auto]"
              >
                <div className="relative aspect-square bg-[#eef1f3]">
                  {line.merchandise.image ? (
                    <SiteImage
                      src={line.merchandise.image.url}
                      alt={
                        line.merchandise.image.altText ||
                        line.merchandise.product.title
                      }
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div>
                  <Link
                    href={`/products/${line.merchandise.product.handle}`}
                    className="font-body-ja text-base font-semibold"
                  >
                    {line.merchandise.product.title}
                  </Link>
                  {line.merchandise.title !== "Default Title" ? (
                    <p className="mt-2 font-ui-en text-sm text-[var(--color-muted)]">
                      {line.merchandise.title}
                    </p>
                  ) : null}
                  <p className="mt-4 font-ui-en text-sm">
                    {formatMoney(
                      line.merchandise.price.amount,
                      line.merchandise.price.currencyCode
                    )}
                  </p>

                  <div className="mt-5 flex items-center gap-4">
                    <label className="font-body-ja text-sm">
                      数量
                      <select
                        value={line.quantity}
                        disabled={isLoading}
                        onChange={(event) =>
                          void updateLine(line.id, Number(event.target.value))
                        }
                        className="ml-3 border border-[#ccc] bg-transparent px-3 py-2"
                      >
                        {Array.from({ length: 10 }, (_, index) => index + 1).map(
                          (quantity) => (
                            <option key={quantity} value={quantity}>
                              {quantity}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => void removeLine(line.id)}
                      className="border-b border-current font-body-ja text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>

                <p className="col-start-2 font-ui-en text-sm font-semibold min-[768px]:col-start-auto">
                  {formatMoney(
                    line.cost.totalAmount.amount,
                    line.cost.totalAmount.currencyCode
                  )}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-10 ml-auto max-w-[420px]">
            <div className="flex justify-between font-body-ja text-base font-semibold">
              <span>合計</span>
              <span className="font-ui-en">
                {formatMoney(
                  cart.cost.totalAmount.amount,
                  cart.cost.totalAmount.currencyCode
                )}
              </span>
            </div>
            <p className="mt-3 font-body-ja text-xs text-[var(--color-muted)]">
              税・送料はチェックアウト画面で確定します。
            </p>
            <a
              href={checkoutUrl(cart.checkoutUrl, Boolean(customer))}
              className="mt-8 flex w-full justify-center bg-[var(--foreground)] px-6 py-5 font-ui-en text-base font-medium text-white"
            >
              CHECKOUT
            </a>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 font-body-ja text-sm text-[#9b1b30]">
          {error}
        </p>
      ) : null}
    </main>
  );
}
