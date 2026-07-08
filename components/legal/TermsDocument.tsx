import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsContent } from "@/data/legal/terms";

export function TermsDocument() {
  return <LegalDocument content={termsContent} />;
}
