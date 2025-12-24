import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const patchSchema = z.object({
  pause_threshold_seconds: z.number().positive().optional().nullable(),
  tab_switch_monitor: z.boolean().optional(),
  shuffle_questions: z.boolean().optional(),
  pledge_enabled: z.boolean().optional(),
  recording_limit_seconds: z.number().int().positive().optional(),
  viewing_timer_seconds: z.number().int().positive().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { error: updateError } = await supabase
    .from("assessment_integrity")
    .upsert({ assessment_id: assessmentId, ...parsed.data }, { onConflict: "assessment_id" });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
