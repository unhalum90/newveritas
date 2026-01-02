import { NextResponse, type NextRequest } from "next/server";

import { getUserRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

const practiceSeeds = [
  {
    title: "Practice: Getting Comfortable",
    instructions:
      "This warm-up helps you get comfortable speaking out loud. Answer in complete sentences and explain your thinking.",
    questions: [
      "Introduce yourself and share one subject you enjoy learning.",
      "Describe something you learned recently and why it interested you.",
      "What is one question you still have about that topic?",
    ],
    rubrics: {
      reasoning: "Speaks clearly, stays on topic, and explains ideas in a logical order.",
      evidence: "Uses specific details or examples to support each answer.",
    },
  },
  {
    title: "Practice: Explain Your Thinking",
    instructions:
      "Focus on how you think. Walk through your reasoning step by step and use at least one example.",
    questions: [
      "Explain the steps you would take to solve a problem you know well.",
      "Give one example that supports your explanation.",
      "How would you check your answer or verify your work?",
    ],
    rubrics: {
      reasoning: "Explains steps in order and connects ideas with clear transitions.",
      evidence: "Uses accurate examples or details to support each step.",
    },
  },
  {
    title: "Practice: Claim + Evidence",
    instructions:
      "Make a clear claim, back it up with evidence, and explain why it matters.",
    questions: [
      "State a claim about something you learned in class this week.",
      "Provide evidence or an example that supports your claim.",
      "Explain why your evidence supports the claim.",
    ],
    rubrics: {
      reasoning: "Links the claim to the evidence with a clear explanation.",
      evidence: "Chooses relevant facts or examples to support the claim.",
    },
  },
] as const;

async function seedPracticeAssessments(classId: string) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: checkError } = await admin
    .from("assessments")
    .select("id")
    .eq("class_id", classId)
    .eq("status", "live")
    .eq("is_practice_mode", true)
    .limit(1);

  if (checkError) throw checkError;
  if (existing?.length) return;

  for (const seed of practiceSeeds) {
    const { data: assessment, error: aError } = await admin
      .from("assessments")
      .insert({
        class_id: classId,
        title: seed.title,
        instructions: seed.instructions,
        status: "live",
        published_at: now,
        authoring_mode: "manual",
        is_practice_mode: true,
      })
      .select("id")
      .single();

    if (aError) throw aError;

    const questionRows = seed.questions.map((question_text, index) => ({
      assessment_id: assessment.id,
      question_text,
      order_index: index + 1,
      evidence_upload: "optional",
    }));

    const { error: qError } = await admin.from("assessment_questions").insert(questionRows);
    if (qError) throw qError;

    const { error: rError } = await admin.from("rubrics").insert([
      {
        assessment_id: assessment.id,
        rubric_type: "reasoning",
        instructions: seed.rubrics.reasoning,
        scale_min: 1,
        scale_max: 5,
      },
      {
        assessment_id: assessment.id,
        rubric_type: "evidence",
        instructions: seed.rubrics.evidence,
        scale_min: 1,
        scale_max: 5,
      },
    ]);

    if (rError) throw rError;
  }
}

export async function GET(request: NextRequest) {
  const { supabase, pendingCookies } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(data.user);
  const admin = createSupabaseAdminClient();
  const { data: student, error: sError } = await admin
    .from("students")
    .select("id, class_id, disabled")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });
  if (!student) {
    if (role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }
  if (student.disabled) return NextResponse.json({ error: "Student access restricted." }, { status: 403 });
  if (!student.class_id) return NextResponse.json({ error: "Student class not assigned." }, { status: 409 });

  try {
    await seedPracticeAssessments(student.class_id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unable to create practice assessments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: assessments, error: aError } = await admin
    .from("assessments")
    .select("id, title, status, published_at, created_at, selected_asset_id, is_practice_mode")
    .eq("class_id", student.class_id)
    .eq("status", "live")
    .eq("is_practice_mode", true)
    .order("published_at", { ascending: false });

  if (aError) return NextResponse.json({ error: aError.message }, { status: 500 });

  const ids = (assessments ?? []).map((a) => a.id);
  const { data: assets, error: assetError } = ids.length
    ? await admin
        .from("assessment_assets")
        .select("assessment_id, asset_url, created_at")
        .in("assessment_id", ids)
        .eq("asset_type", "image")
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 });

  const assetUrlByAssessment = new Map<string, string>();
  for (const row of assets ?? []) {
    if (!assetUrlByAssessment.has(row.assessment_id)) assetUrlByAssessment.set(row.assessment_id, row.asset_url);
  }

  const { data: submissions, error: subError } = await admin
    .from("submissions")
    .select("id, assessment_id, status, started_at, submitted_at, review_status, published_at")
    .eq("student_id", student.id)
    .order("started_at", { ascending: false });

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  const latestSubmissionByAssessment = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions ?? []) {
    if (!latestSubmissionByAssessment.has(sub.assessment_id)) latestSubmissionByAssessment.set(sub.assessment_id, sub);
  }

  const res = NextResponse.json({
    assessments: (assessments ?? []).map((a) => ({
      ...a,
      asset_url: assetUrlByAssessment.get(a.id) ?? null,
      latest_submission: latestSubmissionByAssessment.get(a.id) ?? null,
    })),
  });
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
