import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateStudentCode } from "@/lib/students/code";

const importSchema = z.object({
    courseId: z.string().min(1),
    className: z.string().min(1).optional(),
});

interface ClassroomStudent {
    userId: string;
    profile: {
        id: string;
        name?: {
            givenName?: string;
            familyName?: string;
            fullName?: string;
        };
        emailAddress?: string;
    };
}

/**
 * GET /api/classroom/import?courseId=xxx
 * Preview students from a Google Classroom course
 */
export async function GET(request: NextRequest) {
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
        return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

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
        // Fetch students from the course
        const response = await fetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
            {
                headers: {
                    Authorization: `Bearer ${providerToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Classroom students error:", response.status, errorData);
            return NextResponse.json(
                { error: "Failed to fetch students from Google Classroom" },
                { status: 500 }
            );
        }

        const data = await response.json();

        const students = (data.students || []).map((student: ClassroomStudent) => ({
            googleId: student.profile.id,
            firstName: student.profile.name?.givenName || "",
            lastName: student.profile.name?.familyName || "",
            email: student.profile.emailAddress || null,
        }));

        const res = NextResponse.json({ students, count: students.length });
        pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
    } catch (error) {
        console.error("Classroom import preview error:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

/**
 * POST /api/classroom/import
 * Import students from Google Classroom into SayVeritas
 */
export async function POST(request: NextRequest) {
    const { supabase, pendingCookies } = createRouteSupabaseClient(request);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;

    const providerToken = session.provider_token;
    if (!providerToken) {
        return NextResponse.json(
            { error: "No Google token available. Please sign out and sign in again with Google." },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { courseId, className } = parsed.data;

    try {
        const admin = createSupabaseAdminClient();

        // Get teacher info
        const { data: teacher, error: teacherError } = await admin
            .from("teachers")
            .select("id, school_id, workspace_id")
            .eq("user_id", user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Fetch course info for class name if not provided
        let finalClassName = className;
        if (!finalClassName) {
            const courseRes = await fetch(
                `https://classroom.googleapis.com/v1/courses/${courseId}`,
                {
                    headers: { Authorization: `Bearer ${providerToken}` },
                }
            );
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                finalClassName = courseData.name || `Imported ${new Date().toLocaleDateString()}`;
            }
        }

        // Create class in SayVeritas
        const { data: newClass, error: classError } = await admin
            .from("classes")
            .insert({
                name: finalClassName || "Imported Class",
                workspace_id: teacher.workspace_id,
                description: `Imported from Google Classroom (${courseId})`,
            })
            .select("id")
            .single();

        if (classError) {
            // Class might already exist
            if (classError.code === "23505") {
                return NextResponse.json(
                    { error: "This Google Classroom course has already been imported" },
                    { status: 409 }
                );
            }
            throw classError;
        }

        // Fetch students from Google Classroom
        const studentsRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
            {
                headers: { Authorization: `Bearer ${providerToken}` },
            }
        );

        if (!studentsRes.ok) {
            return NextResponse.json(
                { error: "Failed to fetch students from Google Classroom" },
                { status: 500 }
            );
        }

        const studentsData = await studentsRes.json();
        const classroomStudents: ClassroomStudent[] = studentsData.students || [];

        // Create students in SayVeritas (Parallelized for performance)
        const createdStudents: { name: string; code: string }[] = [];
        const errors: string[] = [];

        // Process in chunks of 5 to avoid rate limits but speed up execution
        const chunkSize = 5;
        for (let i = 0; i < classroomStudents.length; i += chunkSize) {
            const chunk = classroomStudents.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (student) => {
                const firstName = student.profile.name?.givenName || "";
                const lastName = student.profile.name?.familyName || "";
                const email = student.profile.emailAddress;
                const studentCode = generateStudentCode();

                try {
                    // Create auth user for student
                    const { data: authData, error: authError } = await admin.auth.admin.createUser({
                        email: email || `${studentCode.toLowerCase()}@student.sayveritas.local`,
                        email_confirm: true,
                        user_metadata: { role: "student" },
                    });

                    if (authError) {
                        // User might already exist
                        if (authError.message?.includes("already been registered")) {
                            errors.push(`${firstName} ${lastName} already exists`);
                            return;
                        }
                        throw authError;
                    }

                    // Create student record
                    await admin.from("students").insert({
                        class_id: newClass.id,
                        first_name: firstName,
                        last_name: lastName,
                        student_code: studentCode,
                        auth_user_id: authData.user.id,
                    });

                    createdStudents.push({
                        name: `${firstName} ${lastName}`.trim(),
                        code: studentCode,
                    });
                } catch (err) {
                    console.error(`Failed to create student ${firstName} ${lastName}:`, err);
                    errors.push(`${firstName} ${lastName}`);
                }
            }));
        }

        const res = NextResponse.json({
            success: true,
            classId: newClass.id,
            className: finalClassName,
            imported: createdStudents.length,
            students: createdStudents,
            errors: errors.length > 0 ? errors : undefined,
        });
        pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
    } catch (error) {
        console.error("Classroom import error:", error);
        return NextResponse.json({ error: "Failed to import students" }, { status: 500 });
    }
}
