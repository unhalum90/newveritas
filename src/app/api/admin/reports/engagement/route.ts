import { NextRequest, NextResponse } from "next/server";
import { requireSchoolAdminContext } from "@/lib/auth/school-admin";
import { getEngagementMetrics } from "@/lib/tracking/engagement";

export async function GET(request: NextRequest) {
    const context = await requireSchoolAdminContext(request);

    if ("error" in context) {
        return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { admin, schoolId, pendingCookies } = context;

    // Fetch submissions for this school that might have protracted interactions
    const { data: submissions, error } = await admin
        .from("submissions")
        .select(`
      id,
      started_at,
      submitted_at,
      student:students (
        id,
        first_name,
        last_name
      ),
      assessment:assessments (
        title
      )
    `)
        .eq("data_classification", "educational") // Filter by classification if needed
        // Join with school via assessment -> class -> workspace
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch submissions for engagement:", error);
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    // Calculate metrics for each submission
    const reports = await Promise.all((submissions || []).map(async (sub) => {
        const metrics = await getEngagementMetrics(sub.id);
        return {
            submissionId: sub.id,
            studentName: sub.student ? `${(sub.student as any).first_name} ${(sub.student as any).last_name}` : "Unknown",
            assessmentTitle: (sub.assessment as any)?.title || "Unknown",
            submittedAt: sub.submitted_at,
            ...metrics
        };
    }));

    // Filter for 'protracted' interactions (e.g., > 30 mins or > 5 re-engagements)
    // These thresholds can be adjusted based on school policy
    const protractedReports = reports.filter(r =>
        (r as any).totalTimeSpentMinutes > 30 || (r as any).reEngagementCount > 5
    );

    const response = NextResponse.json({ reports: protractedReports });
    pendingCookies.apply(response);
    return response;
}
