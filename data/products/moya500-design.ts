import { products } from "@/data/products";
import type { Product } from "@/types/product";

/**
 * MOYA500 商品詳細のデザイン調整用サンドボックス。
 * - 一覧・専用ルートからのみ参照する（本番 `products` 配列には載せない）
 * - 画像アセットは本番 moya500 を流用する
 */
export const MOYA500_DESIGN_HANDLE = "moya500-design";

/** Feature / ギャラリー用アセットの参照先（本番商品） */
export const MOYA500_DESIGN_ASSET_HANDLE = "moya500";

const DESIGN_COLOR_NAMES: Record<string, string> = {
  cy: "Classic Yellow",
  gb: "Gold Beige",
  sg: "Shadow Gray",
};

function createMoya500DesignProduct(): Product {
  const moya500 = products.find((product) => product.handle === "moya500");

  if (!moya500) {
    throw new Error("MOYA500 product data is required for the design sandbox page.");
  }

  return {
    ...moya500,
    id: MOYA500_DESIGN_HANDLE,
    handle: MOYA500_DESIGN_HANDLE,
    title: "MOYA500（デザインテスト）",
    variants: moya500.variants.map((variant) => ({
      ...variant,
      colorName:
        DESIGN_COLOR_NAMES[variant.colorCode ?? variant.id] ?? variant.colorName,
    })),
  };
}

export const moya500DesignProduct = createMoya500DesignProduct();
