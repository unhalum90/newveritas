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
];

const authPaths = ["/login", "/signup", "/student/login", "/activate"];

function isMarketingPath(pathname: string) {
  return marketingPaths.some((path) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)));
}

function isAuthPath(pathname: string) {
  return authPaths.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public marketing pages to render, even if the user is signed in.
  if (isMarketingPath(pathname)) {
    return NextResponse.next();
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
