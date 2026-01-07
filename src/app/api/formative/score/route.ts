import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ScoreRequest {
    submissionId: string;
    teacherId: string;
    accuracy: number | null;
    reasoning: number | null;
    clarity: number | null;
    transfer: number | null;
    comment: string;
    needsResubmission: boolean;
}

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ScoreRequest = await request.json();

        // teacherId should match the authenticated user
        if (body.teacherId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const admin = createSupabaseAdminClient();

        // Verify submission exists and teacher owns the activity
        const { data: submission } = await admin
            .from("formative_submissions")
            .select(`
        id,
        activity:formative_activities (
          teacher_id
        )
      `)
            .eq("id", body.submissionId)
            .single();

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        const activity = Array.isArray(submission.activity)
            ? submission.activity[0]
            : submission.activity;

        if (!activity || activity.teacher_id !== body.teacherId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Upsert score
        const { error: scoreError } = await admin
            .from("formative_scores")
            .upsert(
                {
                    submission_id: body.submissionId,
                    accuracy: body.accuracy,
                    reasoning: body.reasoning,
                    clarity: body.clarity,
                    transfer: body.transfer,
                    scored_by: body.teacherId,
                    scored_at: new Date().toISOString(),
                },
                { onConflict: "submission_id" }
            );

        if (scoreError) {
            console.error("Error saving score:", scoreError);
            return NextResponse.json(
                { error: "Failed to save score" },
                { status: 500 }
            );
        }

        // Insert feedback
        if (body.comment.trim()) {
            const { error: feedbackError } = await admin
                .from("formative_feedback")
                .insert({
                    submission_id: body.submissionId,
                    comment: body.comment.trim(),
                    feedback_by: body.teacherId,
                    needs_resubmission: body.needsResubmission,
                });

            if (feedbackError) {
                console.error("Error saving feedback:", feedbackError);
                // Don't fail the whole request
            }
        }

        // Update submission status to reviewed
        const { error: updateError } = await admin
            .from("formative_submissions")
            .update({
                status: "reviewed",
                reviewed_at: new Date().toISOString(),
                reviewed_by: body.teacherId,
            })
            .eq("id", body.submissionId);

        if (updateError) {
            console.error("Error updating submission:", updateError);
            return NextResponse.json(
                { error: "Failed to update submission" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in formative/score:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
