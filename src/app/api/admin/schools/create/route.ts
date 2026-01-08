import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

const schema = z.object({
    school_name: z.string().min(2),
    country: z.string().optional().nullable(),
    school_type: z.string().optional().nullable(),
    admin_email: z.string().email(),
    admin_first_name: z.string().min(1),
    admin_last_name: z.string().min(1),
});

/**
 * Platform Admin endpoint to create a school with an admin and send invite
 * POST /api/admin/schools/create
 */
export async function POST(request: NextRequest) {
    // Require platform admin
    try {
        await requirePlatformAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { school_name, country, school_type, admin_email, admin_first_name, admin_last_name } = parsed.data;

    try {
        const admin = createSupabaseAdminClient();

        // 1. Create the school
        const { data: school, error: schoolError } = await admin
            .from("schools")
            .insert({
                name: school_name,
                country: country ?? null,
                school_type: school_type ?? null,
            })
            .select("id, name")
            .single();
        if (schoolError) throw schoolError;

        // 2. Create default workspace for the school
        const { data: workspace, error: workspaceError } = await admin
            .from("workspaces")
            .insert({ school_id: school.id, name: "Main Workspace" })
            .select("id")
            .single();
        if (workspaceError) throw workspaceError;

        // 3. Create the admin user via Supabase Auth Admin API
        // This will create the user and optionally send an invite email
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: admin_email,
            email_confirm: false, // Don't auto-confirm, we'll send invite
            user_metadata: {
                role: "school_admin",
                first_name: admin_first_name,
                last_name: admin_last_name,
                school_id: school.id,
            },
        });
        if (authError) throw authError;

        // 4. Link admin to school in school_admins table
        const { error: linkError } = await admin
            .from("school_admins")
            .insert({
                user_id: authData.user.id,
                school_id: school.id,
            });
        if (linkError) throw linkError;

        // 5. Send the magic link invite
        const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(admin_email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sayveritas.com"}/auth/confirm`,
        });
        if (inviteError) {
            console.error("Failed to send invite email:", inviteError);
            // Don't fail the whole operation, admin can resend later
        }

        return NextResponse.json({
            success: true,
            school: {
                id: school.id,
                name: school.name,
            },
            workspace_id: workspace.id,
            admin: {
                id: authData.user.id,
                email: admin_email,
                invite_sent: !inviteError,
            },
        });
    } catch (e) {
        console.error("School creation error:", e);
        return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
    }
}
