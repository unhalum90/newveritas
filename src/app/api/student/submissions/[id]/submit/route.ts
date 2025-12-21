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
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Already submitted." }, { status: 409 });

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

  void scoreSubmission(submissionId).catch((e) => {
    console.error("Scoring failed for submission", submissionId, e);
  });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
