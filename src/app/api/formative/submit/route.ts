import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    FORMATIVE_BUCKETS,
    generateFormativeArtifactPath,
    generateFormativeAudioPath,
} from "@/lib/studylab/storage";

// Input modes for UDL accessibility
type InputMode = "scan" | "voice_memo" | "digital" | "skeleton";

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const activityId = formData.get("activityId") as string;
        const studentId = formData.get("studentId") as string;
        const inputMode = (formData.get("inputMode") as InputMode) || "scan";
        const audioFile = formData.get("audio") as File | null;

        // Mode-specific inputs
        // For scan mode, support multiple artifact files (artifact_0, artifact_1, etc.)
        const artifactCount = parseInt(formData.get("artifactCount") as string || "0", 10);
        const artifactFiles: File[] = [];
        for (let i = 0; i < artifactCount; i++) {
            const file = formData.get(`artifact_${i}`) as File | null;
            if (file) {
                artifactFiles.push(file);
            }
        }
        // Fallback to single artifact for backward compatibility
        const singleArtifact = formData.get("artifact") as File | null;
        if (singleArtifact && artifactFiles.length === 0) {
            artifactFiles.push(singleArtifact);
        }

        const digitalNotes = formData.get("digitalNotes") as string | null;
        const voiceMemoFile = formData.get("voiceMemo") as File | null;
        const usedSkeleton = formData.get("usedSkeleton") === "true";

        if (!activityId || !studentId) {
            return NextResponse.json(
                { error: "Missing activityId or studentId" },
                { status: 400 }
            );
        }

        if (!audioFile) {
            return NextResponse.json(
                { error: "Audio recording is required" },
                { status: 400 }
            );
        }

        // Validate based on input mode
        if (inputMode === "scan" && artifactFiles.length === 0) {
            return NextResponse.json(
                { error: "At least one artifact file is required for scan mode" },
                { status: 400 }
            );
        }
        if (inputMode === "digital" && !digitalNotes?.trim()) {
            return NextResponse.json(
                { error: "Digital notes are required for digital mode" },
                { status: 400 }
            );
        }
        if (inputMode === "voice_memo" && !voiceMemoFile) {
            return NextResponse.json(
                { error: "Voice memo is required for voice memo mode" },
                { status: 400 }
            );
        }

        // Verify student owns this record
        const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("auth_user_id", user.id)
            .eq("id", studentId)
            .maybeSingle();

        if (!student) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const admin = createSupabaseAdminClient();

        // Check if submission exists
        let { data: submission } = await admin
            .from("formative_submissions")
            .select("id, status")
            .eq("activity_id", activityId)
            .eq("student_id", studentId)
            .maybeSingle();

        // Create submission if it doesn't exist
        if (!submission) {
            const { data: newSubmission, error: createError } = await admin
                .from("formative_submissions")
                .insert({
                    activity_id: activityId,
                    student_id: studentId,
                    status: "assigned",
                })
                .select("id, status")
                .single();

            if (createError) {
                console.error("Error creating submission:", createError);
                return NextResponse.json(
                    { error: "Failed to create submission" },
                    { status: 500 }
                );
            }
            submission = newSubmission;
        }

        // Don't allow resubmission if already submitted (unless needs_resubmission is true)
        if (submission.status === "submitted" || submission.status === "reviewed") {
            const { data: feedback } = await admin
                .from("formative_feedback")
                .select("needs_resubmission")
                .eq("submission_id", submission.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!feedback?.needs_resubmission) {
                return NextResponse.json(
                    { error: "Already submitted" },
                    { status: 400 }
                );
            }
        }

        // Store artifact URLs (can be multiple for scan mode)
        const artifactUrls: string[] = [];
        let artifactMetadata: {
            filename: string;
            mimeType: string;
            size: number;
        } | null = null;

        // Handle artifact based on input mode
        if (inputMode === "scan" && artifactFiles.length > 0) {
            // Upload all scanned artifacts
            for (let i = 0; i < artifactFiles.length; i++) {
                const file = artifactFiles[i];
                const artifactPath = generateFormativeArtifactPath(
                    activityId,
                    studentId,
                    `page_${i + 1}_${file.name}`
                );
                const artifactBuffer = await file.arrayBuffer();

                const { error: artifactUploadError } = await admin.storage
                    .from(FORMATIVE_BUCKETS.ARTIFACTS)
                    .upload(artifactPath, artifactBuffer, {
                        contentType: file.type,
                        upsert: true,
                    });

                if (artifactUploadError) {
                    console.error(`Error uploading artifact ${i}:`, artifactUploadError);
                    return NextResponse.json(
                        { error: `Failed to upload artifact page ${i + 1}` },
                        { status: 500 }
                    );
                }

                artifactUrls.push(artifactPath);
            }

            // Use first file for metadata
            artifactMetadata = {
                filename: artifactFiles[0].name,
                mimeType: artifactFiles[0].type,
                size: artifactFiles.reduce((sum, f) => sum + f.size, 0),
            };
        } else if (inputMode === "digital" && digitalNotes) {
            // Store digital notes as a text file
            const notesBlob = new Blob([digitalNotes], { type: "text/plain" });
            const notesPath = generateFormativeArtifactPath(
                activityId,
                studentId,
                "digital_notes.txt"
            );

            const { error: notesUploadError } = await admin.storage
                .from(FORMATIVE_BUCKETS.ARTIFACTS)
                .upload(notesPath, await notesBlob.arrayBuffer(), {
                    contentType: "text/plain",
                    upsert: true,
                });

            if (notesUploadError) {
                console.error("Error uploading digital notes:", notesUploadError);
                return NextResponse.json(
                    { error: "Failed to save digital notes" },
                    { status: 500 }
                );
            }

            artifactUrls.push(notesPath);
            artifactMetadata = {
                filename: "digital_notes.txt",
                mimeType: "text/plain",
                size: notesBlob.size,
            };
        } else if (inputMode === "voice_memo" && voiceMemoFile) {
            // Upload voice memo as the artifact
            const memoPath = generateFormativeArtifactPath(
                activityId,
                studentId,
                "voice_memo.webm"
            );
            const memoBuffer = await voiceMemoFile.arrayBuffer();

            const { error: memoUploadError } = await admin.storage
                .from(FORMATIVE_BUCKETS.ARTIFACTS)
                .upload(memoPath, memoBuffer, {
                    contentType: voiceMemoFile.type || "audio/webm",
                    upsert: true,
                });

            if (memoUploadError) {
                console.error("Error uploading voice memo:", memoUploadError);
                return NextResponse.json(
                    { error: "Failed to upload voice memo" },
                    { status: 500 }
                );
            }

            artifactUrls.push(memoPath);
            artifactMetadata = {
                filename: "voice_memo.webm",
                mimeType: voiceMemoFile.type || "audio/webm",
                size: voiceMemoFile.size,
            };
        } else if (inputMode === "skeleton") {
            // No artifact for skeleton mode - teacher prompt was used
            // Store a marker file
            const skeletonMarker = JSON.stringify({
                mode: "skeleton",
                timestamp: new Date().toISOString(),
                message: "Student used 'Help me start' prompt",
            });
            const markerBlob = new Blob([skeletonMarker], {
                type: "application/json",
            });
            const markerPath = generateFormativeArtifactPath(
                activityId,
                studentId,
                "skeleton_marker.json"
            );

            await admin.storage
                .from(FORMATIVE_BUCKETS.ARTIFACTS)
                .upload(markerPath, await markerBlob.arrayBuffer(), {
                    contentType: "application/json",
                    upsert: true,
                });

            artifactUrls.push(markerPath);
            artifactMetadata = {
                filename: "skeleton_marker.json",
                mimeType: "application/json",
                size: markerBlob.size,
            };
        }

        // Upload main audio explanation
        const audioPath = generateFormativeAudioPath(activityId, studentId);
        const audioBuffer = await audioFile.arrayBuffer();

        const { error: audioUploadError } = await admin.storage
            .from(FORMATIVE_BUCKETS.AUDIO)
            .upload(audioPath, audioBuffer, {
                contentType: audioFile.type || "audio/webm",
                upsert: true,
            });

        if (audioUploadError) {
            console.error("Error uploading audio:", audioUploadError);
            return NextResponse.json(
                { error: "Failed to upload audio" },
                { status: 500 }
            );
        }

        // Update submission record with input mode for analytics
        // Store all artifact URLs as comma-separated list
        const { error: updateError } = await admin
            .from("formative_submissions")
            .update({
                artifact_url: artifactUrls.length > 0 ? artifactUrls.join(",") : null,
                audio_url: audioPath,
                status: "submitted",
                submitted_at: new Date().toISOString(),
            })
            .eq("id", submission.id);

        if (updateError) {
            console.error("Error updating submission:", updateError);
            return NextResponse.json(
                { error: "Failed to update submission" },
                { status: 500 }
            );
        }

        // Create file records
        // Table schema: id, submission_id, file_path, file_type (image|audio), created_at
        interface FileRecord {
            submission_id: string;
            file_type: "image" | "audio";
            file_path: string;
        }

        const fileRecords: FileRecord[] = [
            {
                submission_id: submission.id,
                file_type: "audio",
                file_path: audioPath,
            },
        ];

        // Add artifact file records if applicable
        if (artifactMetadata && artifactUrls.length > 0) {
            // Map input mode to valid file_type (image or audio)
            const artifactFileType: "image" | "audio" =
                inputMode === "voice_memo" ? "audio" : "image";

            for (const url of artifactUrls) {
                fileRecords.push({
                    submission_id: submission.id,
                    file_type: artifactFileType,
                    file_path: url,
                });
            }
        }

        await admin.from("formative_submission_files").insert(fileRecords);

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            inputMode,
        });
    } catch (error) {
        console.error("Error in formative/submit:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
