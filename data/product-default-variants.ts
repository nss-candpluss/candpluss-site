/**
 * 一覧・詳細の初期選択色。
 * variants の並び（カラーチップ順）は変えない。
 *
 * handle が prefix と一致するか、`prefix_` で始まる商品に適用する。
 */
export const productDefaultColorNameByHandlePrefix = [
  { handlePrefix: "moya420", colorName: "Shadow Gray" },
] as const;
