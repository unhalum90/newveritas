import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

// ... (existing imports)

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

  // 1. Fetch Summative Assessments (existing logic)
  const { data: assessments, error: aError } = await admin
    .from("assessments")
    .select("id, title, status, published_at, created_at, selected_asset_id, is_practice_mode")
    .eq("class_id", student.class_id)
    .eq("status", "live")
    .or("is_practice_mode.is.null,is_practice_mode.eq.false")
    .order("published_at", { ascending: false });

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });

  // Filter summative by assignments (existing logic)
  const ids = (assessments ?? []).map((a) => a.id);
  const { data: assignmentRows, error: assignmentError } = ids.length
    ? await admin
      .from("assessment_assignments")
      .select("assessment_id, student_id")
      .in("assessment_id", ids)
    : { data: [], error: null };

  if (assignmentError) return NextResponse.json({ error: assignmentError.message }, { status: 500 });

  const assignedByAssessment = new Map<string, Set<string>>();
  for (const row of assignmentRows ?? []) {
    const set = assignedByAssessment.get(row.assessment_id) ?? new Set<string>();
    if (row.student_id) set.add(row.student_id);
    assignedByAssessment.set(row.assessment_id, set);
  }

  const visibleAssessments = (assessments ?? []).filter((assessment) => {
    const assignedStudents = assignedByAssessment.get(assessment.id);
    if (!assignedStudents || assignedStudents.size === 0) return true;
    return assignedStudents.has(student.id);
  });

  // Fetch summative assets to get images
  const visibleIds = visibleAssessments.map((a) => a.id);
  const { data: assets, error: assetError } = visibleIds.length
    ? await admin
      .from("assessment_assets")
      .select("assessment_id, asset_url, created_at")
      .in("assessment_id", visibleIds)
      .eq("asset_type", "image")
      .order("created_at", { ascending: false })
    : { data: [], error: null };
  const assetUrlByAssessment = new Map<string, string>();
  for (const row of assets ?? []) {
    if (!assetUrlByAssessment.has(row.assessment_id)) assetUrlByAssessment.set(row.assessment_id, row.asset_url);
  }

  // Fetch summative submissions
  const { data: submissions, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, status, started_at, submitted_at, review_status, published_at")
    .eq("student_id", student.id)
    .order("started_at", { ascending: false });
  const latestSubmissionByAssessment = new Map<string, NonNullable<typeof submissions>[number]>();
  for (const sub of submissions ?? []) {
    if (!latestSubmissionByAssessment.has(sub.assessment_id)) latestSubmissionByAssessment.set(sub.assessment_id, sub);
  }

  // 2. Fetch Formative Activities (Pulse/StudyLab)
  // These are linked via 'formative_assignments' table: activity_id <-> class_id
  const { data: formativeAssignments, error: faError } = await admin
    .from("formative_assignments")
    .select(`
      activity:formative_activities (
        id,
        title,
        status,
        type, 
        created_at,
        due_at
      )
    `)
    .eq("class_id", student.class_id);

  if (faError) return NextResponse.json({ error: faError.message }, { status: 500 });

  // Extract activities from the join
  const formativeActivities = (formativeAssignments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.activity?.[0] || row.activity) // Handle array vs object return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a && a.status === "live");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formativeIds = formativeActivities.map((a: any) => a.id);

  // Fetch formative submissions
  const { data: formativeSubmissions, error: fSubError } = formativeIds.length
    ? await admin
      .from("formative_submissions")
      .select("activity_id, status, submitted_at, reviewed_at")
      .eq("student_id", student.id)
      .in("activity_id", formativeIds)
    : { data: [], error: null };

  const formativeSubmissionMap = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const sub of formativeSubmissions ?? []) {
    formativeSubmissionMap.set(sub.activity_id, sub);
  }

  // 3. Merge & Normalize
  const mergedItems = [
    ...visibleAssessments.map(a => ({
      id: a.id,
      title: a.title,
      published_at: a.published_at,
      asset_url: assetUrlByAssessment.get(a.id) ?? null,
      is_practice_mode: a.is_practice_mode,
      type: "summative", // Distinction
      latest_submission: latestSubmissionByAssessment.get(a.id) ?? null
    })),

    ...formativeActivities.map((a: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const sub = formativeSubmissionMap.get(a.id);
      return {
        id: a.id,
        title: a.title,
        published_at: a.created_at, // Use created_at as published_at proxy
        asset_url: null, // No cover images for formative yet
        is_practice_mode: false,
        type: a.type || "pulse", // 'pulse' or 'studylab'
        latest_submission: sub ? {
          id: "virtual-id", // Not needed for display logic really
          status: sub.status === "reviewed" ? "submitted" : sub.status, // Normalize status
          started_at: sub.submitted_at || new Date().toISOString(),
          submitted_at: sub.submitted_at,
          review_status: sub.status === "reviewed" ? "published" : "pending", // Map 'reviewed' to 'published' for feedback badge
          published_at: sub.reviewed_at
        } : null
      };
    })
  ];

  // Sort unified list by published_at DESC
  mergedItems.sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());

  const res = NextResponse.json({
    assessments: mergedItems,
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
