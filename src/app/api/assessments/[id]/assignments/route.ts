import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const updateSchema = z.object({
  mode: z.enum(["all", "selected"]),
  student_ids: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assignments, error: listError } = await supabase
    .from("assessment_assignments")
    .select("student_id")
    .eq("assessment_id", id);

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const res = NextResponse.json({
    student_ids: (assignments ?? []).map((row) => row.student_id).filter((id): id is string => Boolean(id)),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, class_id, status")
    .eq("id", id)
    .maybeSingle();

  if (assessmentError) return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.status !== "draft") {
    return NextResponse.json({ error: "Only draft assessments can be updated." }, { status: 409 });
  }

  if (parsed.data.mode === "all") {
    const { error: deleteError } = await supabase.from("assessment_assignments").delete().eq("assessment_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const res = NextResponse.json({ ok: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const studentIds = Array.from(new Set(parsed.data.student_ids ?? []));
  if (!studentIds.length) return NextResponse.json({ error: "Select at least one student." }, { status: 400 });
  if (!assessment.class_id) {
    return NextResponse.json({ error: "Assign a class before selecting students." }, { status: 409 });
  }

  const { data: validStudents, error: studentsError } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", assessment.class_id)
    .in("id", studentIds);

  if (studentsError) return NextResponse.json({ error: studentsError.message }, { status: 500 });

  const validIds = new Set((validStudents ?? []).map((row) => row.id));
  if (validIds.size !== studentIds.length) {
    return NextResponse.json({ error: "One or more students are not in this class." }, { status: 400 });
  }

  const { error: clearError } = await supabase.from("assessment_assignments").delete().eq("assessment_id", id);
  if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 });

  const { error: insertError } = await supabase
    .from("assessment_assignments")
    .insert(studentIds.map((studentId) => ({ assessment_id: id, student_id: studentId })));

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
