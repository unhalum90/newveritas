import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSchoolAdminContext } from "@/lib/auth/school-admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { sendTeacherInviteEmail } from "@/lib/email/teacher-invite";

const createSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  const ctx = await requireSchoolAdminContext(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const { data: teachers, error } = await ctx.admin
      .from("teachers")
      .select("user_id,email,first_name,last_name,disabled,created_at")
      .eq("school_id", ctx.schoolId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const res = NextResponse.json({ teachers: teachers ?? [] });
    ctx.pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireSchoolAdminContext(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.workspaceId) return NextResponse.json({ error: "No workspace found for school." }, { status: 409 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    // Get school name for the invite email
    const { data: school } = await ctx.admin
      .from("schools")
      .select("name")
      .eq("id", ctx.schoolId)
      .single();
    const schoolName = school?.name || "Your School";

    // Create user WITHOUT password - they'll use magic link
    const { data: created, error: createError } = await ctx.admin.auth.admin.createUser({
      email: parsed.data.email,
      email_confirm: false, // Don't auto-confirm, they need to click link
      user_metadata: {
        role: "teacher",
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
      },
    });
    if (createError) throw createError;
    if (!created.user) throw new Error("Unable to create teacher user.");

    // Create teacher record
    const { data: teacher, error: teacherError } = await ctx.admin
      .from("teachers")
      .insert({
        user_id: created.user.id,
        email: parsed.data.email,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        school_id: ctx.schoolId,
        workspace_id: ctx.workspaceId,
        onboarding_stage: "COMPLETE", // Skip onboarding for school-provisioned teachers
      })
      .select("user_id,email,first_name,last_name,disabled,created_at")
      .single();
    if (teacherError) throw teacherError;

    // Generate magic link for the invite
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sayveritas.com";
    const { data: linkData, error: linkError } = await ctx.admin.auth.admin.generateLink({
      type: "invite",
      email: parsed.data.email,
      options: {
        redirectTo: `${siteUrl}/auth/confirm`,
      },
    });

    let inviteSent = false;
    if (linkError) {
      console.error("Failed to generate invite link:", linkError);
      // Fallback: use Supabase's built-in invite
      try {
        await ctx.admin.auth.admin.inviteUserByEmail(parsed.data.email, {
          redirectTo: `${siteUrl}/auth/confirm`,
        });
        inviteSent = true;
      } catch (inviteErr) {
        console.error("Fallback invite also failed:", inviteErr);
      }
    } else if (linkData?.properties?.action_link) {
      // Use the action_link from generateLink
      const inviteLink = linkData.properties.action_link;

      // Send branded email via MailerLite
      const emailResult = await sendTeacherInviteEmail({
        email: parsed.data.email,
        firstName: parsed.data.first_name,
        lastName: parsed.data.last_name,
        schoolName,
        inviteLink,
      });
      inviteSent = emailResult.success;

      if (!inviteSent) {
        // Fallback: use Supabase's built-in invite
        await ctx.admin.auth.admin.inviteUserByEmail(parsed.data.email, {
          redirectTo: `${siteUrl}/auth/confirm`,
        });
        inviteSent = true;
      }
    }

    const res = NextResponse.json({
      teacher,
      invite_sent: inviteSent,
      message: inviteSent
        ? "Teacher created and invite sent!"
        : "Teacher created. They can use 'forgot password' to get access.",
    });
    ctx.pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}
