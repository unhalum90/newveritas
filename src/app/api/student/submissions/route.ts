import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const createSchema = z.object({
  assessment_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, class_id, consent_audio, consent_revoked_at, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });
  if (!student.consent_audio || student.consent_revoked_at) {
    return NextResponse.json({ error: "Audio consent required." }, { status: 409 });
  }

  const assessmentId = parsed.data.assessment_id;
  const { data: assessment, error: aError } = await admin
    .from("assessments")
    .select("id, class_id, status")
    .eq("id", assessmentId)
    .maybeSingle();

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.class_id !== student.class_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (assessment.status !== "live") return NextResponse.json({ error: "Not available." }, { status: 409 });

  const { data: existing, error: exError } = await admin
    .from("submissions")
    .select("id, status, started_at, submitted_at")
    .eq("assessment_id", assessmentId)
    .eq("student_id", student.id)
    .eq("status", "started")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exError) return NextResponse.json({ error: exError.message }, { status: 500 });
  if (existing) {
    const res = NextResponse.json({ ok: true, submission: existing, reused: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const { data: priorPledge, error: pledgeError } = await admin
    .from("submissions")
    .select("integrity_pledge_accepted_at, integrity_pledge_version, integrity_pledge_ip_address")
    .eq("assessment_id", assessmentId)
    .eq("student_id", student.id)
    .not("integrity_pledge_accepted_at", "is", null)
    .order("integrity_pledge_accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pledgeError) return NextResponse.json({ error: pledgeError.message }, { status: 500 });

  const payload: Record<string, unknown> = {
    assessment_id: assessmentId,
    student_id: student.id,
  };
  if (priorPledge?.integrity_pledge_accepted_at) {
    payload.integrity_pledge_accepted_at = priorPledge.integrity_pledge_accepted_at;
    payload.integrity_pledge_version = priorPledge.integrity_pledge_version ?? null;
    payload.integrity_pledge_ip_address = priorPledge.integrity_pledge_ip_address ?? null;
  }

  const { data: created, error: createError } = await admin
    .from("submissions")
    .insert(payload)
    .select("id, status, started_at, submitted_at")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, submission: created, reused: false });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
