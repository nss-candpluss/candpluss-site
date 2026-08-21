import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";

if (!domain || !token) {
  console.error(
    "SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PRIVATE_TOKEN are required."
  );
  process.exit(1);
}

const query = `
  query VerifyProducts {
    products(first: 100) {
      nodes {
        handle
        title
        availableForSale
        variants(first: 100) {
          nodes {
            id
            title
            sku
            availableForSale
            colorCode: metafield(namespace: "custom", key: "color_code") { value }
            swatch: metafield(namespace: "custom", key: "swatch") { value }
            gallery: metafield(namespace: "custom", key: "gallery") {
              references(first: 100) { nodes { __typename } }
            }
          }
        }
        features: metafield(namespace: "custom", key: "features") {
          references(first: 100) {
            nodes {
              __typename
              ... on Metaobject {
                fields { key value }
              }
            }
          }
        }
        sizeSpec: metafield(namespace: "custom", key: "size_spec") {
          reference { __typename }
        }
        salesStatus: metafield(namespace: "custom", key: "sales_status") {
          reference {
            __typename
            ... on Metaobject { fields { key value } }
          }
        }
        memberOnly: metafield(namespace: "custom", key: "member_only") { value }
        isNew: metafield(namespace: "custom", key: "is_new") { value }
        category: metafield(namespace: "custom", key: "category") {
          reference {
            __typename
            ... on Metaobject { fields { key value } }
          }
        }
        optionProducts: metafield(namespace: "custom", key: "option_products") {
          references(first: 100) { nodes { __typename } }
        }
      }
    }
  }
`;

const response = await fetch(
  `https://${domain}/api/${version}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query }),
  }
);
const payload = await response.json();

if (!response.ok || payload.errors?.length) {
  console.error(
    payload.errors?.map((error) => error.message).join("\n") ||
      `Shopify returned ${response.status}.`
  );
  process.exit(1);
}

const products = payload.data.products.nodes;
console.log(`Connected to ${domain}: ${products.length} products visible.`);

for (const product of products) {
  const missing = [];
  if (!product.variants.nodes.length) missing.push("variants");
  if (!product.features?.references?.nodes.length) missing.push("features");
  if (!product.sizeSpec?.reference) missing.push("size_spec");
  if (!product.salesStatus?.reference) missing.push("sales_status");
  if (!product.memberOnly?.value) missing.push("member_only");
  if (!product.category?.reference) missing.push("category");
  if (!product.optionProducts?.references?.nodes.length) {
    missing.push("option_products");
  }

  const variantIssues = product.variants.nodes.flatMap((variant) => {
    const issues = [];
    if (!variant.sku) issues.push("sku");
    if (!variant.colorCode?.value) issues.push("color_code");
    if (!variant.swatch?.value) issues.push("swatch");
    if (!variant.gallery?.references?.nodes.length) issues.push("gallery");
    return issues.length ? [`${variant.title}: ${issues.join(", ")}`] : [];
  });

  const featureIssues = (product.features?.references?.nodes ?? []).flatMap(
    (node, index) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((field) => [field.key, field.value])
      );
      const issues = [];
      const group = fields.group?.trim();
      if (
        group &&
        !["Fabric", "Flame", "Structure", "Parts"].includes(group)
      ) {
        issues.push(`group "${group}"`);
      }
      const linkKeys = [
        ["link_label", "link_url", "link 1"],
        ["link_label_1", "link_url_1", "link_1"],
        ["link_label_2", "link_url_2", "link 2"],
        ["link_label_3", "link_url_3", "link 3"],
        ["link_label_4", "link_url_4", "link 4"],
        ["link_label_5", "link_url_5", "link 5"],
      ];
      for (const [labelKey, urlKey, name] of linkKeys) {
        if (!fields[labelKey] && fields[urlKey]) {
          issues.push(`${name} label missing`);
        }
      }
      return issues.length
        ? [`#${index + 1} ${fields.title || "untitled"}: ${issues.join(", ")}`]
        : [];
    }
  );

  console.log(
    [
      `${product.handle}: ${product.variants.nodes.length} variants`,
      `${product.features?.references?.nodes.length ?? 0} features`,
      `sales status [${
        product.salesStatus?.reference?.fields?.find(
          (field) => field.key === "status"
        )?.value ?? "missing"
      }]`,
      `member only [${product.memberOnly?.value ?? "missing"}]`,
      `NEW [${product.isNew?.value ?? "false"}]`,
      `category [${
        product.category?.reference?.fields?.find((field) => field.key === "slug")
          ?.value ?? "missing"
      }]`,
      `galleries [${product.variants.nodes
        .map(
          (variant) =>
            `${variant.title}: ${variant.gallery?.references?.nodes.length ?? 0} media / ${
              variant.availableForSale ? "available" : "unavailable"
            }`
        )
        .join(", ")}]`,
      missing.length ? `product fields missing [${missing.join(", ")}]` : "",
      variantIssues.length ? `variant fields missing [${variantIssues.join("; ")}]` : "",
      featureIssues.length ? `feature issues [${featureIssues.join("; ")}]` : "",
    ]
      .filter(Boolean)
      .join(" | ")
  );
}

if (!products.some((product) => product.handle === "moya500")) {
  console.error("MOYA500 with handle 'moya500' is not published to Headless.");
  process.exit(1);
}
