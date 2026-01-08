import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface Props {
    params: Promise<{ activityId: string; submissionId: string }>;
}

export default async function StudyLabReviewDetailPage({ params }: Props) {
    const { activityId, submissionId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch Submission
    const { data: submission } = await supabase
        .from("formative_submissions")
        .select(`
            id,
            status,
            submitted_at,
            submission_data,
            student:students (
                first_name,
                last_name,
                email
            ),
            activity:formative_activities (
                id,
                title
            )
        `)
        .eq("id", submissionId)
        .single();

    if (!submission) redirect(`/studylab/${activityId}/review`);

    // Parse History
    // Parse Data
    const history = (submission.submission_data as any)?.history || [];
    const grading = (submission.submission_data as any)?.grading || null;
    const artifactPath = (submission.submission_data as any)?.artifactPath || null;

    // Patch submission object for easier access in JSX
    (submission as any).grading = grading;

    // Sign Audio URLs
    const admin = createSupabaseAdminClient();
    const audioPaths = history
        .map((m: any) => m.audioPath)
        .filter((p: any) => typeof p === "string");

    const signedUrls: Record<string, string> = {};

    if (audioPaths.length > 0) {
        const { data, error } = await admin.storage
            .from("studylab-recordings")
            .createSignedUrls(audioPaths, 60 * 60); // 1 hour

        if (data) {
            data.forEach((item) => {
                if (item.path && item.signedUrl) {
                    signedUrls[item.path] = item.signedUrl;
                }
            });
        }
    }

    // Sign Artifact URL if exists
    let artifactUrl: string | null = null;
    if (artifactPath) {
        const { data: artifactData } = await admin.storage
            .from("studylab-images")
            .createSignedUrl(artifactPath, 60 * 60); // 1 hour
        if (artifactData?.signedUrl) {
            artifactUrl = artifactData.signedUrl;
        }
    }

    const studentData = submission.student as any;
    const studentName = studentData
        ? `${studentData.first_name || ""} ${studentData.last_name || ""}`.trim() || studentData.email || "Unknown Student"
        : "Unknown Student";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text)]">Review Session</h1>
                    <p className="text-[var(--muted)]">Student: {studentName} • Activity: {(submission.activity as any)?.title || (Array.isArray(submission.activity) ? submission.activity[0]?.title : "")}</p>
                </div>
                <div className="flex gap-2">
                    {artifactUrl && (
                        <a href={artifactUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary">
                                <span className="mr-2">📷</span> View Student Notes
                            </Button>
                        </a>
                    )}
                    <Link href={`/studylab/${activityId}/review`}>
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                </div>
            </div>

            <Card className="bg-slate-50 min-h-[500px]">
                <CardHeader className="bg-white border-b">
                    <CardTitle className="flex items-center gap-2">
                        <span>💬</span> Chat Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {history.length === 0 ? (
                        <p className="text-center text-[var(--muted)]">No conversation history found.</p>
                    ) : (
                        history.map((msg: any, i: number) => {
                            const isUser = msg.role === 'user';
                            const audioUrl = msg.audioPath ? signedUrls[msg.audioPath] : null;

                            return (
                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] space-y-2
                                    `}>
                                        <div className={`
                                            p-4 rounded-2xl shadow-sm text-sm
                                            ${isUser
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
                                        `}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {isUser && audioUrl && (
                                            <div className="flex justify-end">
                                                <audio controls src={audioUrl} className="h-8 max-w-full" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* AI Grading & Feedback */}
            <Card>
                <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <span>🤖</span> AI Assessment
                    </CardTitle>
                    {grading?.score && (
                        <div className={`
                            px-4 py-1 rounded-full text-sm font-bold
                            ${grading.score >= 3 ? 'bg-green-100 text-green-700' :
                                grading.score === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
                        `}>
                            Score: {grading.score} / 4
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {grading ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-[var(--muted)] uppercase mb-2">Summary</h3>
                                <p className="text-[var(--text)] leading-relaxed">{grading.summary}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-green-600 uppercase mb-2">Strengths</h3>
                                    <ul className="space-y-2">
                                        {grading.feedback?.strengths?.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-green-500 mt-0.5">✓</span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-amber-600 uppercase mb-2">Focus Areas</h3>
                                    <ul className="space-y-2">
                                        {grading.feedback?.improvements?.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-amber-500 mt-0.5">→</span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[var(--muted)] flex flex-col items-center gap-4">
                            <div>
                                <p>No grading data available for this session.</p>
                                <p className="text-xs mt-1">Automatic grading is usually applied upon submission.</p>
                            </div>
                            <form action={async () => {
                                "use server";
                                // This is a bit simplistic, ideally we'd use a client component for the button to handle loading state
                                // But for now, we can try a simple form action or just direct the user.
                                // Actually, let's use a Client Component wrapper for the button to get nice loading state.
                            }}>
                                <RetryGradingButton submissionId={submissionId} />
                            </form>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { RetryGradingButton } from "./retry-grading-button";
