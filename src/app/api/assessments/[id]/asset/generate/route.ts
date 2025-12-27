import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateImageBytes } from "@/lib/ai/images";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const requestSchema = z.object({
  prompt: z.string().min(3).max(400),
  count: z.number().int().min(1).max(3).default(3),
});

async function ensurePublicBucket(admin: ReturnType<typeof createSupabaseAdminClient>, bucket: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error: createError } = await admin.storage.createBucket(bucket, { public: true });
  if (createError) throw createError;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  try {
    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select("id, status")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aError) throw aError;
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (assessment.status !== "draft") {
      return NextResponse.json({ error: "Only draft assessments can be edited." }, { status: 409 });
    }

    const admin = createSupabaseAdminClient();
    const bucket = process.env.SUPABASE_ASSET_BUCKET || "assessment-assets";
    await ensurePublicBucket(admin, bucket);
    const buffers = await generateImageBytes(parsed.data.prompt, parsed.data.count, { assessmentId });

    const urls: string[] = [];
    for (const bytes of buffers) {
      const filename = `${assessmentId}/${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
      const { error: uploadError } = await admin.storage
        .from(bucket)
        .upload(filename, bytes, { contentType: "image/png", upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(filename);
      urls.push(publicUrl.publicUrl);
    }

    const res = NextResponse.json({ ok: true, urls });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const message = getSupabaseErrorMessage(e);
    const envHint = message.includes("Missing OPENAI_API_KEY")
      ? "Set OPENAI_API_KEY in `veritas/.env.local` to enable OpenAI image generation."
      : message.includes("Missing GOOGLE_API_KEY")
        ? "Set GOOGLE_API_KEY (or GEMINI_API_KEY) in `veritas/.env.local` to enable Gemini image generation."
        : message.toLowerCase().includes("not found") || message.toLowerCase().includes("permission")
          ? "Your API key may not have access to the configured image model; set OPENAI_API_KEY (recommended) or pick an available Gemini image model and set GEMINI_IMAGE_MODEL."
          : null;
    const res = NextResponse.json({ error: envHint ? `${message} • ${envHint}` : message }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}
