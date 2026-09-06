"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CartLineThumbnail } from "@/components/commerce/CartLineThumbnail";
import { CartQuantityStepper } from "@/components/commerce/CartQuantityStepper";
import { CartRemoveButton } from "@/components/commerce/CartRemoveButton";
import { useCart } from "@/components/commerce/CartProvider";
import { useCustomer } from "@/components/commerce/CustomerProvider";
import {
  COMMERCE_DIALOG_OVERLAY_CLASS,
  COMMERCE_DIALOG_PANEL_CLASS,
} from "@/components/commerce/dialog-panel";
import { shopifyCheckoutUrl } from "@/lib/commerce/checkout-url";
import {
  startBoundLenis,
  stopBoundLenis,
} from "@/lib/motion/setup-lenis-scroll-trigger";
import { uiText } from "@/lib/typography";

const MOTION_MS = 150;

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CartDialogView({ onDismiss }: { onDismiss: () => void }) {
  const titleId = useId();
  const { cart, error, isLoading, removeLine, updateLine } = useCart();
  const { customer } = useCustomer();
  const [phase, setPhase] = useState<"in" | "out">("in");
  const closingRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;

    if (prefersReducedMotion()) {
      onDismiss();
      return;
    }

    setPhase("out");
  }, [onDismiss]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  useEffect(() => {
    if (phase !== "out") {
      return;
    }

    const timeoutId = window.setTimeout(onDismiss, MOTION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [onDismiss, phase]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
    stopBoundLenis();

    function preventBackgroundScroll(event: WheelEvent | TouchEvent) {
      const scroller = scrollerRef.current;
      if (
        scroller &&
        event.target instanceof Node &&
        scroller.contains(event.target)
      ) {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      startBoundLenis();
      window.removeEventListener("wheel", preventBackgroundScroll);
      window.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, []);

  const motionClassName = phase === "out" ? "is-out" : "is-in";
  const lines = cart?.lines.nodes ?? [];
  const checkoutHref = cart?.checkoutUrl
    ? shopifyCheckoutUrl(cart.checkoutUrl, Boolean(customer))
    : null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="閉じる"
        onClick={requestClose}
        className={`${COMMERCE_DIALOG_OVERLAY_CLASS} ${motionClassName}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${COMMERCE_DIALOG_PANEL_CLASS} ${motionClassName}`}
      >
        <button
          type="button"
          aria-label="閉じる"
          onClick={requestClose}
          className="absolute top-[16px] right-[16px] z-10 flex size-[40px] shrink-0 items-center justify-center rounded-full border border-[#ccc] bg-white [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" className="size-[12px]">
            <path
              d="M1 1L11 11M11 1L1 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        <div className="flex min-h-[40px] shrink-0 items-center pr-[40px]">
          <h2
            id={titleId}
            className={`font-body-ja font-semibold ${uiText(20)}`}
          >
            カート
          </h2>
        </div>

        <div
          ref={scrollerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading && !lines.length ? (
            <p className={`mt-[24px] font-body-ja ${uiText(16)}`}>
              カートを読み込んでいます。
            </p>
          ) : null}

          {!isLoading && !lines.length ? (
            <div className="mt-[24px]">
              <p
                className={`font-body-ja text-[var(--color-muted)] ${uiText(16)}`}
              >
                カートに商品はありません。
              </p>
              <Link
                href="/products"
                onClick={onDismiss}
                className={`mt-[16px] inline-flex font-ui-en ${uiText(16)}`}
              >
                VIEW PRODUCTS
              </Link>
            </div>
          ) : null}

          {lines.length ? (
            <ul className="mt-[clamp(20px,calc(24px*var(--gap-scale-y)),24px)] divide-y divide-[var(--color-divider)]">
              {lines.map((line) => {
                const variantTitle = line.merchandise.title;
                const showVariant = Boolean(
                  variantTitle && variantTitle !== "Default Title"
                );
                const category = line.merchandise.product.productType?.trim();

                return (
                  <li
                    key={line.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[clamp(16px,calc(24px*var(--gap-scale-x)),24px)] py-[var(--cart-inline-pad)] first:pt-0"
                  >
                    <CartLineThumbnail
                      src={line.merchandise.image?.url}
                      alt={
                        line.merchandise.image?.altText ||
                        line.merchandise.product.title
                      }
                      sizes="(max-width: 1024px) 40vw, 220px"
                    />

                    <div className="min-w-0">
                      {category ? (
                        <p
                          className={`font-body-ja text-[var(--color-muted)] ${uiText(14)}`}
                        >
                          {category}
                        </p>
                      ) : null}
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        onClick={onDismiss}
                        className={`block font-body-ja font-semibold ${uiText(18)} ${
                          category ? "mt-[8px]" : ""
                        }`}
                      >
                        {line.merchandise.product.title}
                      </Link>
                      {showVariant ? (
                        <p
                          className={`font-ui-en text-[var(--color-muted)] ${uiText(14)} ${
                            category || line.merchandise.product.title
                              ? "mt-[8px]"
                              : ""
                          }`}
                        >
                          {variantTitle}
                        </p>
                      ) : null}
                      <p
                        className={`inline-flex items-baseline gap-[4px] ${
                          category ||
                          line.merchandise.product.title ||
                          showVariant
                            ? "mt-[16px]"
                            : ""
                        }`}
                      >
                        <span className={`font-ui-en ${uiText(14)}`}>
                          {formatMoney(
                            line.merchandise.price.amount,
                            line.merchandise.price.currencyCode
                          )}
                        </span>
                        <span className={`font-body-ja ${uiText(11)}`}>
                          税込
                        </span>
                      </p>

                      <div className="mt-[16px] flex flex-nowrap items-center gap-[16px]">
                        <CartQuantityStepper
                          value={line.quantity}
                          disabled={isLoading}
                          onChange={(quantity) =>
                            void updateLine(line.id, quantity)
                          }
                          onRemove={() => void removeLine(line.id)}
                        />
                        <CartRemoveButton
                          disabled={isLoading}
                          onClick={() => void removeLine(line.id)}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className="mt-[clamp(24px,calc(28px*var(--gap-scale-y)),28px)] shrink-0">
            <div className={`flex flex-col gap-[16px] font-body-ja font-semibold ${uiText(16)}`}>
              <div className="flex items-baseline justify-between gap-[8px]">
                <span>小計</span>
                <span className="inline-flex items-baseline justify-end gap-[4px]">
                  <span className="font-ui-en">
                    {formatMoney(
                      cart?.cost.subtotalAmount.amount ?? "0",
                      cart?.cost.subtotalAmount.currencyCode ?? "JPY"
                    )}
                  </span>
                  <span className={`font-body-ja ${uiText(11)} font-normal`}>
                    税込
                  </span>
                </span>
              </div>
              <p className={`text-right ${uiText(14)} font-normal`}>
                配送料はご購入画面で確定します
              </p>
            </div>
            {checkoutHref ? (
              <a
                href={checkoutHref}
                className={`mt-[20px] flex w-full items-center justify-center bg-[var(--foreground)] px-[12px] py-[16px] text-center font-body-ja font-medium text-white min-[1025px]:py-[clamp(16px,2.2vh,24px)] ${uiText(16)}`}
              >
                ご購入の手続き
              </a>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className={`mt-[12px] shrink-0 font-body-ja text-[#9b1b30] ${uiText(14)}`}
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CartDialog() {
  const { isCartOpen, closeCart } = useCart();

  if (!isCartOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <CartDialogView onDismiss={closeCart} />,
    document.body
  );
}
