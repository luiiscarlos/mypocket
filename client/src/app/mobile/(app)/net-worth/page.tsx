import { getTranslations } from "next-intl/server";
import { NetWorthScreen } from "@/components/app/screens/net-worth";

// Same screen as /dashboard/net-worth: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("netWorth") };
}

export default function Page({ searchParams }: PageProps<"/mobile/net-worth">) {
  return <NetWorthScreen base="/mobile" searchParams={searchParams} />;
}
