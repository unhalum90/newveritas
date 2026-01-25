import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CreateFormativeRequest {
    teacherId: string;
    title: string;
    promptTemplate: string;
    rubricTemplate: string;
    dueAt: string | null;
    status: "draft" | "live";
    classIds: string[];
    type?: "pulse" | "studylab";
    // New fields
    learningTarget?: string;
    maxTurns?: number;
    difficulty?: "supportive" | "standard" | "challenge";
    // Feedback visibility
    showScoreToStudent?: boolean;
    showSummaryToStudent?: boolean;
    showStrengthsToStudent?: boolean;
    showWeaknessesToStudent?: boolean;
    // Artifact settings
    requireArtifact?: boolean;
    maxArtifactCount?: number;
}

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: CreateFormativeRequest = await request.json();

        // teacherId should match the authenticated user
        if (body.teacherId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const admin = createSupabaseAdminClient();

        // Create the formative activity
        const { data: activity, error: activityError } = await admin
            .from("formative_activities")
            .insert({
                teacher_id: body.teacherId,
                title: body.title,
                prompt_template: body.promptTemplate || null,
                learning_target: body.learningTarget || null,
                max_turns: body.maxTurns || 6,
                difficulty: body.difficulty || 'standard',
                rubric_template: body.rubricTemplate,
                due_at: body.dueAt,
                status: body.status,
                type: body.type || "pulse",
                // Feedback visibility (default to true if not provided)
                show_score_to_student: body.showScoreToStudent ?? true,
                show_summary_to_student: body.showSummaryToStudent ?? true,
                show_strengths_to_student: body.showStrengthsToStudent ?? true,
                show_weaknesses_to_student: body.showWeaknessesToStudent ?? true,
                // Artifact settings
                require_artifact: body.requireArtifact ?? true,
                max_artifact_count: body.maxArtifactCount ?? 1,
            })
            .select("id")
            .single();

        if (activityError) {
            console.error("Error creating formative activity:", activityError);
            return NextResponse.json(
                { error: "Failed to create activity" },
                { status: 500 }
            );
        }

        // Create class assignments if publishing
        if (body.status === "live" && body.classIds.length > 0) {
            const assignments = body.classIds.map((classId) => ({
                activity_id: activity.id,
                class_id: classId,
                teacher_id: body.teacherId, // Required for RLS
            }));

            const { error: assignmentError } = await admin
                .from("formative_assignments")
                .insert(assignments);

            if (assignmentError) {
                console.error("Error creating formative assignments:", assignmentError);
                // Don't fail the whole request, activity was created successfully
            }

            // Create initial submission records for all students in assigned classes via class_enrollments
            const { data: enrollments } = await admin
                .from("class_enrollments")
                .select("student_id")
                .in("class_id", body.classIds);

            if (enrollments && enrollments.length > 0) {
                const submissions = enrollments.map((enrollment) => ({
                    activity_id: activity.id,
                    student_id: enrollment.student_id,
                    status: "assigned",
                }));

                const { error: submissionError } = await admin
                    .from("formative_submissions")
                    .insert(submissions);

                if (submissionError) {
                    console.error("Error creating initial submissions:", submissionError);
                    // Don't fail the whole request
                }
            }
        }

        return NextResponse.json({ activityId: activity.id });
    } catch (error) {
        console.error("Error in formative/create:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
