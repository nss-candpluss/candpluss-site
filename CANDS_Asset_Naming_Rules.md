このファイルは C AND+S のアセット命名規則・フォルダ構成・管理ルールを定義する設計書です。

現在動作しているソースコードを、このファイルを書き換えたことを理由に一括修正しないでください。

今後追加する画像・SVG・ロゴ・動画・アセットは、このルールに従って管理してください。

既存アセットについても、大きな仕様変更時やリファクタリング時に順次統一してください。

# C AND+S Asset Naming Rules

Version: 1.0

---

# 1. Purpose

すべてのアセットは

・誰が見ても分かる

・迷わない

・Shopifyとの連携を考慮する

ことを目的とします。

---

# 2. Naming Rules

基本ルール

・英数字小文字

・kebab-case

・半角英数字のみ

・スペース禁止

・日本語禁止

例

home-support.webp

icon-gallery-prev.svg

logo-candpluss.svg

---

# 3. Folder Structure

public/

assets/

icons/

logos/

images/

hero/

home/

news/

products/

support/

---

商品画像は

products/

の中で商品ごとにフォルダを作成します。

例

products/

moya500/

nokuta/

zig-stake20/

---

# 4. Icons

格納場所

public/assets/icons/

命名

icon-○○.svg

例

icon-arrow-right.svg

icon-gallery-prev.svg

icon-gallery-next.svg

icon-sns-facebook.svg

icon-sns-instagram.svg

icon-sns-youtube.svg

---

# 5. Logos

格納場所

public/assets/logos/

命名

logo-○○.svg

例

logo-candpluss.svg

logo-candpluss-tagline.svg

logo-moya500.svg

---

# 6. Home Images

格納場所

public/images/home/

命名

home-○○.webp

例

home-support.webp

home-link-labo.webp

home-products-link.webp

home-quality-link.webp

home-link-moya500.webp

home-link-nokuta.webp

home-link-zigstake.webp

---

# 7. Hero Images

格納場所

public/images/hero/

例

hero-bg.webp

hero-foreground.webp

hero-title.svg

---

# 8. News Images

格納場所

public/images/news/

命名

news-001.webp

news-002.webp

news-003.webp

...

3桁連番で管理します。

---

# 9. Product Images

商品ごとにフォルダを分けます。

例

public/images/products/

moya500/

nokuta/

zig-stake20/

---

商品フォルダ内では

商品名を付けません。

フォルダ名で商品を識別します。

---

# 10. Color Code Rules

カラー展開がある商品は

カラーコードを先頭へ付けます。

現在使用

cy

Classic Yellow

gb

Gold Beige

sg

Shadow Gray

将来追加例

bk

Black

wh

White

od

Olive Drab

---

# 11. MOYA500 Image Rules

OPEN

cy-open-01-front.webp

cy-open-02-front-right.webp

cy-open-03-right.webp

cy-open-04-left.webp

cy-open-05-front-left.webp

CLOSE

cy-close-01-front.webp

cy-close-02-front-right.webp

cy-close-03-right.webp

cy-close-04-left.webp

cy-close-05-front-left.webp

Gold Beige

gb-open-...

Shadow Gray

sg-open-...

も同じルール。

---

# 12. Standard Product Rules

通常商品

例

cy-01-front.webp

cy-02-front-right.webp

cy-03-right.webp

cy-04-left.webp

cy-05-front-left.webp

カラー違いは

gb-

sg-

へ置き換えるだけとします。

---

# 13. Camera Angle Rules

画像アングルは共通ルールとします。

01 front

02 front-right

03 right

04 left

05 front-left

将来追加

06 rear

07 rear-right

08 rear-left

09 top

10 detail

11 interior

12 setup

---

# 14. Future Assets

動画

public/videos/

PDF

public/documents/

ダウンロード画像

public/downloads/

など

用途ごとにフォルダを分けます。

---

# 15. File Format Rules

画像

WebP

透過画像

PNG または SVG

アイコン

SVG

ロゴ

SVG

動画

MP4

PDF

PDF

用途に応じて最適な形式を使用します。

---

# 16. Image Size Policy

必要以上に大きい画像を配置しないこと。

Web用として適切なサイズで書き出します。

Heroなど大型画像は用途に応じて高解像度を使用します。

---

# 17. Rules Update

新しいアセットが増えた場合は

その場限りで終わらせず

このルールへ追記してください。

命名規則は途中で変更せず

一貫性を維持します。

---

# 18. Important

このルールは

今後追加するアセット

から適用します。

現在動作しているサイトを

一括修正することを目的としません。

リファクタリングや新規実装時に

順次統一してください。
