import { describe, expect, it } from "vitest";

import {
  mapShopifyProductToProduct,
  mapStorefrontHref,
} from "@/lib/shopify/products";

describe("mapShopifyProductToProduct", () => {
  it("maps variant commerce data and Shopify media into the existing product UI type", () => {
    const shopifyProduct = {
      id: "gid://shopify/Product/1",
      handle: "moya500",
      title: "MOYA500",
      description: "Description",
      productType: "テント・シェルター",
      availableForSale: true,
      featuredImage: null,
      media: {
        nodes: [
          {
            id: "gid://shopify/MediaImage/1",
            image: {
              url: "https://cdn.shopify.com/image.webp",
              altText: "MOYA500",
              width: 1600,
              height: 1600,
            },
          },
        ],
      },
      variants: {
        nodes: [
          {
            id: "gid://shopify/ProductVariant/1",
            title: "Classic Yellow",
            sku: "CDS-M50SNCY",
            availableForSale: true,
            quantityAvailable: 4,
            selectedOptions: [{ name: "Color", value: "Classic Yellow" }],
            price: { amount: "348620", currencyCode: "JPY" },
            compareAtPrice: { amount: "360000", currencyCode: "JPY" },
            image: null,
            colorCode: { value: "cy" },
            swatch: { value: "#d8b24a" },
            gallery: null,
          },
        ],
      },
      salesStatus: null,
      features: {
        references: {
          nodes: [
            {
              id: "gid://shopify/Metaobject/1",
              type: "product_feature",
              fields: [
                { key: "group", type: "single_line_text_field", value: "parts" },
                {
                  key: "title",
                  type: "single_line_text_field",
                  value: "Duraflex",
                },
                { key: "body", type: "multi_line_text_field", value: "Body" },
                {
                  key: "link_label",
                  type: "single_line_text_field",
                  value: "拡張用プロダクト一覧へ",
                },
                {
                  key: "link_url",
                  type: "url",
                  value: "https://candpluss.camp/test/products/#tent-option",
                },
              ],
            },
            {
              id: "gid://shopify/Metaobject/2",
              type: "product_feature",
              fields: [
                {
                  key: "title",
                  type: "single_line_text_field",
                  value: "ZIG STAKE 20",
                },
                { key: "body", type: "multi_line_text_field", value: "Body" },
                {
                  key: "link_label",
                  type: "single_line_text_field",
                  value: "ZIG STAKE20",
                },
                {
                  key: "link_url",
                  type: "url",
                  value: "https://candpluss.camp/products/zig-stake20",
                },
                {
                  key: "link_label_2",
                  type: "single_line_text_field",
                  value: "自在金具",
                },
                {
                  key: "link_url_2",
                  type: "url",
                  value: "https://candpluss.camp/products/aluminum-jammer-set",
                },
                {
                  key: "link_label_3",
                  type: "single_line_text_field",
                  value: "準備中の関連商品",
                },
              ],
            },
            {
              id: "gid://shopify/Metaobject/3",
              type: "product_feature",
              fields: [
                {
                  key: "group",
                  type: "single_line_text_field",
                  value: "TEST01",
                },
                {
                  key: "title",
                  type: "single_line_text_field",
                  value: "Custom group",
                },
                { key: "body", type: "multi_line_text_field", value: "Body" },
              ],
            },
          ],
        },
      },
      sizeSpec: null,
      memberOnly: { value: "true" },
      isNew: { value: "true" },
      category: {
        reference: {
          id: "gid://shopify/Metaobject/category",
          type: "product_category",
          fields: [
            {
              key: "slug",
              type: "single_line_text_field",
              value: "tent-shelter",
            },
            {
              key: "label",
              type: "single_line_text_field",
              value: "テント・シェルター",
            },
          ],
        },
      },
      optionProducts: null,
    } as Parameters<typeof mapShopifyProductToProduct>[0];

    const product = mapShopifyProductToProduct(shopifyProduct);

    expect(product.handle).toBe("moya500");
    expect(product.category).toBe("テント・シェルター");
    expect(product.categorySlug).toBe("tent-shelter");
    expect(product.price).toBe(348620);
    expect(product.priceLabel).toBe("¥348,620");
    expect(product.status).toBe("available");
    expect(product.statusLabel).toBe("NEW　SALE　会員限定");
    expect(product.memberAccess).toBe("memberOnly");
    expect(product.memberAccessConfigured).toBe(true);
    expect(product.badges).toEqual(["new"]);
    expect(product.isOnSale).toBe(true);
    expect(product.variants[0]).toMatchObject({
      id: "cy",
      shopifyVariantId: "gid://shopify/ProductVariant/1",
      availableForSale: true,
      quantityAvailable: 4,
      swatch: "#d8b24a",
    });
    expect(product.variantOptionName).toBe("COLOR");
    expect(product.variants[0].galleryMedia?.[0]).toMatchObject({
      kind: "image",
      src: "https://cdn.shopify.com/image.webp",
    });
    expect(product.features?.[0]).toMatchObject({
      group: "Parts",
      title: "Duraflex",
      links: [
        {
          label: "拡張用プロダクト一覧へ",
          href: "/products#tent-option",
        },
      ],
    });
    expect(product.features?.[1]).toMatchObject({
      title: "ZIG STAKE 20",
      links: [
        { label: "ZIG STAKE20", href: "/products/zig-stake20" },
        { label: "自在金具", href: "/products/aluminum-jammer-set" },
        { label: "準備中の関連商品", href: undefined },
      ],
    });
    expect(product.features?.[2]).toMatchObject({
      group: "TEST01",
      title: "Custom group",
    });
    expect(mapStorefrontHref("/products/zig-stake20")).toBe(
      "/products/zig-stake20"
    );
    expect(
      mapStorefrontHref(
        "https://candpluss.camp/test/products/moya500-inner-tent/?color=default"
      )
    ).toBe("/products/moya500-inner-tent");
  });

  it("keeps variant ids unique when Shopify colors collide", () => {
    const duplicateColor = {
      title: "Classic Yellow",
      sku: null,
      availableForSale: true,
      quantityAvailable: 1,
      selectedOptions: [{ name: "Color", value: "Classic Yellow" }],
      price: { amount: "1000", currencyCode: "JPY" },
      compareAtPrice: null,
      image: null,
      colorCode: null,
      swatch: { value: "#d8b24a" },
      gallery: null,
    };

    const product = mapShopifyProductToProduct({
      id: "gid://shopify/Product/2",
      handle: "option-product",
      title: "Option",
      description: "",
      productType: "テント・シェルター",
      availableForSale: true,
      featuredImage: null,
      media: { nodes: [] },
      variants: {
        nodes: [
          { ...duplicateColor, id: "gid://shopify/ProductVariant/10" },
          { ...duplicateColor, id: "gid://shopify/ProductVariant/11" },
        ],
      },
      salesStatus: null,
      features: null,
      optionProducts: null,
    } as Parameters<typeof mapShopifyProductToProduct>[0]);

    expect(product.variants.map((variant) => variant.id)).toEqual([
      "classic-yellow-10",
      "classic-yellow-11",
    ]);
  });

  it("maps SIZE options onto the variant switcher instead of forcing COLOR", () => {
    const sizeVariant = {
      sku: null,
      availableForSale: true,
      quantityAvailable: 10,
      price: { amount: "2200", currencyCode: "JPY" },
      compareAtPrice: null,
      image: null,
      colorCode: null,
      swatch: null,
      gallery: null,
    };

    const product = mapShopifyProductToProduct({
      id: "gid://shopify/Product/3",
      handle: "zig-stake",
      title: "ZIG STAKE",
      description: "",
      productType: "アクセサリー",
      availableForSale: true,
      featuredImage: null,
      media: { nodes: [] },
      variants: {
        nodes: [
          {
            ...sizeVariant,
            id: "gid://shopify/ProductVariant/20",
            title: "20cm",
            selectedOptions: [{ name: "SIZE", value: "20cm" }],
          },
          {
            ...sizeVariant,
            id: "gid://shopify/ProductVariant/30",
            title: "30cm",
            selectedOptions: [{ name: "SIZE", value: "30cm" }],
          },
        ],
      },
      salesStatus: null,
      features: null,
      optionProducts: null,
    } as Parameters<typeof mapShopifyProductToProduct>[0]);

    expect(product.variantOptionName).toBe("SIZE");
    expect(product.variants.map((variant) => variant.colorName)).toEqual([
      "20cm",
      "30cm",
    ]);
    expect(product.variants.map((variant) => variant.id)).toEqual([
      "20cm",
      "30cm",
    ]);
  });
});
