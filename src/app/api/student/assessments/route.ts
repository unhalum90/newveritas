import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(data.user);
  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, class_id, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) {
    if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });

  const { data: assessments, error: aError } = await admin
    .from("assessments")
    .select("id, title, status, published_at, created_at, selected_asset_id, is_practice_mode")
    .eq("class_id", student.class_id)
    .eq("status", "live")
    .order("published_at", { ascending: false });

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });

  const ids = (assessments ?? []).map((a) => a.id);
  const { data: assets, error: assetError } = ids.length
    ? await admin
        .from("assessment_assets")
        .select("assessment_id, asset_url, created_at")
        .in("assessment_id", ids)
        .eq("asset_type", "image")
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const assetUrlByAssessment = new Map<string, string>();
  for (const row of assets ?? []) {
    if (!assetUrlByAssessment.has(row.assessment_id)) assetUrlByAssessment.set(row.assessment_id, row.asset_url);
  }

  const { data: submissions, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, status, started_at, submitted_at, review_status, published_at")
    .eq("student_id", student.id)
    .order("started_at", { ascending: false });

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  const latestSubmissionByAssessment = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions ?? []) {
    if (!latestSubmissionByAssessment.has(sub.assessment_id)) latestSubmissionByAssessment.set(sub.assessment_id, sub);
  }

  const res = NextResponse.json({
    assessments: (assessments ?? []).map((a) => ({
      ...a,
      asset_url: assetUrlByAssessment.get(a.id) ?? null,
      latest_submission: latestSubmissionByAssessment.get(a.id) ?? null,
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
