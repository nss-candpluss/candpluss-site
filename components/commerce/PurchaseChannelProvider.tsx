"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

import {
  resolvePurchaseChannel,
  type PurchaseChannel,
} from "@/lib/commerce/purchase-channel";

const PurchaseChannelContext = createContext<PurchaseChannel>("public");

/**
 * 購入系統を URL から決めて配下に配る。Header はルートレイアウトにあり
 * ページのツリーの外側なので、ページから prop で渡すことができない。
 */
export function PurchaseChannelProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const channel = useMemo(() => resolvePurchaseChannel(pathname), [pathname]);

  return (
    <PurchaseChannelContext.Provider value={channel}>
      {children}
    </PurchaseChannelContext.Provider>
  );
}

export function usePurchaseChannel(): PurchaseChannel {
  return useContext(PurchaseChannelContext);
}
