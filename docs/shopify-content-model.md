# Shopify content model

Storefront API version: `2026-07`

商品登録の操作手順は [shopify-product-registration.md](./shopify-product-registration.md) を参照してください。このファイルはフィールド定義の技術メモです。

## Product fields

Use Shopify standard fields for `handle`, title, description, product type,
featured media, product media, variants, SKU, price, availability, inventory,
and collections.

Create the following product metafield definitions in namespace `custom`.

| Key | Type | Purpose |
| --- | --- | --- |
| `sales_status` | `metaobject_reference` | Status label, color, and purchase policy |
| `category` | `metaobject_reference` | Site listing category. Select from predefined `product_category` entries |
| `features` | `list.metaobject_reference` | Ordered Feature cards |
| `size_spec` | `metaobject_reference` | Size & Spec content |
| `option_products` | `list.product_reference` | Related option products |
| `downloads` | `list.file_reference` | Manuals and other downloads |
| `member_only` | `boolean` | `true` for member-only sales, `false` for public sales. Shopify Flow sets new products to `false`. Unset products cannot be purchased. |
| `is_new` | `boolean` | Controls the optional `NEW` badge. Unset values hide the badge. |

The product description may start with `{title}` to render a heading above
the body, matching Feature item titles. The braces are not shown on the site.

## Variant fields

Create the following product variant metafield definitions.

| Key | Type | Purpose |
| --- | --- | --- |
| `color_code` | `single_line_text_field` | Stable UI color key, for example `cy` |
| `swatch` | `color` | Color chip fallback |
| `gallery` | `list.file_reference` | Ordered variant-specific images and videos |

If `gallery` is empty, the storefront falls back to the variant image and then
the product media list.

## Metaobject definitions

### `product_sales_status`

- `admin_name`: single line text (admin display name)
- `product`: product reference
- `status`: single line text; one of `available`, `comingSoon`, `waiting`,
  `preorder`, `ending`, or `ended`
- `label`: single line text
- `color`: color

### `product_category`

- `admin_name`: single line text (admin display name)
- `slug`: single line text, for example `tent-shelter` or `tent-option`
- `label`: single line text shown on the site, product cards, and breadcrumbs

Create one entry per site category and publish to Headless. Product metafield
`custom.category` references the selected entry. If unset, the storefront falls
back to Shopify's standard product type.

Adding a category requires the same `label` and `slug` in
`types/product.ts` `productCategories`. Otherwise listing tabs and breadcrumbs
will not match the Shopify option.

### `product_feature`

- `admin_name`: single line text (admin display name)
- `product`: product reference
- `group`: single line text shown as the Feature mid-title. Any value is
  allowed. `Fabric`, `Flame`, `Structure`, and `Parts` are normalized
  case-insensitively. Empty values hide the mid-title.
- `title`: single line text
- `body`: multi-line text
- `media`: list of file references
- `link_label` / `link_url`: first optional text link
- `link_label_2` / `link_url_2` … `link_label_5` / `link_url_5`: additional
  optional text links

The first media item is displayed directly. Multiple images use the existing
carousel. A video item is rendered as autoplay, muted, looped media.

Each numbered pair is shown when a label is present. A missing URL still
renders the arrow and label, but it is not clickable. Empty labels are
skipped. `admin_name` is the admin list label for the Feature entry and is
not shown on the site.

`link_url` should be a full URL. The storefront converts `/products...` paths,
including `https://candpluss.camp/test/products/...`, into site-relative hrefs.
`group` is matched case-insensitively (`Parts` and `parts` both work).

### `product_size_spec`

- `name`: single line text (admin display name)
- `product`: product reference
- `groups`: list of `product_spec_group` references
- `notes`: list of single line text
- `drawing`: file reference
- `downloads`: list of file references

### `product_spec_group`

- `admin_name`: single line text (admin display name)
- `product`: product reference
- `label`: single line text
- `value`: multi-line text

## MOYA500 registration checklist

1. Keep the product handle as `moya500`.
2. Create the Classic Yellow, Gold Beige, and Shadow Gray variants.
3. Set each variant SKU, `color_code`, `swatch`, price, and inventory.
4. Add the ordered 20-item Classic Yellow gallery, including the movie.
5. Add Gold Beige and Shadow Gray gallery media.
6. Create Feature entries in display order and connect them through
   `custom.features`.
7. Create Size & Spec groups and connect `custom.size_spec`.
8. Connect related products through `custom.option_products`.
9. Set `custom.member_only` to `false` or `true`. New products receive `false`
   from Shopify Flow; unset products cannot be purchased.
10. Set `custom.is_new` to `true` only when the NEW badge should display.
11. Set `custom.category` to a `product_category` entry.
12. Publish the product, metaobjects, and referenced files to the Headless sales
   channel.

## Environment variables

Use `PRODUCT_SOURCE=shopify` to overlay Shopify products onto the local catalog.
Handles that exist in Shopify replace local data. Unmigrated local products remain
visible.

```text
PRODUCT_SOURCE=local
SHOPIFY_STORE_DOMAIN=example.myshopify.com
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=
NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=2026-07
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET=
SHOPIFY_CUSTOMER_ACCOUNT_URL=
SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL=
SESSION_SECRET=
```
