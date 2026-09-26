import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return <LegalDocument doc="privacidad" />;
}
