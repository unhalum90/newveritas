import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { scoreSubmission } from "@/lib/scoring/submission";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, consent_audio, consent_revoked_at, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });
  if (!student.consent_audio || student.consent_revoked_at) {
    return NextResponse.json({ error: "Audio consent required." }, { status: 409 });
  }

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, assessment_id, status, integrity_pledge_accepted_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Already submitted." }, { status: 409 });

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();
  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (integrity?.pledge_enabled && !submission.integrity_pledge_accepted_at) {
    return NextResponse.json({ error: "Accept the academic integrity pledge before submitting." }, { status: 409 });
  }

  const { data: assessment, error: aError } = await admin
    .from("assessments")
    .select("id, is_practice_mode")
    .eq("id", submission.assessment_id)
    .maybeSingle();
  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  const isPracticeMode = Boolean(assessment?.is_practice_mode);

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("submissions")
    .update({
      status: "submitted",
      submitted_at: now,
      scoring_status: "pending",
      scoring_started_at: null,
      scored_at: null,
      scoring_error: null,
    })
    .eq("id", submissionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (isPracticeMode) {
    void scoreSubmission(submissionId)
      .then(async () => {
        await admin
          .from("submissions")
          .update({ review_status: "published", published_at: new Date().toISOString() })
          .eq("id", submissionId);
      })
      .catch((e) => {
        console.error("Practice scoring failed for submission", submissionId, e);
      });
  } else {
    void scoreSubmission(submissionId).catch((e) => {
      console.error("Scoring failed for submission", submissionId, e);
    });
  }

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
