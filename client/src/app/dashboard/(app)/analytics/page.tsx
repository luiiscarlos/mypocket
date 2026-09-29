import { getTranslations } from "next-intl/server";
import { AnalyticsScreen } from "@/components/app/screens/analytics";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("analytics") };
}

export default function Page({ searchParams }: PageProps<"/dashboard/analytics">) {
  return <AnalyticsScreen base="/dashboard" searchParams={searchParams} />;
}
