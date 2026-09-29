import { getTranslations } from "next-intl/server";
import { SupportAdminScreen } from "@/components/app/screens/support-admin";

// Same screen as /dashboard/support/admin: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.support"))("adminTitle") };
}

export default function Page({ searchParams }: PageProps<"/mobile/support/admin">) {
  return <SupportAdminScreen base="/mobile" searchParams={searchParams} />;
}
