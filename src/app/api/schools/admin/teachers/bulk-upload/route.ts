import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSchoolAdminContext } from "@/lib/auth/school-admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const schema = z.object({
  csv: z.string().min(1),
  proceed_valid_only: z.boolean().optional().default(true),
});

type CsvRow = { first_name: string; last_name: string; email: string };

function parseSimpleCsv(csv: string): CsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("first_name") && header.includes("last_name") && header.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const [first_name, last_name, email] = line.split(",").map((v) => v.trim());
      return { first_name, last_name, email };
    })
    .filter((r) => r.first_name && r.last_name && r.email);
}

function randomPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function POST(request: NextRequest) {
  const ctx = await requireSchoolAdminContext(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.workspaceId) return NextResponse.json({ error: "No workspace found for school." }, { status: 409 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const rows = parseSimpleCsv(parsed.data.csv);
    if (rows.length === 0) return NextResponse.json({ error: "No valid rows found." }, { status: 400 });

    const seen = new Set<string>();
    const errors: Array<{ row: CsvRow; error: string }> = [];
    const created: Array<{ row: CsvRow; user_id: string; temp_password: string }> = [];

    for (const row of rows) {
      const email = row.email.toLowerCase();
      if (!email.includes("@")) {
        errors.push({ row, error: "Invalid email" });
        continue;
      }
      if (seen.has(email)) {
        errors.push({ row, error: "Duplicate email in CSV" });
        continue;
      }
      seen.add(email);

      const tempPassword = randomPassword();
      try {
        const { data: createdUser, error: createUserError } = await ctx.admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: "teacher" },
        });
        if (createUserError) throw createUserError;
        if (!createdUser.user) throw new Error("User creation failed.");

        const { error: teacherError } = await ctx.admin.from("teachers").insert({
          user_id: createdUser.user.id,
          email,
          first_name: row.first_name,
          last_name: row.last_name,
          school_id: ctx.schoolId,
          workspace_id: ctx.workspaceId,
          onboarding_stage: "COMPLETE",
        });
        if (teacherError) throw teacherError;

        created.push({ row, user_id: createdUser.user.id, temp_password: tempPassword });
      } catch (e) {
        errors.push({ row, error: getSupabaseErrorMessage(e) });
        if (!parsed.data.proceed_valid_only) break;
      }
    }

    const res = NextResponse.json({ created, errors });
    ctx.pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    return NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
  }
}

