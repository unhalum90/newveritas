import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();

  const { data: student, error: sError } = await admin
    .from("students")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student record not found." }, { status: 404 });

  const { data: submission, error: subError } = await admin
    .from("submissions")
    .select("id, student_id, assessment_id, status, integrity_pledge_accepted_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (submission.student_id !== student.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (submission.status !== "started") return NextResponse.json({ error: "Cannot accept pledge after submit." }, { status: 409 });

  const { data: integrity, error: integrityError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled, pledge_version")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();

  if (integrityError) return NextResponse.json({ error: integrityError.message }, { status: 500 });

  if (!integrity?.pledge_enabled) {
    const res = NextResponse.json({ ok: true, skipped: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  if (submission.integrity_pledge_accepted_at) {
    const res = NextResponse.json({ ok: true, accepted: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const ip = getClientIp(request);
  const now = new Date().toISOString();
  const version = integrity.pledge_version ?? 1;

  const { error: updateError } = await admin
    .from("submissions")
    .update({
      integrity_pledge_accepted_at: now,
      integrity_pledge_ip_address: ip,
      integrity_pledge_version: version,
    })
    .eq("id", submissionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, accepted: true, pledge_version: version });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

