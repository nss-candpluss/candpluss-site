import { CONTACT_DRAFT_TTL_MS } from "@/lib/contact/draft-expiration";

let attachmentFiles: File[] = [];
let attachmentPersistenceQueue: Promise<unknown> = Promise.resolve();

const DATABASE_NAME = "candpluss-support-contact";
const DATABASE_VERSION = 1;
const ATTACHMENT_STORE_NAME = "attachments";
const ATTACHMENT_STORAGE_KEY = "current";
const ATTACHMENT_SESSION_KEY = "candpluss:support-contact-attachment-session";

type StoredAttachment = {
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
};

type StoredAttachmentEnvelope = {
  attachments: StoredAttachment[];
  expiresAt: number;
  sessionId: string;
};

function getAttachmentSessionId(create: boolean): string | null {
  const current = window.sessionStorage.getItem(ATTACHMENT_SESSION_KEY);

  if (current || !create) {
    return current;
  }

  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(ATTACHMENT_SESSION_KEY, sessionId);
  return sessionId;
}

function openAttachmentDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ATTACHMENT_STORE_NAME)) {
        request.result.createObjectStore(ATTACHMENT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runAttachmentRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openAttachmentDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(
          ATTACHMENT_STORE_NAME,
          mode
        );
        const request = operation(transaction.objectStore(ATTACHMENT_STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      })
  );
}

export function getSupportContactAttachments(): File[] {
  return attachmentFiles;
}

export async function loadSupportContactAttachments(): Promise<File[]> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return attachmentFiles;
  }

  const stored = await runAttachmentRequest<
    StoredAttachmentEnvelope | undefined
  >("readonly", (store) => store.get(ATTACHMENT_STORAGE_KEY));

  const sessionId = getAttachmentSessionId(false);

  if (
    !stored ||
    stored.expiresAt <= Date.now() ||
    !sessionId ||
    stored.sessionId !== sessionId
  ) {
    attachmentFiles = [];

    if (stored) {
      clearPersistedAttachments();
    }

    return attachmentFiles;
  }

  attachmentFiles = stored.attachments.map(
    (attachment) =>
      new File([attachment.blob], attachment.name, {
        type: attachment.type,
        lastModified: attachment.lastModified,
      })
  );

  return attachmentFiles;
}

export async function setSupportContactAttachments(files: File[]): Promise<void> {
  attachmentFiles = files;

  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const storedAttachments: StoredAttachment[] = files.map((file) => ({
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    blob: file,
  }));
  const sessionId = getAttachmentSessionId(true);

  if (!sessionId) {
    return;
  }

  attachmentPersistenceQueue = attachmentPersistenceQueue
    .catch(() => undefined)
    .then(() =>
      runAttachmentRequest("readwrite", (store) =>
        store.put(
          {
            attachments: storedAttachments,
            expiresAt: Date.now() + CONTACT_DRAFT_TTL_MS,
            sessionId,
          } satisfies StoredAttachmentEnvelope,
          ATTACHMENT_STORAGE_KEY
        )
      )
    );

  await attachmentPersistenceQueue;
}

function clearPersistedAttachments(): void {
  attachmentPersistenceQueue = attachmentPersistenceQueue
    .catch(() => undefined)
    .then(() =>
      runAttachmentRequest("readwrite", (store) =>
        store.delete(ATTACHMENT_STORAGE_KEY)
      )
  );
}

export function clearSupportContactAttachments(): void {
  attachmentFiles = [];

  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  window.sessionStorage.removeItem(ATTACHMENT_SESSION_KEY);
  clearPersistedAttachments();
}
