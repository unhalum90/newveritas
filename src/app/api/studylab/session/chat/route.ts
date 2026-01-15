import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/scoring/submission";

interface ChatContext {
    learningTarget: string;
    difficulty: string;
    maxTurns: number;
}

async function geminiChatResponse(transcript: string, history: { role: string; content: string }[], context: ChatContext) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const model = "gemini-3-flash-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const turnCount = history ? history.length : 0;
    const { maxTurns, learningTarget, difficulty } = context;

    // Calculate phases based on maxTurns
    const closureTurn = maxTurns + 1; // e.g. 7
    const finalQuestionTurn = maxTurns - 1; // e.g. 5

    let systemPrompt = "";
    let isComplete = false;

    // Difficulty Instructions
    let pedagogy = "";
    if (difficulty === "supportive") {
        pedagogy = "Be very supportive. Use hints and define complex terms. Validate the student frequently.";
    } else if (difficulty === "challenge") {
        pedagogy = "Push the student's thinking. Ask for evidence and deeper reasoning. Do not settle for surface-level answers.";
    } else {
        pedagogy = "Be a balanced Socratic tutor. Guide them but don't give the answer.";
    }

    if (turnCount >= closureTurn) {
        // Closure Phase
        systemPrompt = `You are a friendly Socratic tutor closing a session.
        Context: The goal was "${learningTarget}".
        1. Read the student's final reflection/question.
        2. Validate it positively.
        3. Do NOT ask another question.
        4. Say goodbye comfortably.
        5. Return ONLY JSON: { "message": "..." }`;
        isComplete = true;
    } else if (turnCount >= finalQuestionTurn) {
        // Final Question Phase
        systemPrompt = `You are a friendly Socratic tutor.
        Context: The goal is "${learningTarget}".
        1. Acknowledge the student's previous answer briefly.
        2. Asking the following exact final question: "What is the biggest or most difficult question you still have about this concept?"
        3. Return ONLY JSON: { "message": "..." }`;
    } else {
        // Normal Phase
        systemPrompt = `You are a friendly, encouraging Socratic tutor. 
        Context: The goal is "${learningTarget}".
        Pedagogy: ${pedagogy}
        1. Respond to the student's current answer.
        2. ASK ONE probing question to deepen the discussion towards the goal.
        3. Keep it brief (under 50 words). 
        4. Anchor your response to the fact that you have seen their notes/work. "I see in your notes..."
        5. Return ONLY JSON: { "message": "..." }`;
    }

    const contents = [];

    // History & Prompt Construction
    let userPromptText = `Required: Respond to this student answer: "${transcript}"`;
    if (history && history.length > 0) {
        const historyText = history.map(m => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.content}`).join("\n");
        userPromptText = `Conversation History:\n${historyText}\n\n${userPromptText}`;
    }

    contents.push({
        role: "user",
        parts: [{ text: userPromptText }]
    });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    try {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(text);
        return { message: parsed.message, isComplete };
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
        const file = formData.get("file") as File; // Audio blob
        const activityId = formData.get("activityId") as string;
        const historyJson = formData.get("history") as string;
        const history = historyJson ? JSON.parse(historyJson) : [];

        if (!file || !activityId) return NextResponse.json({ error: "Missing audio or activityId" }, { status: 400 });

        const admin = createSupabaseAdminClient();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const path = `${user.id}/${activityId}/${Date.now()}_audio.webm`;

        // Fetch Activity Configuration
        const { data: activity } = await admin
            .from("formative_activities")
            .select("learning_target, max_turns, difficulty")
            .eq("id", activityId)
            .single();

        const context: ChatContext = {
            learningTarget: activity?.learning_target || "Review the general topic.",
            maxTurns: activity?.max_turns || 6,
            difficulty: activity?.difficulty || "standard"
        };

        // 1. Upload Audio
        const { error: uploadError } = await admin.storage
            .from("studylab-recordings")
            .upload(path, file, { contentType: file.type || "audio/webm", upsert: true });

        if (uploadError) console.error("Audio Upload failed", uploadError);

        // 2. Transcribe
        const transcript = await transcribeAudio(buffer, file.type || "audio/webm");

        // 3. Generate AI Response
        const aiResponse = await geminiChatResponse(transcript, history, context);

        return NextResponse.json({
            success: true,
            transcript: transcript,
            message: aiResponse.message,
            isComplete: aiResponse.isComplete,
            audioPath: path
        });

    } catch (e) {
        console.error("Chat Session Error", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal Error" }, { status: 500 });
    }
}
