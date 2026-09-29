import { getTranslations } from "next-intl/server";
import { SimulationsScreen } from "@/components/app/screens/simulations";

export async function generateMetadata() {
  return { title: (await getTranslations("app.nav"))("simulations") };
}

export default function Page({ searchParams }: PageProps<"/dashboard/simulations">) {
  return <SimulationsScreen base="/dashboard" searchParams={searchParams} />;
}
