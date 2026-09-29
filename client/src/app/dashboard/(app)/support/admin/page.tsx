import { getTranslations } from "next-intl/server";
import { SupportAdminScreen } from "@/components/app/screens/support-admin";

export async function generateMetadata() {
  return { title: (await getTranslations("app.support"))("adminTitle") };
}

export default function Page({ searchParams }: PageProps<"/dashboard/support/admin">) {
  return <SupportAdminScreen base="/dashboard" searchParams={searchParams} />;
}
