import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions } from "./server";

const PROTECTED = ["/dashboard", "/mobile"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

// Desktop-only routes: onboarding is shared (it adapts to the phone) and the export is a file download.
const SHARED_DASHBOARD = ["/dashboard/onboarding", "/dashboard/settings/export"];
const isPhone = (userAgent: string) => /Mobi|Android|iPhone|iPod/i.test(userAgent);

/**
 * Which app a signed-in request belongs in: phones use /mobile, everything else /dashboard, unless the
 * user chose one explicitly (cookie "view", set from "Más" / Ajustes). Same sub-path in both apps.
 */
function appFor(request: NextRequest, pathname: string): string | null {
  const view = request.cookies.get("view")?.value;
  const wantsMobile = view ? view === "mobile" : isPhone(request.headers.get("user-agent") ?? "");
  if (wantsMobile && matches(pathname, ["/dashboard"]) && !matches(pathname, SHARED_DASHBOARD)) {
    return pathname.replace(/^\/dashboard/, "/mobile");
  }
  if (!wantsMobile && matches(pathname, ["/mobile"])) return pathname.replace(/^\/mobile/, "/dashboard");
  return null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Must run right after createServerClient: refreshes the token, otherwise users get logged out randomly.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  // Optimistic check only; pages and actions re-check with requireUser().
  let redirectTo: URL | null = null;
  if (!signedIn && matches(pathname, PROTECTED)) {
    redirectTo = new URL("/login", request.url);
    redirectTo.searchParams.set("next", pathname + search);
  } else if (signedIn && matches(pathname, AUTH_PAGES)) {
    redirectTo = new URL(appFor(request, "/dashboard") ?? "/dashboard", request.url);
  } else if (signedIn) {
    const target = appFor(request, pathname);
    if (target) redirectTo = new URL(target + search, request.url);
  }
  if (!redirectTo) return response;

  // Keep any refreshed session cookies on the redirect.
  const redirect = NextResponse.redirect(redirectTo);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
