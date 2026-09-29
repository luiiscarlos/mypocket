import { getTranslations } from "next-intl/server";
import { UpdatesScreen } from "@/components/app/screens/updates";

// Same screen as /dashboard/updates: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("updates") };
}

export default function Page() {
  return <UpdatesScreen />;
}
