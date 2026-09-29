import { getTranslations } from "next-intl/server";
import { SimulationsScreen } from "@/components/app/screens/simulations";

// Same screen as /dashboard/simulations: it already stacks to one column on a phone.
export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("simulations") };
}

export default function Page({ searchParams }: PageProps<"/mobile/simulations">) {
  return <SimulationsScreen base="/mobile" searchParams={searchParams} />;
}
