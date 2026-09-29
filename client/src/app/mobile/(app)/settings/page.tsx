import { getTranslations } from "next-intl/server";
import { SettingsScreen } from "@/components/app/screens/settings";

// Same screen as /dashboard/settings: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("settings") };
}

export default function Page({ searchParams }: PageProps<"/mobile/settings">) {
  return <SettingsScreen base="/mobile" searchParams={searchParams} />;
}
