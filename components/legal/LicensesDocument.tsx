import { LegalDocument } from "@/components/legal/LegalDocument";
import { licensesContent } from "@/data/legal/licenses";

export function LicensesDocument() {
  return <LegalDocument content={licensesContent} />;
}
