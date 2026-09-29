import { getTranslations } from "next-intl/server";
import { SupportScreen } from "@/components/app/screens/support";

export async function generateMetadata() {
  return { title: (await getTranslations("app.support"))("title") };
}

export default function Page({ searchParams }: PageProps<"/dashboard/support">) {
  return <SupportScreen base="/dashboard" searchParams={searchParams} />;
}
