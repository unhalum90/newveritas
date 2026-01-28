import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const marketingPaths = [
  "/",
  "/about",
  "/pricing",
  "/privacy",
  "/how-it-works",
  "/webinars",
  "/assessment-types",
  "/class-analysis-report",
  "/use-cases",
  "/security-privacy",
  "/assessment-playbook",
  "/roadmap",
  "/waitlist",
  "/studylab",
  "/pulse",
  // Oxford Green compliance pages
  "/ai-safety",
  "/ai-use",
  "/evidence-outcomes",
  "/subprocessors",
];

const authPaths = ["/login", "/signup", "/student/login", "/activate", "/auth/callback", "/auth/confirm"];

function isMarketingPath(pathname: string) {
  return marketingPaths.some((path) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)));
}

function isAuthPath(pathname: string) {
  return authPaths.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Domain routing & Geo-detection (Sprint 1)
  const host = request.headers.get("host") || "";
  const country = (request as any).geo?.country || "US";
  const isUKDomain = host.includes("sayveritas.co.uk");
  const preferredRegion = request.cookies.get("preferred_region")?.value;

  // Auto-redirect UK users on landing if they haven't explicitly set a preference
  if (!isUKDomain && host.includes("sayveritas.com") && country === "GB" && !preferredRegion) {
    const url = request.nextUrl.clone();
    url.host = "sayveritas.co.uk";
    const response = NextResponse.redirect(url);
    // Note: Cookies set on redirect may not be sticky across domains, 
    // but .co.uk will detect its domain and set its own context.
    return response;
  }

  // Always allow public marketing pages to render, even if the user is signed in.
  // Set marketing_locale cookie based on domain for client-side locale detection
  if (isMarketingPath(pathname)) {
    const response = NextResponse.next();

    // Set marketing_locale cookie if user is on UK domain
    const existingMarketingLocale = request.cookies.get("marketing_locale")?.value;
    if (!existingMarketingLocale) {
      // Set based on domain
      const marketingLocale = isUKDomain ? "UK" : "US";
      response.cookies.set("marketing_locale", marketingLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });
    }

    return response;
  }

  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const signedIn = Boolean(data.user);
  const role = (data.user?.user_metadata as { role?: string } | undefined)?.role;
  const isStudent = role === "student";

  if (!signedIn) {
    if (isAuthPath(pathname)) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isStudent) {
    if (pathname.startsWith("/student") || pathname === "/activate") return response;
    if (isAuthPath(pathname)) return NextResponse.redirect(new URL("/student", request.url));
    return NextResponse.redirect(new URL("/student", request.url));
  }

  if (isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
