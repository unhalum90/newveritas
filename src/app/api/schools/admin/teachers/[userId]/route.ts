import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSchoolAdminContext } from "@/lib/auth/school-admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const patchSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  disabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireSchoolAdminContext(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    // Ensure the teacher is within this school.
    const { data: existing, error: existingError } = await ctx.admin
      .from("teachers")
      .select("user_id,disabled")
      .eq("user_id", userId)
      .eq("school_id", ctx.schoolId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (typeof parsed.data.disabled === "boolean" && parsed.data.disabled !== existing.disabled) {
      // "Disable" means prevent sign-in; we also store a local flag for UI and safety.
      await ctx.admin.auth.admin.updateUserById(userId, {
        ban_duration: parsed.data.disabled ? "876000h" : "none",
      });
    }

    const { data: updated, error: updateError } = await ctx.admin
      .from("teachers")
      .update(parsed.data)
      .eq("user_id", userId)
      .eq("school_id", ctx.schoolId)
      .select("user_id,email,first_name,last_name,disabled,created_at")
      .single();
    if (updateError) throw updateError;

    const res = NextResponse.json({ teacher: updated });
    ctx.pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}

