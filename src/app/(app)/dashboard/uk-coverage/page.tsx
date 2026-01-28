import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UKCoverageReport } from "@/components/uk/coverage-report";
import Link from "next/link";

export default async function UKCoveragePage() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");

    // Check if teacher is in UK
    const { data: teacher } = await supabase
        .from("teachers")
        .select("workspace_id, schools(locale)")
        .eq("user_id", data.user.id)
        .maybeSingle();

    const isUK = (teacher?.schools as { locale?: string })?.locale === "UK";
    if (!isUK) redirect("/dashboard");

    // Fetch classes for the workspace
    const { data: classes } = teacher?.workspace_id
        ? await supabase
            .from("classes")
            .select("id, name")
            .eq("workspace_id", teacher.workspace_id)
            .order("name", { ascending: true })
        : { data: [] };

    // Fetch assessments for the workspace with UK Curriculum fields
    const { data: assessments } = await supabase
        .from("assessments")
        .select("id, title, key_stage, year_group, nc_subject, activity_context, created_at, class_id")
        .eq("curriculum_region", "UK")
        .not("key_stage", "is", null) // Only show ones with curriculum data
        .order("created_at", { ascending: false });

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Link href="/dashboard" className="hover:text-[var(--primary)] transition-colors">Dashboard</Link>
                <span>/</span>
                <span className="text-[var(--text)]">UK Coverage</span>
            </div>

            <UKCoverageReport
                data={{
                    assessments: assessments ?? [],
                    classes: classes ?? []
                }}
            />
        </div>
    );
}
