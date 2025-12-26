import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { DEFAULT_PLEDGE_TEXT, getClientIpFromHeaders } from "@/lib/integrity/pledge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const bodySchema = z.object({
  accepted: z.literal(true),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

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
  if (submission.status !== "started") return NextResponse.json({ error: "Already submitted." }, { status: 409 });

  const { data: integrity, error: iError } = await admin
    .from("assessment_integrity")
    .select("pledge_enabled, pledge_version, pledge_text")
    .eq("assessment_id", submission.assessment_id)
    .maybeSingle();

  if (iError) return NextResponse.json({ error: iError.message }, { status: 500 });
  if (!integrity?.pledge_enabled) return NextResponse.json({ error: "Pledge is not required for this assessment." }, { status: 409 });
  if (submission.integrity_pledge_accepted_at) {
    const res = NextResponse.json({ ok: true, alreadyAccepted: true });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const now = new Date().toISOString();
  const ip = getClientIpFromHeaders(request.headers);
  const pledgeVersion = typeof integrity.pledge_version === "number" ? integrity.pledge_version : 1;
  const pledgeText =
    typeof integrity.pledge_text === "string" && integrity.pledge_text.trim() ? integrity.pledge_text : DEFAULT_PLEDGE_TEXT;

  const { error: updateError } = await admin
    .from("submissions")
    .update({
      integrity_pledge_accepted_at: now,
      integrity_pledge_ip_address: ip,
      integrity_pledge_version: pledgeVersion,
    })
    .eq("id", submissionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, accepted_at: now, pledge_version: pledgeVersion, pledge_text: pledgeText });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

