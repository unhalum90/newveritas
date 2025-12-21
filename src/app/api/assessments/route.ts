import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: teacher } = await supabase
    .from("teachers")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id")
    .eq("workspace_id", teacher?.workspace_id ?? "");

  if (classesError) return NextResponse.json({ error: "Classes lookup failed." }, { status: 500 });

  const classIds = classes?.map((c) => c.id) ?? [];
  if (classIds.length === 0) {
    const res = NextResponse.json({ assessments: [] });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: assessments, error: listError } = await supabase
    .from("assessments")
    .select("id, title, status, authoring_mode, created_at, class_id")
    .in("class_id", classIds)
    .order("created_at", { ascending: false });

  if (listError) return NextResponse.json({ error: "Assessment lookup failed." }, { status: 500 });

  const res = NextResponse.json({ assessments: assessments ?? [] });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const createSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1),
  subject: z.string().optional().nullable(),
  target_language: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  authoring_mode: z.enum(["manual", "upload", "ai"]).default("manual"),
  source_reference: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { data: created, error: createError } = await supabase
    .from("assessments")
    .insert({
      class_id: parsed.data.class_id,
      title: parsed.data.title,
      subject: parsed.data.subject ?? null,
      target_language: parsed.data.target_language ?? null,
      instructions: parsed.data.instructions ?? null,
      authoring_mode: parsed.data.authoring_mode,
    })
    .select("id")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  await supabase.from("assessment_integrity").insert({ assessment_id: created.id });

  if (parsed.data.authoring_mode !== "manual" && parsed.data.source_reference) {
    await supabase.from("assessment_sources").insert({
      assessment_id: created.id,
      source_type: parsed.data.authoring_mode === "upload" ? "upload" : "ai",
      source_reference: parsed.data.source_reference,
    });
  }

  const res = NextResponse.json({ ok: true, id: created.id });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
