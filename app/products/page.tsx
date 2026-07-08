import { Container } from "@/components/ui/Container";
import { ProductsListing } from "@/components/products/ProductsListing";
import { getListingProducts } from "@/lib/products";
import { sectionTitle62ClassName } from "@/lib/typography";

export default async function ProductsPage() {
  const products = await getListingProducts();

  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <h1 className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}>Products</h1>
        <ProductsListing products={products} />
      </Container>
    </main>
  );
}
