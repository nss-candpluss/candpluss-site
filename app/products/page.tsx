import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/layout/JsonLd";
import { ProductsListing } from "@/components/products/ProductsListing";
import { getListingProducts } from "@/lib/products";
import { buildBreadcrumbJsonLd, pageBreadcrumb } from "@/lib/json-ld";
import { createPageMetadata } from "@/lib/site-metadata";
import { sectionTitle62ClassName } from "@/lib/typography";

export const metadata = createPageMetadata({
  title: "Products",
  description:
    "C AND+Sの製品一覧。ドームシェルターMOYA、タープNOKUTA、燕三条製ペグZIG STAKEなど、テント・タープからアクセサリーまでご覧いただけます。",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await getListingProducts();

  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <JsonLd
        data={buildBreadcrumbJsonLd(
          pageBreadcrumb([{ name: "Products", path: "/products" }])
        )}
      />
      <Container>
        <h1 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>Products</h1>
        <ProductsListing products={products} />
      </Container>
    </main>
  );
}
