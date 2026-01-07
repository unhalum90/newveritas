import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFormativeSignedUrl, FORMATIVE_BUCKETS } from "@/lib/studylab/storage";

interface FileRequest {
    artifactPath: string | null;
    audioPath: string | null;
}

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: FileRequest = await request.json();

        let artifactUrl: string | null = null;
        let audioUrl: string | null = null;

        if (body.artifactPath) {
            // Handle multiple artifact paths (comma-separated)
            const paths = body.artifactPath.split(",");
            const urls = await Promise.all(paths.map(async (path) => {
                const result = await getFormativeSignedUrl("ARTIFACTS", path.trim());
                return result?.url || "";
            }));
            // Filter out failures and join
            artifactUrl = urls.filter(u => u).join(",");
        }

        if (body.audioPath) {
            const result = await getFormativeSignedUrl("AUDIO", body.audioPath);
            audioUrl = result.url;
        }

        return NextResponse.json({ artifactUrl, audioUrl });
    } catch (error) {
        console.error("Error in formative/files:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
