
export const CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "want to die",
    "self-harm",
    "cut myself",
    "no one cares",
    "worthless",
    "hate myself",
    "give up",
    "hopeless"
];

export type CrisisDetectionResult = {
    detected: boolean;
    keyword?: string;
    excerpt?: string;
};

export function detectCrisisLanguage(text: string): CrisisDetectionResult {
    const lower = text.toLowerCase();

    for (const keyword of CRISIS_KEYWORDS) {
        if (lower.includes(keyword)) {
            // Find valid excerpt (context)
            const index = lower.indexOf(keyword);
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + keyword.length + 50);
            const excerpt = "..." + text.substring(start, end).replace(/\n/g, " ") + "...";

            return {
                detected: true,
                keyword,
                excerpt
            };
        }
    }

    return { detected: false };
}

import { sendCrisisAlertEmail } from "@/lib/email/mailerlite";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function processCrisisAlert(input: {
    submissionId: string;
    studentId: string;
    transcript: string;
    detection: CrisisDetectionResult;
    assessmentId: string;
}) {
    if (!input.detection.detected) return;

    const admin = createSupabaseAdminClient();

    // 1. Get Student & School Info (needed for email)
    const { data: submission, error: subError } = await admin
        .from("submissions")
        .select(`
      id,
      assessment:assessments (
        class:classes (
          workspace:workspaces (
            school:schools (
              id,
              name,
              dsl_email
            )
          )
        )
      ),
      student:students (
        first_name,
        last_name
      )
    `)
        .eq("id", input.submissionId)
        .single();

    if (subError || !submission) {
        console.error("Crisis Alert: Failed to fetch submission details", subError);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const school = (submission as any).assessment?.class?.workspace?.school;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentArr = (submission as any).student;
    const student = Array.isArray(studentArr) ? studentArr[0] : studentArr;
    const dslEmail = school?.dsl_email;

    if (!school || !student) return;

    // 2. Log Alert to DB
    const { error: insertError } = await admin
        .from("crisis_alerts")
        .insert({
            school_id: school.id,
            student_id: input.studentId,
            submission_id: input.submissionId,
            keyword_detected: input.detection.keyword,
            context_excerpt: input.detection.excerpt,
            dsl_email_sent_to: dslEmail || null
        });

    if (insertError) {
        console.error("Crisis Alert: Failed to insert alert log", insertError);
    }

    // 3. Mark Submission as Flagged
    await admin
        .from("submissions")
        .update({ crisis_flagged: true })
        .eq("id", input.submissionId);

    // 4. Send Email
    if (dslEmail) {
        const studentName = `${student.first_name} ${student.last_name}`;
        await sendCrisisAlertEmail(dslEmail, studentName, input.detection.excerpt || "", new Date().toLocaleString());
    } else {
        console.warn(`Crisis Alert: No DSL email configured for school ${school.name} (${school.id})`);
    }
}
