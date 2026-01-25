import { NextRequest, NextResponse } from "next/server";

import { requireSchoolAdminContext } from "@/lib/auth/school-admin";

export async function GET(request: NextRequest) {
    const context = await requireSchoolAdminContext(request);

    if ("error" in context) {
        return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { admin, schoolId, pendingCookies } = context;

    // Fetch aggregated data from the view
    const { data, error } = await admin
        .from("admin_integrity_reports")
        .select("*")
        .eq("school_id", schoolId)
        .order("report_week", { ascending: false });

    if (error) {
        console.error("Failed to fetch integrity reports:", error);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    const response = NextResponse.json({ reports: data });
    pendingCookies.apply(response);
    return response;
}
