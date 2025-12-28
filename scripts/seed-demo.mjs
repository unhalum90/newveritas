import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_TEACHER_USER_ID = "a7c1ccd8-c55f-4762-a05e-a1beb8caaa55";
const DEFAULT_TEACHER_EMAIL = "eric@xrtoolsfored.com";
const DEFAULT_CLASS_NAME = "demo";

const demoStudents = [
  ["Ava", "Martinez"],
  ["Noah", "Patel"],
  ["Mia", "Chen"],
  ["Ethan", "Garcia"],
  ["Lila", "Johnson"],
  ["Leo", "Nguyen"],
  ["Sophia", "Williams"],
  ["Jamal", "Brown"],
  ["Isabella", "Lopez"],
  ["Owen", "Kim"],
  ["Charlotte", "Davis"],
  ["Mateo", "Hernandez"],
  ["Aria", "Singh"],
  ["Elijah", "Anderson"],
  ["Zoe", "Thomas"],
  ["Caleb", "Moore"],
  ["Grace", "Taylor"],
  ["Lucas", "Rivera"],
  ["Ella", "Walker"],
  ["Jayden", "Hall"],
  ["Maya", "Young"],
  ["Henry", "Allen"],
  ["Layla", "Scott"],
  ["Daniel", "Adams"],
  ["Nora", "Baker"],
];

const baseChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [rawKey, ...rest] = trimmed.split("=");
    const key = rawKey.trim();
    if (process.env[key]) return;
    const rawValue = rest.join("=").trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    process.env[key] = value;
  });
}

function getArgValue(flag) {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function makeCode(index) {
  let value = index + 1;
  let code = "";
  while (value > 0) {
    const remainder = value % baseChars.length;
    code = baseChars[remainder] + code;
    value = Math.floor(value / baseChars.length);
  }
  return code.padStart(6, baseChars[0]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production.");
  }

  const allowSeed = hasFlag("--yes") || process.env.DEMO_SEED === "1" || process.env.DEMO_SEED === "true";
  if (!allowSeed) {
    console.log("Demo seeding is disabled.");
    console.log("Run with DEMO_SEED=1 node scripts/seed-demo.mjs --yes");
    process.exit(1);
  }

  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(repoRoot, ".env"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  }

  const teacherUserId = getArgValue("--teacher-user-id") || process.env.DEMO_TEACHER_USER_ID || DEFAULT_TEACHER_USER_ID;
  const teacherEmail = getArgValue("--teacher-email") || process.env.DEMO_TEACHER_EMAIL || DEFAULT_TEACHER_EMAIL;
  const className = getArgValue("--class-name") || process.env.DEMO_CLASS_NAME || DEFAULT_CLASS_NAME;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let teacher = null;
  if (teacherUserId) {
    const { data } = await supabase
      .from("teachers")
      .select("id, user_id, email, workspace_id, school_id")
      .eq("user_id", teacherUserId)
      .maybeSingle();
    teacher = data;
  }
  if (!teacher && teacherUserId) {
    const { data } = await supabase
      .from("teachers")
      .select("id, user_id, email, workspace_id, school_id")
      .eq("id", teacherUserId)
      .maybeSingle();
    teacher = data;
  }
  if (!teacher && teacherEmail) {
    const { data } = await supabase
      .from("teachers")
      .select("id, user_id, email, workspace_id, school_id")
      .eq("email", teacherEmail)
      .maybeSingle();
    teacher = data;
  }

  if (!teacher) {
    throw new Error("Teacher not found. Check the teacher user_id or email.");
  }
  if (!teacher.workspace_id) {
    throw new Error("Teacher workspace_id missing. Complete onboarding before seeding.");
  }

  const { data: existingClass } = await supabase
    .from("classes")
    .select("id, name")
    .eq("workspace_id", teacher.workspace_id)
    .eq("name", className)
    .maybeSingle();

  let classId = existingClass?.id ?? null;
  if (!classId) {
    const { data, error } = await supabase
      .from("classes")
      .insert({
        workspace_id: teacher.workspace_id,
        name: className,
        access_mode: "code",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create class.");
    classId = data.id;
  }

  const studentRows = demoStudents.map(([firstName, lastName], index) => ({
    class_id: classId,
    first_name: firstName,
    last_name: lastName,
    email: `demo.student+${index + 1}@veritas.demo`,
    student_code: makeCode(index),
  }));

  const { data: students, error: studentError } = await supabase
    .from("students")
    .insert(studentRows)
    .select("id, first_name, last_name");
  if (studentError || !students?.length) throw new Error(studentError?.message ?? "Failed to create students.");

  const assessmentSpecs = [
    {
      title: "Demo: Causes of Revolution",
      status: "live",
      subject: "Social Studies",
      instructions: "Answer in 3-6 sentences. Use concrete evidence from the lesson.",
      questions: [
        {
          text: "Identify two distinct causes of the French Revolution and explain how each contributed to unrest.",
          evidence: "optional",
          type: "open_response",
        },
        {
          text: "Describe one piece of evidence that supports your explanation.",
          evidence: "optional",
          type: "open_response",
        },
      ],
    },
    {
      title: "Demo: Immigration Oral Check",
      status: "closed",
      subject: "Civics",
      instructions: "Respond in complete sentences. Focus on clarity and specific examples.",
      questions: [
        {
          text: "Explain one push and one pull factor that influenced immigration patterns in the early 1900s.",
          evidence: "optional",
          type: "open_response",
        },
        {
          text: "Share one historical example that shows how immigrants shaped their communities.",
          evidence: "optional",
          type: "open_response",
        },
      ],
    },
    {
      title: "Demo: Geography Quick Check",
      status: "draft",
      subject: "Geography",
      instructions: "Short responses only. Keep answers under 45 seconds.",
      questions: [
        {
          text: "Describe how climate impacts daily life in one region you studied.",
          evidence: "optional",
          type: "open_response",
        },
        {
          text: "Explain why access to natural resources influences settlement patterns.",
          evidence: "optional",
          type: "open_response",
        },
      ],
    },
  ];

  const assessments = [];
  const questionsByAssessment = new Map();

  for (const spec of assessmentSpecs) {
    const { data: assessment, error } = await supabase
      .from("assessments")
      .insert({
        class_id: classId,
        title: spec.title,
        subject: spec.subject,
        instructions: spec.instructions,
        status: spec.status,
        authoring_mode: "manual",
      })
      .select("id, title, status")
      .single();
    if (error || !assessment) throw new Error(error?.message ?? "Failed to create assessment.");

    await supabase.from("assessment_integrity").insert({
      assessment_id: assessment.id,
      pause_threshold_seconds: 2.5,
      tab_switch_monitor: true,
      shuffle_questions: true,
      pledge_enabled: true,
      pledge_version: 1,
      recording_limit_seconds: 60,
      viewing_timer_seconds: 20,
    });

    const { data: questions, error: questionError } = await supabase
      .from("assessment_questions")
      .insert(
        spec.questions.map((question, index) => ({
          assessment_id: assessment.id,
          question_text: question.text,
          question_type: question.type,
          evidence_upload: question.evidence,
          order_index: index + 1,
        })),
      )
      .select("id, question_text, order_index");
    if (questionError || !questions?.length) throw new Error(questionError?.message ?? "Failed to create questions.");

    await supabase.from("rubrics").insert([
      {
        assessment_id: assessment.id,
        rubric_type: "reasoning",
        instructions: "Score clarity, reasoning, and relevance to the prompt.",
        scale_min: 1,
        scale_max: 5,
      },
      {
        assessment_id: assessment.id,
        rubric_type: "evidence",
        instructions: "Score use of specific evidence or examples.",
        scale_min: 1,
        scale_max: 5,
      },
    ]);

    assessments.push(assessment);
    questionsByAssessment.set(assessment.id, questions);
  }

  async function seedSubmissions({ assessment, targetStudents, publishedCount, pendingCount, flaggedCount }) {
    const questions = questionsByAssessment.get(assessment.id) ?? [];
    const submissionsToCreate = [];
    const now = Date.now();

    targetStudents.forEach((student, index) => {
      let reviewStatus = "published";
      if (index >= publishedCount) reviewStatus = "pending";
      const createdAt = new Date(now - index * 60_000).toISOString();
      const submittedAt = new Date(now - index * 45_000).toISOString();
      const publishedAt = reviewStatus === "published" ? new Date(now - index * 30_000).toISOString() : null;

      submissionsToCreate.push({
        assessment_id: assessment.id,
        student_id: student.id,
        status: "submitted",
        scoring_status: "complete",
        review_status: reviewStatus,
        submitted_at: submittedAt,
        published_at: publishedAt,
        teacher_comment: reviewStatus === "published" ? "Strong effort with clear reasoning." : null,
        created_at: createdAt,
      });
    });

    const { data: submissions, error } = await supabase
      .from("submissions")
      .insert(submissionsToCreate)
      .select("id, student_id, assessment_id, submitted_at");
    if (error || !submissions?.length) throw new Error(error?.message ?? "Failed to create submissions.");

    const scoreRows = [];
    const responseRows = [];
    const integrityRows = [];

    submissions.forEach((submission, index) => {
      const tier = index < publishedCount / 2 ? "high" : index < publishedCount ? "mid" : "low";
      const baseScore = tier === "high" ? 4 : tier === "mid" ? 3 : 2;
      const flaggedStart = index >= publishedCount + pendingCount;

      questions.forEach((question, qIndex) => {
        const reasoningScore = clamp(baseScore + (qIndex % 2), 1, 5);
        const evidenceScore = clamp(baseScore + ((qIndex + 1) % 2), 1, 5);

        scoreRows.push(
          {
            submission_id: submission.id,
            question_id: question.id,
            scorer_type: "reasoning",
            score: reasoningScore,
            justification: "Reasoning aligns with the prompt and stays focused.",
          },
          {
            submission_id: submission.id,
            question_id: question.id,
            scorer_type: "evidence",
            score: evidenceScore,
            justification: "Includes at least one concrete example.",
          },
        );

        responseRows.push({
          submission_id: submission.id,
          question_id: question.id,
          storage_path: `demo/${submission.id}/${question.id}.webm`,
          mime_type: "audio/webm",
          duration_seconds: 28 + (index % 12),
          transcript: `Student response for question ${question.order_index}: clear explanation with supporting evidence.`,
        });

        if (flaggedStart && qIndex === 0) {
          integrityRows.push({
            submission_id: submission.id,
            question_id: question.id,
            event_type: "fast_start",
            duration_ms: 2500,
            metadata: { note: "Demo fast-start flag" },
            created_at: submission.submitted_at,
          });
        }
      });

      if (index < flaggedCount) {
        integrityRows.push({
          submission_id: submission.id,
          question_id: questions[0]?.id ?? null,
          event_type: "tab_switch",
          duration_ms: 4000,
          metadata: { note: "Demo tab switch" },
          created_at: submission.submitted_at,
        });
      }
    });

    if (scoreRows.length) {
      const { error: scoreError } = await supabase.from("question_scores").insert(scoreRows);
      if (scoreError) throw new Error(scoreError.message);
    }
    if (responseRows.length) {
      const { error: responseError } = await supabase.from("submission_responses").insert(responseRows);
      if (responseError) throw new Error(responseError.message);
    }
    if (integrityRows.length) {
      const { error: integrityError } = await supabase.from("integrity_events").insert(integrityRows);
      if (integrityError) throw new Error(integrityError.message);
    }
  }

  await seedSubmissions({
    assessment: assessments[0],
    targetStudents: students,
    publishedCount: 15,
    pendingCount: 7,
    flaggedCount: 3,
  });

  await seedSubmissions({
    assessment: assessments[1],
    targetStudents: students.slice(0, 18),
    publishedCount: 12,
    pendingCount: 4,
    flaggedCount: 2,
  });

  console.log("Demo seed complete.");
  console.log(`Class: ${className} (${classId})`);
  console.log(`Students: ${students.length}`);
  console.log(`Assessments: ${assessments.length}`);
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
