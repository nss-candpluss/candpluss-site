import {
  appendDocument,
  emptyLedger,
  type InvoiceDocument,
  type InvoiceDocumentLedger,
} from "@/lib/invoice/documents";

/**
 * 発行した書類の保存（案）。保存先（DB など）は決めず、保存する記録の形と、追記専用の
 * 保存先のインターフェースだけを決める。テスト用にメモリ上の実装を持つ。
 *
 * 保存するのは、お客様に渡した書類そのもの（発行時点の内容）。後から Shopify のデータで
 * 組み立て直さず、保存した内容をそのまま再表示・出力する。訂正は元の書類を残したまま、
 * 訂正の書類を足す（`documents.ts` の台帳の決まり）。
 *
 * 電子帳簿保存法の要件（真実性・可視性）は、この仕組みだけでは満たさない。保存先の権限・
 * バックアップ・訂正削除の防止に関する事務処理規程などと合わせて満たす（未確定）。
 */

export class InvoiceRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceRecordError";
  }
}

/**
 * 検索に使う値。電子帳簿保存法の検索要件（取引年月日・取引金額・取引先）に当たるもの。
 * 宛名の無い適格簡易請求書には取引先が無いので、注文番号で補う。
 */
export type InvoiceRecordSearchKeys = {
  orderId: string;
  orderName: string;
  documentId: string;
  kind: InvoiceDocument["kind"];
  /** 取引年月日（返還請求書は返還等の年月日） */
  transactionDate: string;
  amount: number;
};

export type StoredInvoiceDocument = {
  recordedAt: string;
  document: InvoiceDocument;
  searchKeys: InvoiceRecordSearchKeys;
};

export type AppendInvoiceDocumentResult = {
  record: StoredInvoiceDocument;
  /** 同じ内容がすでに保存されていて、新しく足さなかった */
  duplicate: boolean;
};

/**
 * 追記専用の保存先。足すことと読むことだけができ、書き換え・削除の操作は持たない。
 * 実際の保存先で実装するときも、この 2 つだけを公開する。
 */
export interface InvoiceDocumentStore {
  append(input: { recordedAt: string; document: InvoiceDocument }): Promise<AppendInvoiceDocumentResult>;
  list(filter?: { orderId?: string }): Promise<readonly StoredInvoiceDocument[]>;
}

export function searchKeysFor(document: InvoiceDocument): InvoiceRecordSearchKeys {
  return {
    orderId: document.orderId,
    orderName: document.orderName,
    documentId: document.documentId,
    kind: document.kind,
    transactionDate: document.kind === "invoice" ? document.transactionDate : document.returnDate,
    amount: document.taxSummary.total,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

/** 保存した記録から、注文 1 件の台帳を組み立て直す */
export function ledgerFromRecords(
  orderId: string,
  records: readonly StoredInvoiceDocument[]
): InvoiceDocumentLedger {
  return records
    .filter((record) => record.document.orderId === orderId)
    .reduce((ledger, record) => appendDocument(ledger, record.document), emptyLedger(orderId));
}

/** テスト用のメモリ上の保存先。本番では使わない */
export class MemoryInvoiceDocumentStore implements InvoiceDocumentStore {
  #records: StoredInvoiceDocument[] = [];

  async append(input: { recordedAt: string; document: InvoiceDocument }): Promise<AppendInvoiceDocumentResult> {
    if (Number.isNaN(Date.parse(input.recordedAt))) {
      throw new InvoiceRecordError(`記録日時として読めません: ${input.recordedAt}`);
    }

    const document = structuredClone(input.document);
    const same = this.#records.find((record) => record.document.documentId === document.documentId);

    if (same) {
      if (JSON.stringify(same.document) === JSON.stringify(document)) {
        return { record: same, duplicate: true };
      }
      throw new InvoiceRecordError(`保存済みの書類 ${document.documentId} と内容が違うので足せません`);
    }

    // 台帳の決まり（2 枚目の書類・訂正の対象）を、保存済みの書類で確かめる
    appendDocument(ledgerFromRecords(document.orderId, this.#records), document);

    const record: StoredInvoiceDocument = deepFreeze({
      recordedAt: input.recordedAt,
      document,
      searchKeys: searchKeysFor(document),
    });

    this.#records.push(record);
    return { record, duplicate: false };
  }

  async list(filter: { orderId?: string } = {}) {
    return this.#records.filter(
      (record) => filter.orderId === undefined || record.document.orderId === filter.orderId
    );
  }
}

/**
 * 保存した書類の検索。取引年月日・金額は範囲で、注文番号は一致で探し、指定した条件を
 * すべて満たすものを返す（電子帳簿保存法の検索要件に当たる機能の土台）。
 */
export function searchDocumentRecords(
  records: readonly StoredInvoiceDocument[],
  query: {
    transactionDateFrom?: string;
    transactionDateTo?: string;
    amountMin?: number;
    amountMax?: number;
    orderName?: string;
  }
) {
  return records.filter(({ searchKeys: keys }) => {
    if (query.transactionDateFrom !== undefined && keys.transactionDate < query.transactionDateFrom) {
      return false;
    }
    if (query.transactionDateTo !== undefined && keys.transactionDate > query.transactionDateTo) {
      return false;
    }
    if (query.amountMin !== undefined && keys.amount < query.amountMin) {
      return false;
    }
    if (query.amountMax !== undefined && keys.amount > query.amountMax) {
      return false;
    }
    if (query.orderName !== undefined && keys.orderName !== query.orderName) {
      return false;
    }
    return true;
  });
}
