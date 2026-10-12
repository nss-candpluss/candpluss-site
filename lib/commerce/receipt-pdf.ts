/**
 * 領収書の PDF を、ライブラリを使わずブラウザの標準機能だけで作る。
 *
 * 画面の帳票（`[data-receipt-sheet]`）の位置をそのまま読み取り、Canvas に
 * 罫線と文字を描き直して画像にし、A4 縦の PDF に包む。
 * 罫線は隣り合うマスで共有している線を 1 本にまとめてから引く。マスごとに
 * 引くと境目だけ二重になり、そこだけ太く見える。
 *
 * 1 ページに収まらない帳票は縮めず、明細（`[data-receipt-detail]`）の行の切れ目で
 * 次のページに送る。続きのページには表題と表の見出しを付け直し、全ページにページ番号を入れる。
 * 金額・税率ごとの合計は明細より上にあるので、1 ページ目から分かれない。
 */

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
/** 印刷の `@page` と同じ余白にして、PDF と印刷で同じ見た目にする */
const PAGE_MARGIN_PT = (12 / 25.4) * 72;
/** 300dpi で余白を除いた A4 幅。狭い画面で開いても粗くならないよう、これに合わせて描く */
const CAPTURE_WIDTH_PX = 2200;
/** 余白を除いた A4 の高さ ÷ 幅。1 ページに描ける高さはこれで決まる */
const PAGE_CONTENT_RATIO = (A4_HEIGHT_PT - PAGE_MARGIN_PT * 2) / (A4_WIDTH_PT - PAGE_MARGIN_PT * 2);

type Rect = { left: number; top: number; width: number; height: number };

function relativeRect(rect: DOMRect, origin: DOMRect, scale: number): Rect {
  return {
    left: (rect.left - origin.left) * scale,
    top: (rect.top - origin.top) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

function drawRules(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLElement,
  origin: DOMRect,
  scale: number
) {
  const drawn = new Set<string>();
  const positions = { h: [] as number[], v: [] as number[] };
  // 上のマスの下辺と下のマスの上辺は、端数のずれで 1px 離れることがある。近い線は同じ位置に寄せる
  const snap = (direction: "h" | "v", at: number, tolerance: number) => {
    const known = positions[direction].find((value) => Math.abs(value - at) <= tolerance);

    if (known !== undefined) {
      return known;
    }
    positions[direction].push(at);
    return at;
  };

  // 表のマスだけでなく、金額の下線や区切り線も画面と同じに引く
  for (const cell of sheet.querySelectorAll<HTMLElement>("*")) {
    const style = getComputedStyle(cell);
    const rect = relativeRect(cell.getBoundingClientRect(), origin, scale);
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;
    const edges = [
      ["h", rect.top, rect.left, right, style.borderTopWidth, style.borderTopColor],
      ["h", bottom, rect.left, right, style.borderBottomWidth, style.borderBottomColor],
      ["v", rect.left, rect.top, bottom, style.borderLeftWidth, style.borderLeftColor],
      ["v", right, rect.top, bottom, style.borderRightWidth, style.borderRightColor],
    ] as const;

    for (const [direction, at, from, to, widthValue, color] of edges) {
      if (!parseFloat(widthValue)) {
        continue;
      }

      const width = Math.max(1, Math.round(parseFloat(widthValue) * scale));

      const start = snap(direction, Math.round(at - width / 2), width);
      const key = `${direction}:${start}:${Math.round(from)}:${Math.round(to)}`;

      if (drawn.has(key)) {
        continue;
      }
      drawn.add(key);

      const begin = Math.round(from - width / 2);
      const length = Math.round(to + width / 2) - begin;

      ctx.fillStyle = color;
      if (direction === "h") {
        ctx.fillRect(begin, start, length, width);
      } else {
        ctx.fillRect(start, begin, width, length);
      }
    }
  }
}

function drawTexts(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLElement,
  origin: DOMRect,
  scale: number
) {
  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    const parent = node.parentElement;

    if (!parent || !text.trim()) {
      continue;
    }

    const style = getComputedStyle(parent);

    ctx.font = `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    // 折り返した行ごとに描く。詰められた空白は矩形を持たないので拾わない
    const runs: { text: string; rect: Rect }[] = [];
    let offset = 0;

    for (const char of Array.from(text)) {
      range.setStart(node, offset);
      range.setEnd(node, offset + char.length);
      offset += char.length;

      const charRect = range.getClientRects()[0];

      if (!charRect) {
        continue;
      }

      const rect = relativeRect(charRect, origin, scale);
      const run = runs.at(-1);

      if (run && Math.abs(run.rect.top - rect.top) < scale) {
        run.text += char;
      } else {
        runs.push({ text: char, rect });
      }
    }

    for (const run of runs) {
      const metrics = ctx.measureText(run.text);
      const ascent = metrics.fontBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent;
      const baseline = run.rect.top + (run.rect.height - (ascent + descent)) / 2 + ascent;

      ctx.fillText(run.text, run.rect.left, baseline);
    }
  }
}

function renderSheet(sheet: HTMLElement) {
  const origin = sheet.getBoundingClientRect();
  const scale = CAPTURE_WIDTH_PX / origin.width;
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(origin.width * scale);
  canvas.height = Math.round(origin.height * scale);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRules(ctx, sheet, origin, scale);
  drawTexts(ctx, sheet, origin, scale);

  return { canvas, origin, scale };
}

export type PageSlice = { top: number; bottom: number };

/**
 * 帳票の画像をどこで切ってページに分けるか。位置は画像の画素。
 *
 * - `breaks`：切ってよい位置（明細の行の下辺）。行の途中では切らない
 * - `pageHeight`：1 ページに描ける高さ
 * - `repeatHeight`：2 ページ目以降の上に付け直す表題と表の見出しの高さ
 *
 * 1 ページに収まるならそのまま 1 ページ。切れる位置が見つからない（1 行がページより高い）
 * ときは縮めたり行を割ったりせず、`null` を返して呼び出し側に任せる。
 */
export function paginateSheet({
  height,
  pageHeight,
  repeatHeight,
  breaks,
}: {
  height: number;
  pageHeight: number;
  repeatHeight: number;
  breaks: number[];
}): PageSlice[] | null {
  const slices: PageSlice[] = [];
  let top = 0;

  while (height - top > (slices.length === 0 ? pageHeight : pageHeight - repeatHeight)) {
    const limit = top + (slices.length === 0 ? pageHeight : pageHeight - repeatHeight);
    const bottom = breaks.filter((at) => at > top && at <= limit).at(-1);

    if (bottom === undefined) {
      return null;
    }
    slices.push({ top, bottom });
    top = bottom;
  }

  slices.push({ top, bottom: height });
  return slices;
}

function textFont(element: Element, scale: number) {
  const style = getComputedStyle(element);

  return {
    font: `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`,
    size: parseFloat(style.fontSize) * scale,
    color: style.color,
  };
}

/**
 * 帳票を A4 のページ分の画像にする。1 ページに収まるなら描いた画像をそのまま返す。
 * 続きのページは「表題（続き）・注文番号」と表の見出しを上に付け、明細の続きを描く。
 */
function renderPages(sheet: HTMLElement): HTMLCanvasElement[] {
  const { canvas, origin, scale } = renderSheet(sheet);
  const pageHeight = Math.floor(canvas.width * PAGE_CONTENT_RATIO);
  const detail = sheet.querySelector<HTMLTableElement>("[data-receipt-detail]");

  if (canvas.height <= pageHeight) {
    return [canvas];
  }
  if (!detail?.tHead || !detail.tBodies[0]) {
    throw new Error("Receipt detail table not found.");
  }

  const position = (element: Element) => relativeRect(element.getBoundingClientRect(), origin, scale);
  const head = position(detail.tHead);
  const headCell = detail.tHead.querySelector("th") ?? detail.tHead;
  const caption = textFont(headCell, scale);
  const rows = Array.from(detail.tBodies[0].rows);
  // 割引の行は商品の行と同じページに置く。最後の行の下では切らず、注記だけのページを作らない
  const breaks = rows
    .slice(0, -1)
    .filter((row, index) => !rows[index + 1].hasAttribute("data-receipt-keep-with-previous"))
    .map((row) => Math.round(position(row).top + position(row).height));
  const headTop = Math.floor(head.top - scale);
  const headBottom = Math.round(head.top + head.height);
  const bandHeight = Math.round(caption.size * 3);
  const footerHeight = Math.round(caption.size * 2.5);
  const repeatHeight = bandHeight + (headBottom - headTop);
  const slices = paginateSheet({
    height: canvas.height,
    pageHeight: pageHeight - footerHeight,
    repeatHeight,
    breaks,
  });

  if (!slices) {
    throw new Error("Receipt sheet cannot be split into pages.");
  }

  const continuation = sheet.dataset.receiptContinuation ?? "";

  return slices.map((slice, index) => {
    const page = document.createElement("canvas");
    const ctx = page.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available.");
    }

    page.width = canvas.width;
    page.height = pageHeight;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, page.width, page.height);
    ctx.font = caption.font;
    ctx.fillStyle = caption.color;
    ctx.textBaseline = "alphabetic";

    let y = 0;
    let top = slice.top;
    // 切った位置の罫線は、上下のページの両方に半分ずつ掛かる。上のページは線の太さの分だけ下まで描いて
    // 線を欠けさせない。続きのページは見出しの下の線を太さの分まで写し、切った行の線の残りは描かない
    const half = Math.ceil(scale / 2) + 1;

    if (index > 0) {
      ctx.textAlign = "left";
      ctx.fillText(continuation, 0, caption.size * 1.2);
      y = bandHeight;
      ctx.drawImage(canvas, 0, headTop, canvas.width, headBottom + half - headTop, 0, y, canvas.width, headBottom + half - headTop);
      y += headBottom + half - headTop;
      top = slice.top + half;
    }

    const bottom = index < slices.length - 1 ? Math.min(canvas.height, slice.bottom + half) : slice.bottom;

    ctx.drawImage(canvas, 0, top, canvas.width, bottom - top, 0, y, canvas.width, bottom - top);

    ctx.textAlign = "right";
    ctx.fillText(`${index + 1} / ${slices.length}`, page.width, page.height - caption.size * 0.5);

    return page;
  });
}

/** 帳票は黒と白だけなので、色を持たずに明るさ 1 バイトで持つ */
function toGrayscale(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = new Uint8Array(canvas.width * canvas.height);

  for (let index = 0; index < gray.length; index += 1) {
    const pixel = index * 4;

    gray[index] = Math.round(
      data[pixel] * 0.299 + data[pixel + 1] * 0.587 + data[pixel + 2] * 0.114
    );
  }

  return gray;
}

/** PDF の FlateDecode は zlib 形式。ブラウザの `CompressionStream("deflate")` がそれを出す */
export async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function utf16HexString(value: string) {
  let hex = "FEFF";

  for (let index = 0; index < value.length; index += 1) {
    hex += value.charCodeAt(index).toString(16).padStart(4, "0").toUpperCase();
  }

  return `<${hex}>`;
}

type PdfPageImage = {
  /** 画素数 */
  width: number;
  height: number;
  /** 明るさ 1 バイト/画素を zlib で圧縮したもの */
  compressedGray: Uint8Array;
};

/**
 * グレースケール画像 1 枚を 1 ページとして、A4 縦の上寄せ・左右中央に置いた PDF にする。
 * 画像は余白を除いた幅に合わせ、収まらない高さのときだけ縮める（ページ分けした画像は縮まない）
 */
export function buildImagePdf({ pages, title }: { pages: PdfPageImage[]; title: string }) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;

    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (body: string, stream?: Uint8Array) => {
    offsets.push(length);
    push(`${offsets.length} 0 obj\n${body}\n`);

    if (stream) {
      push("stream\n");
      push(stream);
      push("\nendstream\n");
    }

    push("endobj\n");
  };

  const maxWidth = A4_WIDTH_PT - PAGE_MARGIN_PT * 2;
  const maxHeight = A4_HEIGHT_PT - PAGE_MARGIN_PT * 2;
  // オブジェクト番号：1 目録、2 ページの一覧、ページごとに 3 つ（ページ・描画命令・画像）、最後に文書情報
  const pageObject = (index: number) => 3 + index * 3;

  // 2 行目はバイナリを含むファイルだと示す決まりごとの注釈
  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  object("<< /Type /Catalog /Pages 2 0 R >>");
  object(
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${pageObject(index)} 0 R`).join(" ")}] /Count ${pages.length} >>`
  );
  pages.forEach(({ width, height, compressedGray }, index) => {
    const drawWidth = Math.min(maxWidth, (maxHeight * width) / height);
    const drawHeight = (drawWidth * height) / width;
    const x = (A4_WIDTH_PT - drawWidth) / 2;
    const y = A4_HEIGHT_PT - PAGE_MARGIN_PT - drawHeight;
    const content = encoder.encode(
      `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`
    );
    const own = pageObject(index);

    object(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Resources << /XObject << /Im0 ${own + 2} 0 R >> >> /Contents ${own + 1} 0 R >>`
    );
    object(`<< /Length ${content.length} >>`, content);
    object(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressedGray.length} >>`,
      compressedGray
    );
  });
  object(`<< /Title ${utf16HexString(title)} >>`);

  const xrefOffset = length;

  push(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  push(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R /Info ${offsets.length} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // 保存が始まる前に URL を消すと、ブラウザによってはダウンロードが失敗する
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 帳票 1 枚を A4 縦の PDF にする。収まらなければ明細の行の切れ目でページを分ける */
export async function buildReceiptPdf(sheet: HTMLElement, title: string) {
  await document.fonts.ready;

  const pages = await Promise.all(
    renderPages(sheet).map(async (canvas) => ({
      width: canvas.width,
      height: canvas.height,
      compressedGray: await deflate(toGrayscale(canvas)),
    }))
  );

  return buildImagePdf({ pages, title });
}

/**
 * 画面の帳票を PDF にして保存する。
 * 帳票が複数あるページでは `sheetKey`（`data-receipt-sheet` の値）で 1 枚を選ぶ。
 */
export async function downloadReceiptPdf(fileName: string, sheetKey?: string) {
  const sheet = sheetKey
    ? Array.from(document.querySelectorAll<HTMLElement>("[data-receipt-sheet]")).find(
        (element) => element.dataset.receiptSheet === sheetKey
      )
    : document.querySelector<HTMLElement>("[data-receipt-sheet]");

  if (!sheet) {
    throw new Error("Receipt sheet not found.");
  }

  saveBlob(await buildReceiptPdf(sheet, fileName), `${fileName}.pdf`);
}
