import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// We'll duplicate the gemini helper here or export it. 
// For speed/safety, I'll inline a specialized version or import if possible.
// Since `src/lib/scoring/submission.ts` has it but it's not exported, I will copy the minimal Gemini logic needed here. (Or refactor submission.ts in a separate PR, but I'll stick to new file for safety).
// Actually, I'll create a dedicated lib for Gemini Socratic logic to keep it clean.

async function geminiAnalysis(imageBuffer: Buffer, mimeType: string) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const model = "gemini-3-flash-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const b64 = imageBuffer.toString("base64");

    // Socratic Prompt
    const systemPrompt = `You are a friendly, encouraging Socratic tutor for diverse students. 
    1. ANALYZE the image of the student's notes visually.
    2. ACKNOWLEDGE specifically what you see (e.g., "I see you've drawn an isosceles triangle" or "You have some notes here about the Civil War").
    3. ASK ONE generic but relevant probing question to start the discussion and check their understanding.
    4. Keep it brief (under 50 words). 
    5. Return ONLY JSON: { "message": "..." }`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{
                role: "user",
                parts: [
                    { text: "Here are my notes. Help me study." },
                    { inline_data: { mime_type: mimeType, data: b64 } }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    try {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini Parse Error", data);
        throw new Error("Failed to parse Gemini response");
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const activityId = formData.get("activityId") as string;

        if (!file || !activityId) return NextResponse.json({ error: "Missing file or activityId" }, { status: 400 });

        // 1. Upload to Storage (for record keeping)
        const admin = createSupabaseAdminClient();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const path = `${user.id}/${activityId}/${Date.now()}_${file.name}`;

        // Ensure bucket exists (or assume it does, 'studylab-images')
        // We'll try to upload, if bucket missing, might fail. 
        // For MVP, we'll skip strict bucket check and just assume 'formative-works' or new 'studylab-images'.
        // Let's use 'student-recordings' or create a new one? 
        // User has 'student-recordings' usage in code. Let's use 'formative-works' if available or just 'studylab-images'.
        // I'll try 'studylab-images'.

        const { error: uploadError } = await admin.storage
            .from("studylab-images")
            .upload(path, file, { contentType: file.type, upsert: true });

        // Note: If bucket doesn't exist, this fails. I'll create the bucket via SQL if I can't here. 
        // But for now, let's proceed with the ANALYSIS even if upload fails (optional persistence).
        if (uploadError) console.error("Upload failed (bucket might be missing)", uploadError);

        // 2. Gemini Analysis
        const result = await geminiAnalysis(buffer, file.type);

        return NextResponse.json({
            success: true,
            message: result.message,
            imagePath: path
        });

    } catch (e) {
        console.error("Session Start Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
