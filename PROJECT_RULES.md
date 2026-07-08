このプロジェクトは C AND+S のブランドサイト兼EC導線サイトです。

【基本方針】
- ブランドサイトは Next.js で構築する
- EC基盤は Shopify を利用する
- checkout は Shopify を使う
- 商品詳細ページは Next.js 側で実装する
- カートは Next.js 側で実装する
- 顧客アカウントは Shopify Customer Account を利用する
- 会員登録 = Shopify会員登録 とする
- account/login, account などは自社ドメイン配下で見せる想定
- 顧客データ、購入履歴、発送状況、会員情報のソースは Shopify
- UIは C AND+S のブランドトーンで実装する

【デザイン方針】
- 上質
- 静けさ
- 余白
- 洗練
- 機能美
- 過度な装飾は禁止
- タイポグラフィと余白を重視する

【技術スタック】
- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel
- Shopify Storefront API

【商品ステータス】
- preorder → 先行予約：会員限定
- new → NEW
- normal → 表示なし
- waiting → 入荷待ち
- waiting + reservableForMembers → 入荷待ち / 会員限定で予約注文が可能です
- ending → 廃盤：在庫限り
- ended → 販売終了

【会員表示】
- ログイン済み → ユーザーアイコン表示
- 未ログイン → LOGIN ボタン表示

【開発ルール】
- Figmaをベースに実装する
- ただしブラウザ上での見え方を優先する
- 可読性を優先する
- 不要な抽象化はしない
- まずはTOPページを完成させる
- 1セクションずつ実装する
- **共通・横断ファイルを変更したら、影響を受けるページ全体を必ず確認してから完了とする**（motion 基盤に限らない）
  - 例: `layout.tsx` / `globals.css` / `components/layout/` / `lib/` / 共通 UI
  - 詳細: `.cursor/rules/cross-page-impact-check.mdc`

【スクロールアニメーション（Lenis + ScrollTrigger）】

- 共通基盤: `components/motion/SmoothScrollProvider.tsx` + `lib/motion/`
- ScrollTrigger を使うページは **必ず** 以下を守る（省略禁止）
  1. `scroller: getScrollTriggerScroller()` を全 ScrollTrigger に指定（`lib/motion/scroll-trigger-scroller.ts`）
  2. `subscribeMotionReady` で Lenis 準備後に ScrollTrigger を構築・再構築（`lib/motion/motion-ready.ts`）
- 上記に加え、横断確認ルール（`.cursor/rules/cross-page-impact-check.mdc`）に従う
- ScrollTrigger 詳細: `.cursor/rules/scroll-trigger-lenis.mdc`

【画像アセット管理】

画像ファイルは `public/images/` 配下に、ページ・用途単位で格納する。

■ フォルダ構成

public/
└── images/
    ├── common/     … OGP、共通ビジュアルなど
    ├── hero/       … TOP Hero 専用
    ├── home/       … TOP 導線・セクション用
    ├── products/   … 商品画像
    ├── concept/    … Concept ページ用
    ├── quality/    … Quality ページ用
    └── support/    … Support ページ用

■ 運用ルール

- TOP 専用画像 → `/images/home/`
- Hero 画像 → `/images/hero/`
- 商品画像 → `/images/products/`
- 共通画像（OGP 等） → `/images/common/`
- ページ専用画像 → 各ページフォルダへ格納
- 画像パスは `data/` または各セクションのデータファイルで一元管理する
- 実装側では `/images/...` の絶対パスを参照する

■ 命名ルール

- 英小文字のみ
- kebab-case
- スペース禁止
- 日本語禁止
- 画像用途が分かる名前にする
- `page-purpose-name` の順で命名する

■ 命名例

| 用途 | ファイル名 |
|------|------------|
| TOP Hero 背景 | `hero-bg.webp` |
| TOP Hero 前景（透過） | `hero-foreground.webp` |
| TOP Hero タイトル SVG | `hero-title.svg` |
| TOP Hero OUR BEGINNING | `our-beginning.webp` |
| TOP 導線カード（Products） | `home-link-products.webp` |
| TOP 導線カード（Quality） | `home-link-quality.webp` |
| 商品ギャラリー | `product-moya500-gallery-01.webp` |
| Quality セクション | `quality-material-section.webp` |

■ フォーマット

- 写真・ビジュアルは `.webp` を基本とする
- SVG ロゴ・アイコンは `public/assets/` を使用する（`public/images/` には置かない）

■ 画像表示ルール

- 固定アスペクト比で表示する写真は `MaskedImage` コンポーネントを使う
- 元画像のアスペクト比が変わっても、表示枠（4:3 / 4:5 など）と見た目が変わらないようにする
- `MaskedImage` は `object-cover` + CSS マスク（`.image-mask-frame`）で枠内にクリップする
- 画面全体を覆うフルブリード画像（Hero 背景など）は例外とし、従来どおり `fill` + `object-cover` を使う