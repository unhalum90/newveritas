import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
    userId: z.string().uuid(),
    userType: z.enum(["teacher", "student"]),
    version: z.string().default("v1"),
});

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { userId, userType, version } = parsed.data;
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    try {
        // 1. Log the acknowledgment
        await admin.from("privacy_notice_log").insert({
            user_id: userId,
            user_type: userType,
            notice_version: version,
            shown_at: now,
        });

        // 2. Update the user's last_privacy_notice_shown
        const table = userType === "teacher" ? "teachers" : "students";
        const column = userType === "teacher" ? "user_id" : "auth_user_id";
        await admin
            .from(table)
            .update({ last_privacy_notice_shown: now } as any)
            .eq(column, userId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Privacy notice acknowledgment failed", e);
        return NextResponse.json({ error: "Failed to save acknowledgment" }, { status: 500 });
    }
}
