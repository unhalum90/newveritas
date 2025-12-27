import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const releaseSchema = z.object({
  teacher_comment: z.string().trim().max(2000).optional().nullable(),
  final_score_override: z.number().min(0).max(5).optional().nullable(),
});

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = releaseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: teacher, error: tError } = await admin
    .from("teachers")
    .select("id, workspace_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (tError) return NextResponse.json({ error: tError.message }, { status: 500 });
  if (!teacher?.workspace_id) return NextResponse.json({ error: "Teacher workspace not found." }, { status: 404 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, status, scoring_status")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.status !== "submitted") {
    return NextResponse.json({ error: "Submission must be submitted first." }, { status: 409 });
  }
  if (submission.scoring_status !== "complete") {
    return NextResponse.json({ error: "Scoring must complete before release." }, { status: 409 });
  }

  const { data: assessment, error: aError } = await admin
    .from("assessments")
    .select("id, class_id")
    .eq("id", submission.assessment_id)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });

  const { data: cls, error: cError } = await admin
    .from("classes")
    .select("workspace_id")
    .eq("id", assessment.class_id)
    .maybeSingle();

  if (cError) return NextResponse.json({ error: cError.message }, { status: 500 });
  if (!cls || cls.workspace_id !== teacher.workspace_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let finalScore = typeof parsed.data.final_score_override === "number" ? parsed.data.final_score_override : null;
  if (finalScore === null) {
    const { data: scores, error: scoreError } = await admin
      .from("question_scores")
      .select("score")
      .eq("submission_id", submissionId);

    if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });
    const values = (scores ?? []).map((s) => s.score).filter((n): n is number => typeof n === "number");
    finalScore = avg(values);
  }

  const now = new Date().toISOString();
  const comment = parsed.data.teacher_comment?.trim() || null;

  const { data: updated, error: updateError } = await admin
    .from("submissions")
    .update({
      review_status: "published",
      teacher_comment: comment,
      published_at: now,
      final_score_override: finalScore,
    })
    .eq("id", submissionId)
    .select("id, review_status, published_at, teacher_comment, final_score_override")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  try {
    await admin.from("system_logs").insert({
      event_type: "feedback_released",
      provider: "veritas",
      severity: "info",
      message: `Feedback released for submission ${submissionId}`,
      metadata: { submission_id: submissionId, assessment_id: submission.assessment_id },
    });
  } catch {
    // Ignore log failures to avoid blocking feedback release.
  }

  const res = NextResponse.json({ ok: true, submission: updated });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
