import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/site/legal";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("privacy") };
}

export default function PrivacyPage() {
  return <LegalDocument doc="privacy" />;
}
