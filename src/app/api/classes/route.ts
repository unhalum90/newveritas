import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (teacherError) return NextResponse.json({ error: "Teacher lookup failed." }, { status: 500 });
  if (!teacher?.workspace_id) return NextResponse.json({ classes: [] });

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, description, access_mode, created_at")
    .eq("workspace_id", teacher.workspace_id)
    .order("created_at", { ascending: false });

  if (classesError) return NextResponse.json({ error: "Classes lookup failed." }, { status: 500 });

  const res = NextResponse.json({ classes });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  access_mode: z.enum(["code", "email", "sso"]).default("code"),
});

export async function POST(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (teacherError) return NextResponse.json({ error: "Teacher lookup failed." }, { status: 500 });
  if (!teacher?.workspace_id) {
    return NextResponse.json({ error: "Complete onboarding before creating classes." }, { status: 409 });
  }

  const { data: created, error: createError } = await supabase
    .from("classes")
    .insert({
      workspace_id: teacher.workspace_id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      access_mode: parsed.data.access_mode,
    })
    .select("id")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, id: created.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
