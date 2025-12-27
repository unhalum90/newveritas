import { Suspense } from "react";

import { StudentFeedbackClient } from "@/app/student/assessments/[id]/feedback/student-feedback-client";

export default async function StudentFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentFeedbackClient assessmentId={id} />
    </Suspense>
  );
}
