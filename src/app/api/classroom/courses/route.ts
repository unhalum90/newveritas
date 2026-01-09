import { NextResponse, type NextRequest } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

/**
 * GET /api/classroom/courses
 * Fetches the teacher's Google Classroom courses using their OAuth token
 */
export async function GET(request: NextRequest) {
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);

    // Get current session with provider token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const providerToken = session.provider_token;
    if (!providerToken) {
        return NextResponse.json(
            { error: "No Google token available. Please sign out and sign in again with Google." },
            { status: 401 }
        );
    }

    try {
        // Fetch courses from Google Classroom API
        const response = await fetch(
            "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&teacherId=me",
            {
                headers: {
                    Authorization: `Bearer ${providerToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Classroom API error:", response.status, errorData);

            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { error: "Google Classroom access denied. Please sign out and sign in again with Google." },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                { error: "Failed to fetch courses from Google Classroom" },
                { status: 500 }
            );
        }

        const data = await response.json();

        // Map to simplified format
        const courses = (data.courses || []).map((course: {
            id: string;
            name: string;
            section?: string;
            descriptionHeading?: string;
            courseState?: string;
        }) => ({
            id: course.id,
            name: course.name,
            section: course.section || null,
            description: course.descriptionHeading || null,
        }));

        const res = NextResponse.json({ courses });
        pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
    } catch (error) {
        console.error("Classroom courses error:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}
