import type { LegalDocumentContent } from "@/types/legal";

/**
 * 本サイトがブラウザへ配信している OSS の告知。
 * heic-to は LGPL-3.0+ のため、ライセンス本文および入手元の明示が必要。
 * ライブラリを追加・更新した際は、このファイルを必ず更新する。
 */
export const licensesContent = {
  title: "ライセンス表記",
  lead:
    "本サイトでは、以下のオープンソースソフトウェアを利用しています。各ソフトウェアの著作権は、それぞれの権利者に帰属します。",
  sections: [
    {
      title: "heic-to 1.5.2",
      clauses: [
        {
          text: "お問い合わせフォームで HEIC / HEIF 形式の画像をお送りいただいた際、ブラウザ上で JPEG に変換するために利用しています。libheif および libde265 を同梱しています。",
        },
        {
          text: "ライセンス：GNU Lesser General Public License version 3 or later（LGPL-3.0+）",
        },
        {
          text: "配布元：https://github.com/hoppergee/heic-to",
        },
        {
          text: "ライセンス全文：https://www.gnu.org/licenses/lgpl-3.0.txt",
        },
        {
          text: "GNU General Public License version 3：https://www.gnu.org/licenses/gpl-3.0.txt",
        },
        {
          text: "当社は heic-to に一切の改変を加えていません。",
        },
      ],
    },
    {
      title: "browser-image-compression 2.0.2",
      clauses: [
        {
          text: "お問い合わせフォームの添付画像を、送信前にブラウザ上で圧縮するために利用しています。",
        },
        {
          text: "ライセンス：MIT License",
        },
        {
          text: "Copyright (c) 2019 Donald Chan",
        },
        {
          text: 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
        },
        {
          text: "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.",
        },
        {
          text: 'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
        },
      ],
    },
  ],
} satisfies LegalDocumentContent;
