import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

const AUDIO_ASSET_TYPE = "audio_intro";
const DEFAULT_MAX_DURATION_SECONDS = 180;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function asInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function asBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

function isAllowedAudio(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type === "audio/mpeg" || type === "audio/mp3" || type === "audio/wav" || type === "audio/x-wav") return true;
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".mp3") || name.endsWith(".wav");
}

function getAudioContentType(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type) return type;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".wav")) return "audio/wav";
  return "audio/mpeg";
}

async function ensurePublicBucket(admin: ReturnType<typeof createSupabaseAdminClient>, bucket: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error: createError } = await admin.storage.createBucket(bucket, { public: true });
  if (createError) throw createError;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: asset, error: assetError } = await supabase
    .from("assessment_assets")
    .select(
      "id, assessment_id, asset_type, asset_url, original_filename, duration_seconds, max_duration_seconds, require_full_listen, created_at",
    )
    .eq("assessment_id", assessmentId)
    .eq("asset_type", AUDIO_ASSET_TYPE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const res = NextResponse.json({ asset: asset ?? null });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  if (!isAllowedAudio(file)) return NextResponse.json({ error: "Audio must be MP3 or WAV." }, { status: 415 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Audio too large (max 15MB)." }, { status: 413 });

  const durationSeconds = asInt(form.get("duration_seconds")) ?? null;
  if (!durationSeconds || durationSeconds < 1) {
    return NextResponse.json({ error: "Missing audio duration." }, { status: 400 });
  }

  const requestedMax = asInt(form.get("max_duration_seconds"));
  const maxDurationSeconds = requestedMax && requestedMax > 0 ? requestedMax : DEFAULT_MAX_DURATION_SECONDS;
  if (durationSeconds > maxDurationSeconds) {
    return NextResponse.json({ error: `Audio must be ${maxDurationSeconds} seconds or less.` }, { status: 413 });
  }

  const requireFullListen = asBool(form.get("require_full_listen")) ?? true;

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, status")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError) return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (assessment.status !== "draft") return NextResponse.json({ error: "Only draft assessments can be edited." }, { status: 409 });

  try {
    const admin = createSupabaseAdminClient();
    const bucket = process.env.SUPABASE_ASSET_BUCKET || "assessment-assets";
    await ensurePublicBucket(admin, bucket);

    const safeName = (file.name || "audio")
      .replace(/[^\w.\- ]+/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 160);
    const path = `${assessmentId}/audio-${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
      contentType: getAudioContentType(file),
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(path);

    const { error: deleteError } = await supabase
      .from("assessment_assets")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("asset_type", AUDIO_ASSET_TYPE);
    if (deleteError) throw deleteError;

    const { data: created, error: insertError } = await supabase
      .from("assessment_assets")
      .insert({
        assessment_id: assessmentId,
        asset_type: AUDIO_ASSET_TYPE,
        asset_url: publicUrl.publicUrl,
        original_filename: safeName,
        duration_seconds: durationSeconds,
        max_duration_seconds: maxDurationSeconds,
        require_full_listen: requireFullListen,
      })
      .select(
        "id, assessment_id, asset_type, asset_url, original_filename, duration_seconds, max_duration_seconds, require_full_listen, created_at",
      )
      .single();
    if (insertError) throw insertError;

    const res = NextResponse.json({ ok: true, asset: created });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const res = NextResponse.json({ error: getSupabaseErrorMessage(e) }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error: deleteError } = await supabase
    .from("assessment_assets")
    .delete()
    .eq("assessment_id", assessmentId)
    .eq("asset_type", AUDIO_ASSET_TYPE);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
