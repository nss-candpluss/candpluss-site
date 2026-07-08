import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookiePolicyContent } from "@/data/legal/cookiePolicy";

export function CookiePolicyDocument() {
  return <LegalDocument content={cookiePolicyContent} />;
}
