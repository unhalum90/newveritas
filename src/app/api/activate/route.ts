import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeStudentCode, studentCodeToEmail } from "@/lib/students/code";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const validateSchema = z.object({
  student_code: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = normalizeStudentCode(url.searchParams.get("code") ?? "");
  const parsed = validateSchema.safeParse({ student_code: code });
  if (!parsed.success) return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: student, error } = await admin
    .from("students")
    .select("id, first_name, last_name, auth_user_id")
    .eq("student_code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  if (student.auth_user_id) return NextResponse.json({ error: "Code already claimed." }, { status: 409 });

  return NextResponse.json({
    ok: true,
    student: { first_name: student.first_name, last_name: student.last_name },
  });
}

const activateSchema = z.object({
  student_code: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const code = normalizeStudentCode(parsed.data.student_code);
  if (!code) return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, auth_user_id")
    .eq("student_code", code)
    .maybeSingle();

  if (studentError) return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  if (student.auth_user_id) return NextResponse.json({ error: "Code already claimed." }, { status: 409 });

  // Always use the student_code-based identifier for auth so K–12/no-email flows work consistently.
  const email = studentCodeToEmail(code);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { role: "student" },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "User creation failed." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("students")
    .update({
      auth_user_id: created.user.id,
      code_claimed_at: new Date().toISOString(),
    })
    .eq("id", student.id);

  if (updateError) return NextResponse.json({ error: "Activation write failed." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
