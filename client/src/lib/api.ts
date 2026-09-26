import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
    readonly fields?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

/**
 * BFF call to the GraphQL API. Runs only on the server: the access token comes from the
 * httpOnly session cookie and never reaches the browser.
 */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const supabase = await createClient();
  // The API verifies the JWT itself, so reading the (proxy-refreshed) session from the cookie is fine here.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const clientIp = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();

  const res = await fetch(process.env.API_URL!, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET!,
      ...(token && { authorization: `Bearer ${token}` }),
      ...(clientIp && { "x-client-ip": clientIp }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await res.json()) as {
    data?: T;
    errors?: { message: string; extensions?: { code?: string; fields?: { path: string; message: string }[] } }[];
  };
  const error = body.errors?.[0];
  if (error?.extensions?.code === "UNAUTHENTICATED") redirect("/login");
  if (error) throw new ApiError(error.message, error.extensions?.code, error.extensions?.fields);
  return body.data as T;
}
