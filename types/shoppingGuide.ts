export type ShoppingGuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "bullets"; items: readonly string[] }
  | { type: "note"; text: string }
  | { type: "link"; label: string; href: string; external?: boolean };

export type ShoppingGuideSubsection = {
  heading?: string;
  blocks: readonly ShoppingGuideBlock[];
};

export type ShoppingGuideSection = {
  title: string;
  subsections: readonly ShoppingGuideSubsection[];
};

export type ShoppingGuideContent = {
  title: string;
  sections: readonly ShoppingGuideSection[];
};
