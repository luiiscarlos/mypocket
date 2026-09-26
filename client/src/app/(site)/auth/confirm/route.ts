import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

// Landing point for every email link: signup confirmation, password recovery and email change.
// Supports token_hash (works when the link is opened in another browser/device) and PKCE code.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const next = safeNext(params.get("next"));

  const supabase = await createClient();
  const { error } =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error("missing token") };

  const target = new URL(error ? "/login" : type === "recovery" ? "/reset-password" : next, request.url);
  if (error) target.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(target);
}
