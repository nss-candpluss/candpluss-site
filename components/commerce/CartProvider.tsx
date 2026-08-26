"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { withBasePath } from "@/lib/paths";
import type { ShopifyCart } from "@/types/cart";

type CartContextValue = {
  cart: ShopifyCart | null;
  isLoading: boolean;
  error: string | null;
  isCartOpen: boolean;
  addLine: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function requestCart(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>
) {
  const response = await fetch(withBasePath("/api/shopify/cart"), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const payload = (await response.json()) as {
    cart?: ShopifyCart | null;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "カートの更新に失敗しました。");
  }

  return payload.cart ?? null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const nextCart = await requestCart("GET");
      setCart(nextCart);
      setError(null);
    } catch {
      // Shopify未設定の開発・静的環境では空カートとして扱う
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshCart]);

  const mutate = useCallback(
    async (
      method: "POST" | "PATCH" | "DELETE",
      body: Record<string, unknown>
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const nextCart = await requestCart(method, body);
        setCart(nextCart);
        return nextCart;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "カートの更新に失敗しました。";
        setError(message);
        throw cause;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const addLine = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      await mutate("POST", { merchandiseId, quantity });
      setIsCartOpen(true);
    },
    [mutate]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      error,
      isCartOpen,
      addLine,
      updateLine: async (lineId, quantity) => {
        await mutate("PATCH", { lineId, quantity });
      },
      removeLine: async (lineId) => {
        await mutate("DELETE", { lineId });
      },
      refreshCart,
      openCart,
      closeCart,
    }),
    [
      addLine,
      cart,
      closeCart,
      error,
      isCartOpen,
      isLoading,
      mutate,
      openCart,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
