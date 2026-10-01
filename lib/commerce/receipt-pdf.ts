/**
 * 領収書の PDF を、ライブラリを使わずブラウザの標準機能だけで作る。
 *
 * 画面の帳票（`[data-receipt-sheet]`）の位置をそのまま読み取り、Canvas に
 * 罫線と文字を描き直して 1 枚の画像にし、A4 1 ページの PDF に包む。
 * 罫線は隣り合うマスで共有している線を 1 本にまとめてから引く。マスごとに
 * 引くと境目だけ二重になり、そこだけ太く見える。
 */

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
/** 印刷の `@page` と同じ余白にして、PDF と印刷で同じ見た目にする */
const PAGE_MARGIN_PT = (12 / 25.4) * 72;
/** 300dpi で余白を除いた A4 幅。狭い画面で開いても粗くならないよう、これに合わせて描く */
const CAPTURE_WIDTH_PX = 2200;

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

  for (const cell of sheet.querySelectorAll<HTMLElement>("th, td")) {
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

  return { canvas, ctx };
}

/** 帳票は黒と白だけなので、色を持たずに明るさ 1 バイトで持つ */
function toGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  const gray = new Uint8Array(width * height);

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

type ImagePdfInput = {
  /** 画素数 */
  width: number;
  height: number;
  /** 明るさ 1 バイト/画素を zlib で圧縮したもの */
  compressedGray: Uint8Array;
  title: string;
};

/** グレースケール画像 1 枚を、A4 縦 1 ページの上寄せ・左右中央に置いた PDF にする */
export function buildImagePdf({ width, height, compressedGray, title }: ImagePdfInput) {
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
  const drawWidth = Math.min(maxWidth, (maxHeight * width) / height);
  const drawHeight = (drawWidth * height) / width;
  const x = (A4_WIDTH_PT - drawWidth) / 2;
  const y = A4_HEIGHT_PT - PAGE_MARGIN_PT - drawHeight;
  const content = encoder.encode(
    `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`
  );

  // 2 行目はバイナリを含むファイルだと示す決まりごとの注釈
  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  object("<< /Type /Catalog /Pages 2 0 R >>");
  object("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`
  );
  object(`<< /Length ${content.length} >>`, content);
  object(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressedGray.length} >>`,
    compressedGray
  );
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

/** 画面の帳票を A4 1 ページの PDF にして保存する */
export async function downloadReceiptPdf(fileName: string) {
  const sheet = document.querySelector<HTMLElement>("[data-receipt-sheet]");

  if (!sheet) {
    throw new Error("Receipt sheet not found.");
  }

  await document.fonts.ready;

  const { canvas, ctx } = renderSheet(sheet);
  const compressedGray = await deflate(
    toGrayscale(ctx, canvas.width, canvas.height)
  );

  saveBlob(
    buildImagePdf({
      width: canvas.width,
      height: canvas.height,
      compressedGray,
      title: fileName,
    }),
    `${fileName}.pdf`
  );
}
