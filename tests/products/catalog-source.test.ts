import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchAllProducts = vi.fn();
const fetchProductByHandle = vi.fn();

vi.mock("@/lib/shopify/products", () => ({
  fetchAllProducts,
  fetchProductByHandle,
}));

function shopifyProduct(handle: string, categorySlug = "tent-shelter") {
  return {
    handle,
    id: handle,
    name: handle.toUpperCase(),
    categorySlug,
    price: 1000,
    description: "",
    variants: [],
    status: "available",
  };
}

describe("product catalog source", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchAllProducts.mockReset();
    fetchProductByHandle.mockReset();
  });

  it("serves products from Shopify without a local fallback", async () => {
    fetchAllProducts.mockResolvedValue([shopifyProduct("moya500")]);

    const { getAllProducts } = await import("@/lib/products");

    expect((await getAllProducts()).map((product) => product.handle)).toEqual([
      "moya500",
    ]);
  });

  // ローカル catalog を廃止したため、0 件を通すと商品が空のサイトが黙って公開される
  it("fails instead of serving an empty catalog", async () => {
    fetchAllProducts.mockResolvedValue([]);

    const { getAllProducts, getListingProducts } = await import(
      "@/lib/products"
    );

    await expect(getAllProducts()).rejects.toThrow(/商品を 1 件も取得できません/);
    await expect(getListingProducts()).rejects.toThrow(
      /商品を 1 件も取得できません/
    );
  });

  it("returns null for handles that Shopify does not have", async () => {
    fetchProductByHandle.mockResolvedValue(null);

    const { getProductByHandle } = await import("@/lib/products");

    expect(await getProductByHandle("deleted-product")).toBeNull();
    expect(fetchProductByHandle).toHaveBeenCalledWith("deleted-product");
  });
});
