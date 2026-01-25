import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FORMATIVE_BUCKETS } from "@/lib/studylab/storage";

// Extend serverless timeout to 60 seconds for processing multiple images
export const maxDuration = 60;

type AnalysisContext = {
    title?: string | null;
    learningTarget?: string | null;
    promptTemplate?: string | null;
};

async function geminiAnalysis(images: { buffer: Buffer; mimeType: string }[], context: AnalysisContext) {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-3-flash-preview";
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY");

    const assignmentTitle = context.title?.trim() || "the assignment";
    const learningTarget = context.learningTarget?.trim() || "the learning target";
    const teacherInstructions = context.promptTemplate?.trim();

    const systemPrompt = `You are a friendly, encouraging Socratic tutor for a StudyLab session.
    Assignment title: "${assignmentTitle}"
    Learning target: "${learningTarget}"
    ${teacherInstructions ? `Teacher instructions: "${teacherInstructions}"` : "Teacher instructions: (none provided)"}
    1. ANALYZE student notes visually across all provided images.
    2. Check whether any face is visible in the submission. If any face is visible, set has_face to true.
    3. Decide if the submission is clearly related to the learning target and assignment. If unrelated or unclear, mark relevance as "unrelated" or "uncertain".
    4. If relevant and has_face is false, ACKNOWLEDGE specific visual elements using objective language (e.g., "The submission contains a map of Europe" or "The handwritten notes follow a clear outline structure") and ASK ONE probing question.
    5. If has_face is true, do NOT discuss the content. Ask the student to upload notes that do not include any faces.
    6. If unrelated or uncertain (and has_face is false), do NOT discuss the content. Ask the student to upload notes that match the assignment topic.
    7. STRICTLY FORBIDDEN: Do not use first-person pronouns (I, me, my, we, us, our). Do NOT say "I see" or "I think".
    8. Keep it brief (under 50 words).
    9. Return ONLY JSON: { "message": "...", "relevance": "relevant" | "unrelated" | "uncertain", "has_face": true | false }`;

    const parts: any[] = [{ text: "Analyze my notes for alignment with the assignment and start the session." }];
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

    // Use AbortController for timeout handling (55s to stay within maxDuration)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                },
            }),
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Gemini analysis failed.");

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(text);
        const relevance = parsed?.relevance;
        const isValidRelevance = relevance === "relevant" || relevance === "unrelated" || relevance === "uncertain";
        const hasFace = Boolean(parsed?.has_face);
        return {
            message: parsed?.message,
            relevance: isValidRelevance ? relevance : "relevant",
            hasFace,
        };
    } catch (e: any) {
        clearTimeout(timeoutId);

        if (e.name === 'AbortError') {
            console.error("Gemini analysis timed out after 55 seconds");
            return {
                message: "The notes have been received. The discussion can begin - what topic should be the focus first?",
                relevance: "relevant",
                hasFace: false,
            };
        }

        console.error("Gemini analysis error", e);
        return {
            message: "PhonemeLab AI is ready to discuss these notes. What topic should be explored first?",
            relevance: "relevant",
            hasFace: false,
        };
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

        const admin = createSupabaseAdminClient();
        const { data: activity, error: activityError } = await admin
            .from("formative_activities")
            .select("title, learning_target, prompt_template")
            .eq("id", activityId)
            .maybeSingle();

        if (activityError || !activity) {
            console.error("StudyLab activity not found", activityError);
            return NextResponse.json({ error: "Activity not found." }, { status: 404 });
        }

        // Process images: Resize to reduce payload size and prevent timeouts
        const processedImages: { buffer: Buffer; mimeType: string }[] = [];

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            let buffer: any = Buffer.from(arrayBuffer as ArrayBuffer);

            // Resize large images
            try {
                // Resize to max 1024px width/height, convert to JPEG 80%
                buffer = await sharp(buffer as any)
                    .rotate() // Auto-rotate based on EXIF
                    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer();

                processedImages.push({ buffer, mimeType: "image/jpeg" });
            } catch (e) {
                console.error("Image processing failed, using original", e);
                // Fallback to original if sharp fails
                processedImages.push({ buffer, mimeType: file.type || "image/jpeg" });
            }
        }

        // 1. Upload original files to Supabase for storage (async, don't block analysis if possible, but we need paths)
        // Actually, we upload originals or resized? 
        // User wants analysis. Let's upload originals for record, but analyze resized.
        // To save time, we can upload in parallel.

        const uploadPromises = files.map(async (file, idx) => {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes as ArrayBuffer);
            const ext = file.name.split('.').pop() || 'jpg';
            const path = `${activityId}/${user.id}/${Date.now()}_${idx}.${ext}`;
            const { error: upError } = await admin.storage
                .from(FORMATIVE_BUCKETS.ARTIFACTS)
                .upload(path, buffer, { contentType: file.type, upsert: true });
            if (upError) console.error("Upload error", upError);
            return path;
        });

        // Start Gemini analysis with RESIZED images (faster)
        const analysisPromise = geminiAnalysis(processedImages, {
            title: activity.title,
            learningTarget: activity.learning_target,
            promptTemplate: activity.prompt_template,
        });

        // Wait for both
        const [uploadPaths, aiResponse] = await Promise.all([
            Promise.all(uploadPromises),
            analysisPromise
        ]);

        const needsReupload = aiResponse.hasFace || aiResponse.relevance === "unrelated" || aiResponse.relevance === "uncertain";
        const message = aiResponse.hasFace
            ? "Please upload a photo of your work that does not include any faces."
            : aiResponse.message || "The notes have been received. The discussion can begin - what topic should be the focus first?";

        return NextResponse.json({
            message,
            imagePaths: uploadPaths,
            needsReupload,
            relevance: aiResponse.relevance,
            hasFace: aiResponse.hasFace,
        });

    } catch (e) {
        console.error("Session Start Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
