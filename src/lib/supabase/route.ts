import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export type CookieToSet = { name: string; value: string; options: CookieOptions };

export function createRouteSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const pending: CookieToSet[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        pending.push(...(cookies as CookieToSet[]));
      },
    },
  });

  const pendingCookies = Object.assign(pending, {
    apply(response: NextResponse) {
      pending.forEach((c) => {
        response.cookies.set(c.name, c.value, c.options);
      });
    },
  });

  return { supabase, pendingCookies };
}

