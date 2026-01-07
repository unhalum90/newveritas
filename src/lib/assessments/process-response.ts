import { isAudioFollowup } from "@/lib/assessments/question-types";
import { generateAudioFollowup, transcribeAudioForFollowup } from "@/lib/ai/audio-followup";
import { detectOffTopic } from "@/lib/ai/off-topic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProcessingContext = {
    submissionId: string;
    assessmentId: string;
    studentId: string;
};

type ProcessResponseOptions = {
    audioPath: string;
    bucket: string;
    mimeType: string;
    questionId: string;
    questionText: string;
    questionType: string | null;
    shouldGenerateFollowup: boolean;
    canEvaluateRestart: boolean;
    context: ProcessingContext;
};

/**
 * Async background processor for student audio responses.
 * Handles STT transcription, follow-up question generation, and off-topic detection.
 * Updates the submission_responses row with results as each stage completes.
 *
 * This function is designed to be called with `void processResponseAsync(...)` from
 * the API route after the response row is inserted, allowing the route to return
 * immediately while processing continues in the background.
 */
export async function processResponseAsync(
    responseId: string,
    options: ProcessResponseOptions
): Promise<void> {
    const admin = createSupabaseAdminClient();

    try {
        // Mark as transcribing
        await admin
            .from("submission_responses")
            .update({ processing_status: "transcribing" })
            .eq("id", responseId);

        // 1. Download audio and transcribe
        const { data: file, error: downloadError } = await admin.storage
            .from(options.bucket)
            .download(options.audioPath);

        if (downloadError) {
            throw new Error(`Failed to download audio: ${downloadError.message}`);
        }

        const buf = Buffer.from(await file.arrayBuffer());
        let transcript: string | null = null;

        if (process.env.OPENAI_API_KEY) {
            transcript = await transcribeAudioForFollowup({
                audio: buf,
                mimeType: options.mimeType || "audio/webm",
                context: {
                    assessmentId: options.context.assessmentId,
                    studentId: options.context.studentId,
                    submissionId: options.context.submissionId,
                    questionId: options.questionId,
                },
            });
        }

        // Save transcript immediately
        await admin
            .from("submission_responses")
            .update({
                transcript: transcript ?? null,
                processing_status: "generating",
            })
            .eq("id", responseId);

        // 2. Generate follow-up question (if applicable)
        let followupQuestion: string | null = null;
        if (options.shouldGenerateFollowup && transcript && process.env.OPENAI_API_KEY) {
            followupQuestion = await generateAudioFollowup({
                questionText: options.questionText,
                transcript,
                context: {
                    assessmentId: options.context.assessmentId,
                    studentId: options.context.studentId,
                    submissionId: options.context.submissionId,
                    questionId: options.questionId,
                },
            });
        }

        // Use fallback if follow-up is required but generation failed
        if (options.shouldGenerateFollowup && !followupQuestion) {
            followupQuestion = "Tell me one more detail about your reasoning.";
        }

        // 3. Off-topic detection (if applicable)
        let restartHint: { reason: "off_topic"; confidence: number | null } | null = null;
        if (options.canEvaluateRestart && transcript && process.env.OPENAI_API_KEY) {
            const offTopic = await detectOffTopic({
                questionText: options.questionText,
                transcript,
                context: {
                    assessmentId: options.context.assessmentId,
                    studentId: options.context.studentId,
                    submissionId: options.context.submissionId,
                    questionId: options.questionId,
                },
            });

            if (offTopic?.offTopic && (offTopic.confidence ?? 0) >= 0.85) {
                restartHint = { reason: "off_topic", confidence: offTopic.confidence ?? null };
            }
        }

        // 4. Mark complete with all results
        const updatePayload: Record<string, unknown> = {
            processing_status: "complete",
            processing_error: null,
        };

        if (followupQuestion) {
            updatePayload.ai_followup_question = followupQuestion;
            updatePayload.ai_followup_created_at = new Date().toISOString();
        }

        // Store restart hint in a way the client can access (using existing field or metadata)
        // For now, we'll rely on the client polling to check for this
        // In a future enhancement, this could be stored in a separate field

        await admin
            .from("submission_responses")
            .update(updatePayload)
            .eq("id", responseId);

        // Log successful processing
        console.log("Async response processing complete", {
            responseId,
            questionId: options.questionId,
            hasTranscript: Boolean(transcript),
            hasFollowup: Boolean(followupQuestion),
            restartHint: restartHint?.reason ?? null,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Processing failed";
        console.error("Async response processing failed", {
            responseId,
            questionId: options.questionId,
            error: msg,
        });

        // Mark as error state
        await admin
            .from("submission_responses")
            .update({
                processing_status: "error",
                processing_error: msg.slice(0, 500),
            })
            .eq("id", responseId);
    }
}

/**
 * Check if a response needs follow-up generation based on question type and response stage.
 */
export function shouldGenerateFollowupForResponse(
    questionType: string | null,
    responseStage: "primary" | "followup"
): boolean {
    return isAudioFollowup(questionType) && responseStage === "primary";
}
