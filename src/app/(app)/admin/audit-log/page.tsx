import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AuditLogClient } from "./audit-log-client";

export const metadata = {
    title: "Audit Log | SayVeritas Admin",
    description: "View assessment audit trail for accountability and compliance",
};

async function getAuditLogs() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Check if user is platform admin
    const admin = createSupabaseAdminClient();
    const { data: platformAdmin } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!platformAdmin) {
        redirect("/dashboard");
    }

    // Fetch recent audit logs
    const { data: logs, error: logsError } = await admin
        .from("assessment_audit_log")
        .select(`
      id,
      submission_id,
      assessment_id,
      student_id,
      event_type,
      actor_id,
      actor_role,
      previous_value,
      new_value,
      reason,
      created_at
    `)
        .order("created_at", { ascending: false })
        .limit(200);

    if (logsError) {
        console.error("Failed to fetch audit logs:", logsError);
        return { logs: [], error: logsError.message };
    }

    return { logs: logs ?? [], error: null };
}

export default async function AuditLogPage() {
    const { logs, error } = await getAuditLogs();

    return (
        <div className="min-h-screen bg-[var(--background)] p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Audit Log</h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Assessment-related events for accountability and compliance review.
                    </p>
                </div>

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        Failed to load audit logs: {error}
                    </div>
                ) : (
                    <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading...</div>}>
                        <AuditLogClient initialLogs={logs} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
