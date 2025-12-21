import { NextResponse, type NextRequest } from "next/server";

import { scoreSubmission } from "@/lib/scoring/submission";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev-friendly
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const limit = Math.max(1, Math.min(10, Number(new URL(request.url).searchParams.get("limit") || "3")));

  const { data: submissions, error } = await admin
    .from("submissions")
    .select("id")
    .eq("status", "submitted")
    .in("scoring_status", ["pending", "error"])
    .order("submitted_at", { ascending: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const s of submissions ?? []) {
    try {
      await scoreSubmission(s.id);
      results.push({ id: s.id, ok: true });
    } catch (e) {
      results.push({ id: s.id, ok: false, error: e instanceof Error ? e.message : "Failed" });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

