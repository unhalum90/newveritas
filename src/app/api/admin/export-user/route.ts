import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(data.user);
  if (role !== "platform_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: allowlisted } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!allowlisted?.user_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const studentId = params.get("student_id");
  const authUserId = params.get("auth_user_id");
  if (!studentId && !authUserId) {
    return NextResponse.json({ error: "Provide student_id or auth_user_id." }, { status: 400 });
  }

  const studentQuery = admin
    .from("students")
    .select("*")
    .limit(1);

  const { data: student, error: sError } = studentId
    ? await studentQuery.eq("id", studentId).maybeSingle()
    : await studentQuery.eq("auth_user_id", authUserId).maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const { data: submissions, error: subError } = await admin
    .from("submissions")
    .select("*")
    .eq("student_id", student.id);
  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const assessmentIds = Array.from(new Set((submissions ?? []).map((s) => s.assessment_id)));

  const { data: responses, error: rError } = submissionIds.length
    ? await admin.from("submission_responses").select("*").in("submission_id", submissionIds)
    : { data: [], error: null };
  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const { data: evidenceImages, error: eError } = submissionIds.length
    ? await admin.from("evidence_images").select("*").in("submission_id", submissionIds)
    : { data: [], error: null };
  if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });

  const { data: integrityEvents, error: iError } = submissionIds.length
    ? await admin.from("integrity_events").select("*").in("submission_id", submissionIds)
    : { data: [], error: null };
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });

  const { data: scores, error: scError } = submissionIds.length
    ? await admin.from("question_scores").select("*").in("submission_id", submissionIds)
    : { data: [], error: null };
  if (scError) return NextResponse.json({ error: scError.message }, { status: 500 });

  const { data: assessments, error: aError } = assessmentIds.length
    ? await admin.from("assessments").select("*").in("id", assessmentIds)
    : { data: [], error: null };
  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });

  const res = NextResponse.json({
    exported_at: new Date().toISOString(),
    student,
    submissions: submissions ?? [],
    submission_responses: responses ?? [],
    evidence_images: evidenceImages ?? [],
    integrity_events: integrityEvents ?? [],
    question_scores: scores ?? [],
    assessments: assessments ?? [],
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
