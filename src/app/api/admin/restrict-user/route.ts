import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const restrictSchema = z
  .object({
    student_id: z.string().uuid().optional(),
    auth_user_id: z.string().uuid().optional(),
    restricted: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.student_id || data.auth_user_id), {
    message: "Provide student_id or auth_user_id.",
  });

export async function POST(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(data.user);
  if (role !== "platform_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: allowlisted } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!allowlisted?.user_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = restrictSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const restricted = parsed.data.restricted ?? true;
  const now = new Date().toISOString();
  const update = restricted
    ? { disabled: true, consent_audio: false, consent_revoked_at: now }
    : { disabled: false };

  const query = admin.from("students").update(update).select("id, disabled, consent_audio, consent_revoked_at").limit(1);
  const { data: student, error: uError } = parsed.data.student_id
    ? await query.eq("id", parsed.data.student_id).maybeSingle()
    : await query.eq("auth_user_id", parsed.data.auth_user_id).maybeSingle();

  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const res = NextResponse.json({ ok: true, student });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
