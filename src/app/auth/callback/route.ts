import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

function getRedirectPath(url: URL) {
  const param = url.searchParams.get("redirect");
  if (param && param.startsWith("/")) return param;
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }
  }

  const res = NextResponse.redirect(new URL(getRedirectPath(url), request.url));
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
