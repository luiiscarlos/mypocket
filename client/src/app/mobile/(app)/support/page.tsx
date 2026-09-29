import { getTranslations } from "next-intl/server";
import { SupportScreen } from "@/components/app/screens/support";

// Same screen as /dashboard/support: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.support"))("title") };
}

export default function Page({ searchParams }: PageProps<"/mobile/support">) {
  return <SupportScreen base="/mobile" searchParams={searchParams} />;
}
