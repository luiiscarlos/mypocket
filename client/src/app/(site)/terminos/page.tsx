import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return <LegalDocument doc="terminos" />;
}
