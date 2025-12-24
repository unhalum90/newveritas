import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";

import { generateAssessmentDraftFromPrompt } from "@/lib/ai/assessment-draft";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export const runtime = "nodejs";

async function extractPdfText(bytes: Uint8Array) {
  // NOTE: We intentionally avoid `pdf-parse` here because under Next.js/Turbopack it can
  // trigger `pdfjs-dist` worker resolution errors ("Setting up fake worker failed...").
  // Using `pdfjs-dist` directly and forcing a resolvable worker module avoids Turbopack's
  // runtime "fake worker" failures.
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as {
    getDocument: (src: { data: Uint8Array; disableWorker?: boolean }) => { promise: Promise<unknown> };
    GlobalWorkerOptions?: { workerSrc?: string };
  };

  // `disableWorker: true` uses the "fake worker" which imports `workerSrc` as a module. The
  // default is a relative specifier ("./pdf.worker.mjs") that Turbopack rewrites into a missing
  // `.next/.../chunks/pdf.worker.mjs`. Use a package specifier instead so Node can resolve it.
  if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";

  const loadingTask = pdfjs.getDocument({ data: bytes, disableWorker: true });
  const doc = (await loadingTask.promise) as {
    numPages: number;
    getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: unknown }> }> }>;
  };

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean)
      .join(" ");
    if (pageText.trim()) parts.push(pageText.trim());
  }

  return parts.join("\n\n").trim();
}

function asInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function buildPromptFromPdfText(input: { title: string; extractedText: string }) {
  const excerptLimit = 12000;
  const cleaned = input.extractedText
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const excerpt = cleaned.length > excerptLimit ? `${cleaned.slice(0, excerptLimit)}\n\n[TRUNCATED]` : cleaned;

  return `You are building an oral assessment draft based on teacher-provided source material.

Teacher provided title:
${input.title}

Source material (extracted from a PDF):
${excerpt}

Create an oral assessment aligned to the material above. Do not invent facts beyond the source.
If the source is too broad, focus on the most central concepts and key details.`;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = await ctx.params;
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const questionCount = asInt(form.get("question_count")) ?? 3;

    if (!(file instanceof File)) return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
    }
    if (!Number.isFinite(questionCount) || questionCount < 1 || questionCount > 5) {
      return NextResponse.json({ error: "Invalid question count." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PDF too large (max 10MB)." }, { status: 413 });

    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select("id, title, status")
      .eq("id", assessmentId)
      .maybeSingle();
    if (aError) throw aError;
    if (!assessment) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (assessment.status !== "draft") return NextResponse.json({ error: "Only draft assessments can be generated." }, { status: 409 });

    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY.");

    const buf = Buffer.from(await file.arrayBuffer());
    const sha = crypto.createHash("sha256").update(buf).digest("hex");

    const extractedText = await extractPdfText(new Uint8Array(buf));
    if (!extractedText) return NextResponse.json({ error: "No text could be extracted from that PDF." }, { status: 400 });

    const prompt = buildPromptFromPdfText({ title: assessment.title, extractedText });
    const ai = await generateAssessmentDraftFromPrompt(prompt, questionCount);

    const { error: srcError } = await supabase.from("assessment_sources").insert({
      assessment_id: assessmentId,
      source_type: "upload",
      source_reference: `${file.name} • sha256:${sha}`,
    });
    if (srcError) throw srcError;

    const { error: updateAssessmentError } = await supabase
      .from("assessments")
      .update({
        title: ai.title || assessment.title,
        subject: ai.subject ?? null,
        target_language: ai.target_language ?? null,
        instructions: ai.instructions ?? null,
      })
      .eq("id", assessmentId);
    if (updateAssessmentError) throw updateAssessmentError;

    const { error: deleteQuestionsError } = await supabase.from("assessment_questions").delete().eq("assessment_id", assessmentId);
    if (deleteQuestionsError) throw deleteQuestionsError;
    const { error: insertQuestionsError } = await supabase.from("assessment_questions").insert(
      ai.questions.map((q, idx) => ({
        assessment_id: assessmentId,
        question_text: q.question_text,
        question_type: q.question_type ?? "open_response",
        order_index: idx + 1,
      })),
    );
    if (insertQuestionsError) throw insertQuestionsError;

    const { error: deleteRubricsError } = await supabase.from("rubrics").delete().eq("assessment_id", assessmentId);
    if (deleteRubricsError) throw deleteRubricsError;
    const { error: insertRubricsError } = await supabase.from("rubrics").insert([
      { assessment_id: assessmentId, rubric_type: "reasoning", instructions: ai.rubrics.reasoning, scale_min: 1, scale_max: 5 },
      { assessment_id: assessmentId, rubric_type: "evidence", instructions: ai.rubrics.evidence, scale_min: 1, scale_max: 5 },
    ]);
    if (insertRubricsError) throw insertRubricsError;

    const res = NextResponse.json({ ok: true, extracted_chars: extractedText.length });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (e) {
    const message = getSupabaseErrorMessage(e);
    const envHint = message.includes("Missing OPENAI_API_KEY")
      ? "Set OPENAI_API_KEY in `veritas/.env.local` to enable PDF draft generation."
      : null;
    const res = NextResponse.json({ error: envHint ? `${message} • ${envHint}` : message }, { status: 500 });
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }
}
