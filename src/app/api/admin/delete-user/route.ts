import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const deleteSchema = z
  .object({
    student_id: z.string().uuid().optional(),
    auth_user_id: z.string().uuid().optional(),
    delete_auth_user: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.student_id || data.auth_user_id), {
    message: "Provide student_id or auth_user_id.",
  });

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

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
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const studentQuery = admin.from("students").select("id, auth_user_id");
  const { data: student, error: sError } = parsed.data.student_id
    ? await studentQuery.eq("id", parsed.data.student_id).maybeSingle()
    : await studentQuery.eq("auth_user_id", parsed.data.auth_user_id).maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const { data: submissions, error: subError } = await admin
    .from("submissions")
    .select("id")
    .eq("student_id", student.id);
  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  const submissionIds = (submissions ?? []).map((s) => s.id);

  const { data: responses, error: rError } = submissionIds.length
    ? await admin
        .from("submission_responses")
        .select("storage_bucket, storage_path")
        .in("submission_id", submissionIds)
    : { data: [], error: null };
  if (rError) return NextResponse.json({ error: rError.message }, { status: 500 });

  const { data: evidenceRows, error: eError } = submissionIds.length
    ? await admin
        .from("evidence_images")
        .select("storage_bucket, storage_path")
        .in("submission_id", submissionIds)
    : { data: [], error: null };
  if (eError) return NextResponse.json({ error: eError.message }, { status: 500 });

  const removalWarnings: string[] = [];
  const pathsByBucket = new Map<string, string[]>();
  for (const row of responses ?? []) {
    const bucket = row.storage_bucket || "student-recordings";
    if (row.storage_path) {
      const curr = pathsByBucket.get(bucket) ?? [];
      curr.push(row.storage_path);
      pathsByBucket.set(bucket, curr);
    }
  }
  for (const row of evidenceRows ?? []) {
    const bucket = row.storage_bucket || "student-evidence";
    if (row.storage_path) {
      const curr = pathsByBucket.get(bucket) ?? [];
      curr.push(row.storage_path);
      pathsByBucket.set(bucket, curr);
    }
  }

  for (const [bucket, paths] of pathsByBucket.entries()) {
    for (const batch of chunk(paths, 100)) {
      const { error: removeError } = await admin.storage.from(bucket).remove(batch);
      if (removeError) removalWarnings.push(`${bucket}: ${removeError.message}`);
    }
  }

  const { error: deleteError } = await admin.from("students").delete().eq("id", student.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  let authDeleted = false;
  if (parsed.data.delete_auth_user && student.auth_user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(student.auth_user_id);
    if (authError) removalWarnings.push(`auth: ${authError.message}`);
    else authDeleted = true;
  }

  const res = NextResponse.json({
    ok: true,
    student_id: student.id,
    removed_submissions: submissionIds.length,
    removed_audio_files: (responses ?? []).length,
    removed_evidence_files: (evidenceRows ?? []).length,
    deleted_auth_user: authDeleted,
    warnings: removalWarnings,
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
