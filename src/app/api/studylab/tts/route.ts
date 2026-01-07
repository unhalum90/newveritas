import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("Missing OPENAI_API_KEY");
            return NextResponse.json({ error: "TTS service not configured" }, { status: 500 });
        }

        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: voice || "alloy",
                response_format: "mp3",
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenAI TTS Error:", error);
            return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
        }

        // Stream the audio back
        return new NextResponse(response.body, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-cache",
            },
        });

    } catch (error) {
        console.error("TTS API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
