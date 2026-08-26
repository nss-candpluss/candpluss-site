export type CartMoney = {
  amount: string;
  currencyCode: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: CartMoney };
  merchandise: {
    id: string;
    title: string;
    sku?: string | null;
    availableForSale: boolean;
    image?: {
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    product: { handle: string; title: string; productType?: string | null };
    price: CartMoney;
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: CartMoney;
    totalAmount: CartMoney;
  };
  lines: { nodes: CartLine[] };
};
