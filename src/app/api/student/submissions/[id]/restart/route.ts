import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const requestSchema = z.object({
  reason: z.enum(["slow_start", "off_topic"]),
  question_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, student_id, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Cannot restart after submit." }, { status: 409 });

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("allow_grace_restart")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (!integrity?.allow_grace_restart) {
    return NextResponse.json({ error: "Grace restart is not enabled for this assessment." }, { status: 409 });
  }

  const { data: existingRestart, error: restartError } = await admin
    .from("assessment_restart_events")
    .select("id")
    .eq("assessment_id", submission.assessment_id)
    .eq("student_id", student.id)
    .maybeSingle();
  if (restartError) return NextResponse.json({ error: restartError.message }, { status: 500 });
  if (existingRestart) return NextResponse.json({ error: "Restart already used." }, { status: 409 });

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("submissions")
    .update({
      status: "restarted",
      submitted_at: now,
      scoring_status: "complete",
      scoring_started_at: null,
      scored_at: now,
      scoring_error: "Restarted by student",
    })
    .eq("id", submissionId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: created, error: createError } = await admin
    .from("submissions")
    .insert({ assessment_id: submission.assessment_id, student_id: student.id })
    .select("id, status, started_at, submitted_at")
    .single();
  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  const { error: eventError } = await admin.from("assessment_restart_events").insert({
    assessment_id: submission.assessment_id,
    student_id: student.id,
    submission_id: submission.id,
    new_submission_id: created.id,
    question_id: parsed.data.question_id ?? null,
    restart_reason: parsed.data.reason,
    created_at: now,
  });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, submission: created });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
