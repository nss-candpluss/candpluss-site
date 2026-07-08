import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicyContent } from "@/data/legal/privacyPolicy";

export function PrivacyPolicyDocument() {
  return <LegalDocument content={privacyPolicyContent} />;
}
