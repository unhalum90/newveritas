import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FORMATIVE_BUCKETS } from "@/lib/studylab/storage";

// We'll duplicate the gemini helper here or export it. 
// For speed/safety, I'll inline a specialized version or import if possible.
// Since `src/lib/scoring/submission.ts` has it but it's not exported, I will copy the minimal Gemini logic needed here. (Or refactor submission.ts in a separate PR, but I'll stick to new file for safety).
// Actually, I'll create a dedicated lib for Gemini Socratic logic to keep it clean.

async function geminiAnalysis(images: { buffer: Buffer; mimeType: string }[]) {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    const systemPrompt = `You are a friendly, encouraging Socratic tutor for diverse students. 
    1. ANALYZE the student's notes visually across all provided images.
    2. Look for diagrams, charts, handwriting patterns, and structural cues. Don't just OCR the text; understand the visual context.
    3. ACKNOWLEDGE specifically what you see visually (e.g., "I see you've drawn a map of Europe" or "Your handwritten notes have a clear outline structure").
    4. ASK ONE generic but relevant probing question to start the discussion and check their understanding.
    5. Keep it brief (under 50 words). 
    6. Return ONLY JSON: { "message": "..." }`;

    const parts: any[] = [{ text: "Analyze my notes and start a discussion." }];
    images.forEach(img => {
        parts.push({
            inline_data: {
                mime_type: img.mimeType,
                data: img.buffer.toString("base64"),
            }
        });
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                },
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Gemini analysis failed.");

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini analysis error", e);
        return { message: "I'm ready to discuss your notes! What would you like to focus on first?" };
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify user
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const activityId = formData.get("activityId") as string;

        // Support multiple images (file_0, file_1, ...) or single "file"
        const files: File[] = [];
        const fileCount = parseInt(formData.get("fileCount") as string || "0", 10);

        if (fileCount > 0) {
            for (let i = 0; i < fileCount; i++) {
                const f = formData.get(`file_${i}`) as File | null;
                if (f) files.push(f);
            }
        } else {
            const f = formData.get("file") as File | null;
            if (f) files.push(f);
        }

        if (files.length === 0) {
            return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
        }

        // 1. Upload to Storage (for record keeping)
        const admin = createSupabaseAdminClient();
        const imageBuffers: { buffer: Buffer; mimeType: string }[] = [];

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageBuffers.push({ buffer, mimeType: file.type });

            const path = `${user.id}/${activityId}/${Date.now()}_${file.name}`;
            await admin.storage
                .from(FORMATIVE_BUCKETS.STUDYLAB_IMAGES)
                .upload(path, file, { contentType: file.type, upsert: true });
        }

        // 2. Gemini Analysis
        const result = await geminiAnalysis(imageBuffers);

        return NextResponse.json({
            message: result.message,
            imagePaths: files.map(f => f.name),
        });

    } catch (e) {
        console.error("Session Start Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
