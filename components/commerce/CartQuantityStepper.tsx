"use client";

import { useState } from "react";

import {
  CART_QUANTITY_MAX,
  clampCartQuantity,
  shouldRemoveCartLineOnDecrement,
} from "@/lib/commerce/cart-quantity";
import { inputText } from "@/lib/typography";

type CartQuantityStepperProps = {
  value: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
  onRemove?: () => void;
};

export function CartQuantityStepper({
  value,
  disabled = false,
  onChange,
  onRemove,
}: CartQuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(String(value));
  }

  function commit(next: string | number) {
    const quantity = clampCartQuantity(next, value);
    setDraft(String(quantity));
    if (quantity !== value) {
      onChange(quantity);
    }
  }

  const parsedDraft = Number.parseInt(draft, 10);
  const current = Number.isFinite(parsedDraft) ? parsedDraft : value;
  const removesOnDecrement = shouldRemoveCartLineOnDecrement(value);
  const canDecrement =
    !disabled && (!removesOnDecrement || Boolean(onRemove));
  const canIncrement = !disabled && current < CART_QUANTITY_MAX;
  const buttonClassName =
    "relative size-[32px] disabled:opacity-30 before:absolute before:top-1/2 before:left-1/2 before:h-[1.5px] before:w-[12px] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-current before:content-['']";

  return (
    <div className="inline-flex items-center gap-[8px]">
      <button
        type="button"
        aria-label={removesOnDecrement && onRemove ? "削除" : "数量を1減らす"}
        disabled={!canDecrement}
        onClick={() => {
          if (removesOnDecrement) {
            onRemove?.();
            return;
          }
          commit(current - 1);
        }}
        className={buttonClassName}
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label="数量"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={`size-[36px] border border-[#ccc] bg-white p-0 text-center font-ui-en ${inputText(16)} outline-none focus-visible:border-[var(--foreground)] disabled:opacity-50`}
      />
      <button
        type="button"
        aria-label="数量を1増やす"
        disabled={!canIncrement}
        onClick={() => commit(current + 1)}
        className={`${buttonClassName} after:absolute after:top-1/2 after:left-1/2 after:h-[12px] after:w-[1.5px] after:-translate-x-1/2 after:-translate-y-1/2 after:bg-current after:content-['']`}
      />
    </div>
  );
}
