import { getTranslations } from "next-intl/server";
import { AnalyticsScreen } from "@/components/app/screens/analytics";

// Same screen as /dashboard/analytics: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("analytics") };
}

export default function Page({ searchParams }: PageProps<"/mobile/analytics">) {
  return <AnalyticsScreen base="/mobile" searchParams={searchParams} />;
}
