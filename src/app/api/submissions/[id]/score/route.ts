import { NextResponse, type NextRequest } from "next/server";

import { scoreSubmission } from "@/lib/scoring/submission";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ensure the teacher can see this submission (RLS scope check).
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!submission) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const force = request.nextUrl.searchParams.get("force") === "1";
  if (force) {
    const admin = createSupabaseAdminClient();
    const { error: resetError } = await admin
      .from("submissions")
      .update({ scoring_status: "pending", scoring_started_at: null, scored_at: null, scoring_error: null })
      .eq("id", submissionId);
    if (resetError) return NextResponse.json({ error: resetError.message }, { status: 500 });
  }

  await scoreSubmission(submissionId);

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
