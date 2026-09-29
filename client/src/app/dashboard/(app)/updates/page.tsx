import { getTranslations } from "next-intl/server";
import { UpdatesScreen } from "@/components/app/screens/updates";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("updates") };
}

export default function Page() {
  return <UpdatesScreen />;
}
