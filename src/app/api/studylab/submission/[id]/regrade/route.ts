import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Helper to call Gemini (shared logic)
async function geminiGenerateJson(system: string, userText: string) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) throw new Error("Missing Google API Key");

    const model = "gemini-3-flash-preview";
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: submissionId } = await params;
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createSupabaseAdminClient();

        // 1. Fetch Submission
        const { data: submission, error: fetchError } = await admin
            .from("formative_submissions")
            .select("submission_data")
            .eq("id", submissionId)
            .single();

        if (fetchError || !submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = submission.submission_data as any;
        const history = data?.history || [];

        if (!history || !Array.isArray(history) || history.length === 0) {
            return NextResponse.json({ error: "No history to grade" }, { status: 400 });
        }

        // 2. Generate Grading
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
        let grading = null;
        try {
            grading = await geminiGenerateJson(system, transcript);
        } catch (gradingError) {
            console.error("Regrading failed:", gradingError);
            return NextResponse.json({ error: "AI Grading Failed. Check API keys." }, { status: 500 });
        }

        // 3. Update Submission
        const updatedData = {
            ...data,
            grading
        };

        const { error: updateError } = await admin
            .from("formative_submissions")
            .update({ submission_data: updatedData })
            .eq("id", submissionId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        return NextResponse.json({ success: true, grading });

    } catch (e) {
        console.error("Regrade Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
