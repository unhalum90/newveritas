import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Helper to call Gemini (copied/adapted from submission.ts pattern for now)
async function geminiGenerateJson(system: string, userText: string) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) throw new Error("Missing Google API Key");

    const model = "gemini-2.5-flash"; // Fast model for grading
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: userText }] }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!res.ok) throw new Error(`Gemini API Error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty Gemini response");

    return JSON.parse(text);
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { activityId, studentId, history, selfRating } = body;

        if (!activityId || !studentId) {
            return NextResponse.json({ error: "Missing activityId or studentId" }, { status: 400 });
        }

        // Generate Grading
        let grading = null;
        if (history && Array.isArray(history) && history.length > 0) {
            try {
                const transcript = history
                    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
                    .join("\n\n");

                const system = `You are a helpful teacher assistant. Analyze the student's study session.
Return ONLY JSON:
{
  "summary": "A concise 2-3 sentence summary of what the student understood and struggled with.",
  "score": 1, // Integer 1-4 (1=Needs Support, 2=Approaching, 3=Proficient, 4=Advanced)
  "feedback": {
    "strengths": ["List 2-3 strengths"],
    "improvements": ["List 1-2 areas for improvement"]
  }
}`;
                grading = await geminiGenerateJson(system, transcript);
            } catch (gradeError) {
                console.error("Grading failed:", gradeError);
                // Don't fail the whole submission, just skip grading
            }
        }

        const admin = createSupabaseAdminClient();

        // 1. Create/Update Submission Record
        const submissionData = {
            history,
            grading,
            selfRating, // Save student reflection
            submittedAt: new Date().toISOString()
        };

        const { data: submission, error: submissionError } = await admin
            .from("formative_submissions")
            .upsert({
                activity_id: activityId,
                student_id: studentId,
                status: "submitted",
                submitted_at: new Date().toISOString(),
                input_mode: "studylab", // Update input_mode to studylab
                submission_data: submissionData // Saving JSONB
            }, { onConflict: "activity_id, student_id" })
            .select()
            .single();

        if (submissionError) {
            console.error("Submission Error", submissionError);
            throw new Error(submissionError.message);
        }

        return NextResponse.json({ success: true, submission });

    } catch (e) {
        console.error("Submit Session Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
