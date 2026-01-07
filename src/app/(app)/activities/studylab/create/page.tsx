import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudyLabCreateForm } from "./studylab-create-form";

export default async function StudyLabCreatePage() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");

    // Get teacher's workspace
    const { data: teacher } = await supabase
        .from("teachers")
        .select("workspace_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    // Get teacher's classes for assignment
    const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("workspace_id", teacher?.workspace_id ?? "")
        .order("name");

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--text)]">Create StudyLab Session</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Set up an AI-guided Socratic study session for your students.
                </p>
            </div>

            <StudyLabCreateForm
                teacherId={data.user.id}
                classes={classes ?? []}
            />
        </div>
    );
}
