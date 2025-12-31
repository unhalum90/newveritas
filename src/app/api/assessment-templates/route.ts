import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const seedTemplates = [
  {
    title: "Photosynthesis - Basic Understanding",
    subject: "Science",
    grade_band: "6-8",
    blooms_level_avg: "understand",
    description: "Foundational questions about how plants convert light to energy.",
    instructions: "Answer each question in complete sentences. Be specific and use scientific terms.",
    target_language: null,
    asset_url: null,
    questions: [
      { question_text: "Explain what photosynthesis is in your own words.", question_type: "open_response", blooms_level: "understand" },
      { question_text: "What inputs does a plant need for photosynthesis?", question_type: "open_response", blooms_level: "remember" },
      { question_text: "Describe what outputs are produced during photosynthesis.", question_type: "open_response", blooms_level: "understand" },
    ],
    rubrics: {
      reasoning: {
        instructions: "Clear explanations, uses cause-and-effect reasoning, and connects terms accurately.",
        scale_min: 1,
        scale_max: 5,
      },
      evidence: {
        instructions: "Uses correct scientific vocabulary and accurate facts.",
        scale_min: 1,
        scale_max: 5,
      },
    },
    is_public: true,
    created_by: "system",
  },
  {
    title: "American Revolution - Causes",
    subject: "History",
    grade_band: "9-12",
    blooms_level_avg: "analyze",
    description: "Analyze major causes and perspectives leading to the American Revolution.",
    instructions: "Respond with specific historical details and clear reasoning.",
    target_language: null,
    asset_url: null,
    questions: [
      { question_text: "Describe two economic policies that increased colonial tensions.", question_type: "open_response", blooms_level: "remember" },
      { question_text: "Explain how the Boston Tea Party escalated conflict.", question_type: "open_response", blooms_level: "understand" },
      { question_text: "Analyze how colonial views on representation differed from British policy.", question_type: "open_response", blooms_level: "analyze" },
      { question_text: "Evaluate which cause you think was most significant and why.", question_type: "open_response", blooms_level: "evaluate" },
    ],
    rubrics: {
      reasoning: {
        instructions: "Builds a coherent argument and connects events logically.",
        scale_min: 1,
        scale_max: 5,
      },
      evidence: {
        instructions: "Cites accurate historical details and specific examples.",
        scale_min: 1,
        scale_max: 5,
      },
    },
    is_public: true,
    created_by: "system",
  },
] as const;

async function ensureSeedTemplates() {
  const admin = createSupabaseAdminClient();
  const { data: existing, error } = await admin
    .from("assessment_templates")
    .select("id")
    .limit(1);
  if (error) throw error;
  if (existing?.length) return;
  const { error: insertError } = await admin.from("assessment_templates").insert(seedTemplates);
  if (insertError) throw insertError;
}

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (data.user.user_metadata as { role?: string } | undefined)?.role;
  if (role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ensureSeedTemplates();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unable to seed templates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const url = new URL(request.url);
  const subject = url.searchParams.get("subject");
  const gradeBand = url.searchParams.get("grade_band");
  const limit = Number(url.searchParams.get("limit") ?? "50");

  let query = supabase
    .from("assessment_templates")
    .select("id, title, subject, grade_band, blooms_level_avg, description, is_public, created_at, questions")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50);

  if (subject) query = query.eq("subject", subject);
  if (gradeBand) query = query.eq("grade_band", gradeBand);

  const { data: templates, error: listError } = await query;
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const res = NextResponse.json({
    templates: (templates ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      grade_band: t.grade_band,
      blooms_level_avg: t.blooms_level_avg,
      description: t.description,
      is_public: t.is_public,
      created_at: t.created_at,
      question_count: Array.isArray(t.questions) ? t.questions.length : 0,
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
