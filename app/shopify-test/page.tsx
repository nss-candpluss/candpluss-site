import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { bodyText, sectionTitle62ClassName } from "@/lib/typography";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Shopify 購入テスト",
  description: "Shopify の購入テスト用の入口です。",
  path: "/shopify-test",
  index: false,
});

/** テスト領域の入口。公開ページからは一切リンクしない */
export default function ShopifyTestPage() {
  return (
    <main
      data-header-theme="onLight"
      className="pt-[var(--product-page-title-top)] pb-[var(--container-y-bottom)]"
    >
      <Container>
        <h1
          className={`font-heading text-[var(--foreground)] ${sectionTitle62ClassName}`}
        >
          Shopify Test
        </h1>
        <p
          className={`mt-[var(--section-title-gap)] font-body-ja text-[var(--foreground)] ${bodyText(15)}`}
        >
          Shopify の購入テスト用の領域です。公開ページと同じ画面を使いますが、
          発売予定のラベルは出さず、購入まで進めます。
        </p>
        <ul className="mt-[calc(32px*var(--gap-scale-y))] flex flex-col gap-[calc(20px*var(--gap-scale-y))]">
          <li>
            <TextLink href="/shopify-test/products">商品一覧</TextLink>
          </li>
          <li>
            <TextLink href="/shopify-test/cart">カート</TextLink>
          </li>
          <li>
            <TextLink href="/shopify-test/account">アカウント</TextLink>
          </li>
        </ul>
      </Container>
    </main>
  );
}
