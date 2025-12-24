import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSchoolAdminContext } from "@/lib/auth/school-admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const createSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
});

function randomPassword() {
  // Simple, copyable temp password (v1). In production, prefer magic-link or reset flow.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

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
    const tempPassword = randomPassword();
    const { data: created, error: createError } = await ctx.admin.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "teacher" },
    });
    if (createError) throw createError;
    if (!created.user) throw new Error("Unable to create teacher user.");

    const { data: teacher, error: teacherError } = await ctx.admin
      .from("teachers")
      .insert({
        user_id: created.user.id,
        email: parsed.data.email,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        school_id: ctx.schoolId,
        workspace_id: ctx.workspaceId,
        onboarding_stage: "COMPLETE",
      })
      .select("user_id,email,first_name,last_name,disabled,created_at")
      .single();
    if (teacherError) throw teacherError;

    const res = NextResponse.json({ teacher, temp_password: tempPassword });
    ctx.pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}

