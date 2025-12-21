import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateStudentCode(length = 8) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, first_name, last_name, email, student_code, auth_user_id, code_claimed_at, created_at")
    .eq("class_id", id)
    .order("created_at", { ascending: false });

  if (studentsError) return NextResponse.json({ error: "Students lookup failed." }, { status: 500 });

  const res = NextResponse.json({ students });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

const studentSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
});

const createSchema = z.object({
  students: z.array(studentSchema).min(1).max(500),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const created: Array<{ id: string; student_code: string }> = [];

  for (const s of parsed.data.students) {
    let insertedOk = false;
    for (let attempts = 0; attempts < 8; attempts++) {
      const student_code = generateStudentCode();
      const { data: inserted, error: insertError } = await supabase
        .from("students")
        .insert({
          class_id: id,
          first_name: s.first_name.trim(),
          last_name: s.last_name.trim(),
          email: s.email?.trim() || null,
          student_code,
        })
        .select("id, student_code")
        .single();

      if (!insertError && inserted) {
        created.push(inserted);
        insertedOk = true;
        break;
      }

      // Unique violation; retry a different code.
      const code =
        insertError && typeof insertError === "object" && "code" in insertError
          ? (insertError.code as string | undefined)
          : null;
      if (code === "23505") continue;
      return NextResponse.json({ error: insertError?.message ?? "Insert failed." }, { status: 500 });
    }
    if (!insertedOk) return NextResponse.json({ error: "Code generation failed." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, created });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
