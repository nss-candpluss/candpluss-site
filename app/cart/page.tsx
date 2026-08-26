"use client";

import Link from "next/link";

import { CartLineThumbnail } from "@/components/commerce/CartLineThumbnail";
import { CartQuantityStepper } from "@/components/commerce/CartQuantityStepper";
import { CartRemoveButton } from "@/components/commerce/CartRemoveButton";
import { useCart } from "@/components/commerce/CartProvider";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import { shopifyCheckoutUrl } from "@/lib/commerce/checkout-url";
import { uiTextRange } from "@/lib/typography";

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
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
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-6 py-6 min-[768px]:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <CartLineThumbnail
                  src={line.merchandise.image?.url}
                  alt={
                    line.merchandise.image?.altText ||
                    line.merchandise.product.title
                  }
                  sizes="(min-width: 768px) 220px, 40vw"
                />

                <div className="min-w-0">
                  <Link
                    href={`/products/${line.merchandise.product.handle}`}
                    className={`block font-body-ja font-semibold ${uiTextRange("16-18")}`}
                  >
                    {line.merchandise.product.title}
                  </Link>
                  {line.merchandise.title !== "Default Title" ? (
                    <p
                      className={`mt-2 font-ui-en text-[var(--color-muted)] ${uiTextRange("13-14")}`}
                    >
                      {line.merchandise.title}
                    </p>
                  ) : null}
                  <p className="mt-4 font-ui-en text-sm">
                    {formatMoney(
                      line.merchandise.price.amount,
                      line.merchandise.price.currencyCode
                    )}
                  </p>

                  <div className="mt-5 flex flex-nowrap items-center gap-4">
                    <CartQuantityStepper
                      value={line.quantity}
                      disabled={isLoading}
                      onChange={(quantity) => void updateLine(line.id, quantity)}
                      onRemove={() => void removeLine(line.id)}
                    />
                    <CartRemoveButton
                      disabled={isLoading}
                      onClick={() => void removeLine(line.id)}
                    />
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
              href={shopifyCheckoutUrl(cart.checkoutUrl, Boolean(customer))}
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
