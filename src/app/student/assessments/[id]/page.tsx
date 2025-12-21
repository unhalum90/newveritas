import { Suspense } from "react";

import { StudentAssessmentClient } from "@/app/student/assessments/[id]/student-assessment-client";

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentAssessmentClient assessmentId={id} />
    </Suspense>
  );
}

