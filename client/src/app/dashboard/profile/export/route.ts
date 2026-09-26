import { requireUser } from "@/lib/auth";
import { gql } from "@/lib/api";

// GDPR data portability: download everything the user owns as JSON.
export async function GET() {
  await requireUser();
  const { exportMyData } = await gql<{ exportMyData: string }>("{ exportMyData }");
  return new Response(exportMyData, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="mypocket-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
