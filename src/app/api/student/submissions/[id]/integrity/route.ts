import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

const eventSchema = z.object({
  event_type: z.enum(["tab_switch", "fast_start", "slow_start", "screenshot_attempt"]),
  duration_ms: z.number().int().min(0).optional().nullable(),
  question_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: submissionId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { error: insertError } = await supabase.from("integrity_events").insert({
    submission_id: submissionId,
    question_id: parsed.data.question_id ?? null,
    event_type: parsed.data.event_type,
    duration_ms: parsed.data.duration_ms ?? null,
    metadata: parsed.data.metadata ?? null,
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
