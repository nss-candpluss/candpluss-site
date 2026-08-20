"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { withBasePath } from "@/lib/paths";

type CustomerSummary = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: { emailAddress: string } | null;
};

type CustomerContextValue = {
  customer: CustomerSummary | null;
  isLoading: boolean;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(withBasePath("/api/shopify/customer"), {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = (await response.json()) as {
          customer?: CustomerSummary | null;
        };
        return payload.customer ?? null;
      })
      .then((nextCustomer) => setCustomer(nextCustomer))
      .catch(() => {
        // 静的配信または未設定環境では未ログインとして扱う
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({ customer, isLoading }),
    [customer, isLoading]
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within CustomerProvider.");
  }
  return context;
}
