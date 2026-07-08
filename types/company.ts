export type CompanyInfoBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: readonly string[] }
  | { type: "linkedLine"; text: string; href: string };

export type CompanyInfoItem = {
  label: string;
  blocks: readonly CompanyInfoBlock[];
};

export type CompanyContent = {
  title: string;
  labTitle: string;
  labItems: readonly CompanyInfoItem[];
  tableTitle: string;
  items: readonly CompanyInfoItem[];
};
