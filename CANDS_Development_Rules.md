このファイルは C AND+S の実装ルールを定義する設計書です。

現在動作しているソースコードを、このファイルを書き換えたことを理由に一括修正しないでください。

今後新しく作成するページ・コンポーネントは、このルールを優先して実装してください。

ルールと異なる実装が必要な場合は、勝手に変更せず理由を提示してください。

# C AND+S Development Rules

Version: 1.0

---

# 1. Development Philosophy

C AND+Sでは

・再利用性

・保守性

・Shopifyとの親和性

・共通ルールの維持

を最優先します。

動いているコードを不用意に書き換えないこと。

新しい実装は既存ルールを優先します。

---

# 2. Project Structure

基本構成

app/
components/
sections/
data/
lib/
types/
docs/

public/

assets/
images/

---

役割

app/

ページ

components/

再利用コンポーネント

sections/

ページ専用コンポーネント

data/

表示データ

lib/

共通処理

types/

型定義

docs/

ルール管理

---

# 3. Data Rules

表示データは data/ に集約します。

ハードコードは禁止。

例

home.ts

products.ts

news.ts

support.ts

---

# 4. Component Rules

1コンポーネント = 1責務

共通利用できるものは components/

ページ専用は sections/

へ配置します。

---

コンポーネントは

・小さく

・再利用しやすく

設計してください。

---

# 5. Shopify Ready Rules

すべてのデータ構造は

Shopifyへ置き換えやすい構造で実装します。

基本構造

Product

↓

Variant

↓

Gallery

↓

Images

---

ProductGallery内で

商品名

handle

による分岐は禁止。

gallery.type

のみで制御してください。

---

Product取得は

将来的に

Shopify API

へ置き換えられる構造にしてください。

---

# 6. Product Rules

商品データは

products.ts

で管理します。

商品画像

カラー

価格

状態

なども

data/

へ集約してください。

---

商品詳細ページでは

ProductGallery

ProductStatusLabel

ProductColorChips

など

コンポーネントを分割してください。

---

# 7. Gallery Rules

通常商品

gallery

↓

variants

↓

images

---

OPEN/CLOSE商品

gallery

↓

variants

↓

groups

↓

images

OPEN

CLOSE

は

groups

で管理してください。

---

画像切替は

無限ループ

とします。

最後

↓

最初

最初

↓

最後

へ戻ります。

---

# 8. Typography Rules

Typographyは

lib/typography.ts

を使用してください。

---

UIテキスト

font-size = line-height

---

本文

line-height = font-size × 1.75

---

Text Scaleは

font-size

line-height

両方へ適用してください。

---

# 9. Scale Rules

Text Scale

文字

アイコン

---

Layout Scale

レイアウト

余白

位置

---

Gap Scale

gap

カード間

カラム間

Header Navigation

---

既存Scaleを優先してください。

例外のみ個別対応します。

---

# 10. Layout Rules

左右余白は

--container-x

を使用してください。

Headerのみ

Desktop

--container-x

Mobile

24px固定

---

# 11. Animation Rules

GSAP

ScrollTrigger

使用可。

ただし

ブランドトーンを優先してください。

派手な演出は禁止。

---

# 12. Coding Rules

TypeScript

型定義を使用してください。

any

は原則禁止。

---

TailwindCSS

共通ルールを優先してください。

動的クラス生成は禁止。

---

同じUIを複数作らないこと。

---

# 13. Cursor Rules

新しい実装では

・既存コンポーネントの再利用

・共通ルール

を最優先してください。

---

ルールが存在する場合

勝手に新ルールを作らないこと。

---

例外が必要な場合

理由を提示してください。

---

# 14. Lint Rules

作業完了時は

必ず

npm run lint

npm run build

を実行してください。

---

エラー

Warning

がある場合は報告してください。

---

# 15. Rules Update

今後

新しいルールが決まった場合は

その場限りで終わらせず

docs/

内の

Development Rules

Brand Design Rules

Asset Naming Rules

Content Rules

の該当ファイルへ反映してください。

---

# 16. Future Pages

現在予定しているページ

TOP

PRODUCTS

PRODUCT DETAIL

CONCEPT

QUALITY

SUPPORT

MEMBERSHIP

SEARCH

ACCOUNT

・ログイン

・新規会員登録

・マイページ

・会員情報編集

・住所管理

・購入履歴

・注文詳細

・発送状況

・パスワード再設定

CART

・カート

・注文確認

・注文完了

・決済失敗

NEWS

NEWS DETAIL

ショッピングガイド

お問い合わせ

特定商取引法に基づく表記

利用規約

プライバシーポリシー

---

# 17. Important

このルールを理由に

現在正常に動作しているページを

一括修正しないでください。

ルールは

今後作成するページ

今後修正するコンポーネント

から順次適用してください。

既存コードは

必要になったタイミングで

少しずつ共通ルールへ統一していきます。
