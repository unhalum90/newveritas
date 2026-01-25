import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Minimal silent audio (base64 encoded tiny MP3) for fallback
const SILENT_AUDIO_BASE64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYL2TIFAAAAAAD/+1DEAAAFYANf9AAAIoMAbM8wAAACqqLoQhCfE4CAIAmA+D4Ph8HwfB8HwfB8HwfUCAIAgCYPg+D4Pg+D4Pg+D4Pg+oEBAEwfB8HwfB8HwfB8HwfB8H1AgIAmD4Pg+D4Pg+D4P/+1DEGQAAADSAAAAAAAAANIAAAAAg+D4Pg+D6gQEATB8HwfB8HwfB8HwfB8HwfUCAgCYPg+D4Pg+D4Pg+D4Pg+D6gQEATB8HwfB8HwfB8HwfB8HwfB9QICA=";

// Helper to return silent audio with fallback header
function silentAudioResponse(fallbackType: string) {
    const silentBuffer = Buffer.from(SILENT_AUDIO_BASE64, "base64");
    return new NextResponse(silentBuffer, {
        headers: {
            "Content-Type": "audio/mpeg",
            "X-TTS-Fallback": fallbackType,
        },
    });
}

// Google Cloud TTS using REST API (Chirp3 HD voices)
async function synthesizeWithGoogleCloud(text: string, voiceName: string): Promise<Buffer | null> {
    const apiKey = process.env.GOOGLE_TTS_GENERATIVE_LANGUAGE_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    // Use the Google Cloud TTS REST endpoint with API key
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;

    // Parse voice name (e.g., "en-US-Chirp3-HD-Kore")
    const languageCode = voiceName.split("-").slice(0, 2).join("-"); // "en-US"

    const requestBody = {
        input: { text },
        voice: {
            languageCode,
            name: voiceName,
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0,
        },
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google Cloud TTS Error:", errorText);
            return null;
        }

        const data = await response.json() as { audioContent?: string };
        if (!data.audioContent) return null;

        return Buffer.from(data.audioContent, "base64");
    } catch (error) {
        console.error("Google Cloud TTS Error:", error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn("TTS: User not authenticated, returning silent audio");
            return silentAudioResponse("unauthorized");
        }

        const { text } = await req.json();

        if (!text) {
            return silentAudioResponse("no-text");
        }

        // Try Google Cloud TTS with Chirp3 voice (high quality)
        const googleVoice = process.env.GOOGLE_TTS_VOICE_US || "en-US-Chirp3-HD-Kore";
        const googleAudio = await synthesizeWithGoogleCloud(text, googleVoice);

        if (googleAudio) {
            return new NextResponse(googleAudio as unknown as BodyInit, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Fallback: Return silent audio, let client use browser TTS
        console.warn("TTS: Google Cloud TTS failed, returning silent audio for browser fallback");
        return silentAudioResponse("google-failed");

    } catch (error) {
        console.error("TTS API Error:", error);
        return silentAudioResponse("error");
    }
}
