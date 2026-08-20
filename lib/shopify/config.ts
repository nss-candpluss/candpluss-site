import "server-only";

import { z } from "zod";

const shopifyConfigSchema = z.object({
  storeDomain: z
    .string()
    .min(1)
    .transform((value) => value.replace(/^https?:\/\//, "").replace(/\/$/, "")),
  privateToken: z.string().min(1),
  apiVersion: z.string().regex(/^\d{4}-\d{2}$/),
});

export type ShopifyConfig = z.infer<typeof shopifyConfigSchema>;

export function isShopifyConfigured() {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN &&
      process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
  );
}

export function getShopifyConfig(): ShopifyConfig {
  const parsed = shopifyConfigSchema.safeParse({
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
    privateToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07",
  });

  if (!parsed.success) {
    throw new Error(
      `Shopify configuration is incomplete: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`
    );
  }

  return parsed.data;
}
