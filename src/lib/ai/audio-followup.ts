import { logOpenAiCall, logOpenAiError } from "@/lib/ops/api-logging";
import { transcribeAudio } from "@/lib/scoring/submission";

type FollowupContext = {
  assessmentId?: string | null;
  studentId?: string | null;
  submissionId?: string | null;
  questionId?: string | null;
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (v) return v;
  throw new Error(`Missing ${name}.`);
}

export async function transcribeAudioForFollowup(input: {
  audio: Buffer;
  mimeType: string;
  context?: FollowupContext;
}) {
  try {
    return await transcribeAudio(input.audio, input.mimeType, {
      operation: "audio_followup_transcription",
      assessmentId: input.context?.assessmentId,
      studentId: input.context?.studentId,
      submissionId: input.context?.submissionId,
      questionId: input.context?.questionId,
    });
  } catch (error) {
    console.error("Transcription for follow-up failed", error);
    return null;
  }
}

export async function generateAudioFollowup(input: {
  questionText: string;
  transcript: string;
  context?: FollowupContext;
}) {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
  const system =
    "You are a Socratic tutor. Return ONLY JSON with key: question (string). Ask one concise follow-up question. " +
    "Do NOT use first-person pronouns (I, me, my, we, us, our). Usage such as 'I think' or 'I see' is strictly forbidden. " +
    "Use functional phrasing like 'This response requires clarification on...' or 'The argument suggests...'.";
  const user = `Original prompt:
${input.questionText}

Student transcript:
${input.transcript}

Generate one follow-up question that probes reasoning or evidence.`;

  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(data?.error?.message ?? "Gemini request failed.");

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) return null;

    const parsed = JSON.parse(text) as { question?: unknown };
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    return question || null;
  } catch (error) {
    console.error("Gemini follow-up generation failed", error);
    return null;
  }
}
