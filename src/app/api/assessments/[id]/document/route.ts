import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

const DOCUMENT_ASSET_TYPE = "document_pdf";
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function isAllowedPdf(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf" || type === "application/x-pdf") return true;
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".pdf");
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
    .select("id, assessment_id, asset_type, asset_url, original_filename, created_at")
    .eq("assessment_id", assessmentId)
    .eq("asset_type", DOCUMENT_ASSET_TYPE)
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
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
  if (!isAllowedPdf(file)) return NextResponse.json({ error: "Document must be a PDF." }, { status: 415 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "PDF too large (max 20MB)." }, { status: 413 });

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

    const safeName = (file.name || "document")
      .replace(/[^\w.\- ]+/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 160);
    const path = `${assessmentId}/document-${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(path);

    const { error: deleteError } = await supabase
      .from("assessment_assets")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("asset_type", DOCUMENT_ASSET_TYPE);
    if (deleteError) throw deleteError;

    const { data: created, error: insertError } = await supabase
      .from("assessment_assets")
      .insert({
        assessment_id: assessmentId,
        asset_type: DOCUMENT_ASSET_TYPE,
        asset_url: publicUrl.publicUrl,
        original_filename: safeName,
      })
      .select("id, assessment_id, asset_type, asset_url, original_filename, created_at")
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
    .eq("asset_type", DOCUMENT_ASSET_TYPE);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
