export type LegalClause = {
  text: string;
  bullets?: readonly string[];
};

export type LegalSection = {
  title: string;
  intro?: string;
  body?: string;
  clauses?: readonly LegalClause[];
  bullets?: readonly string[];
  closing?: readonly string[];
  contact?: LegalContact;
};

export type LegalContact = {
  intro?: string;
  company: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
};

export type LegalDocumentContent = {
  title: string;
  updatedAt: string;
  lead: string;
  sections: readonly LegalSection[];
  contact?: LegalContact;
};

export type CommercialTransactionBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullets"; items: readonly string[] }
  | { type: "note"; text: string };

export type CommercialTransactionItem = {
  label: string;
  blocks: readonly CommercialTransactionBlock[];
};

export type CommercialTransactionsContent = {
  title: string;
  items: readonly CommercialTransactionItem[];
};
