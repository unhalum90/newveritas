import { Suspense } from "react";

import { StudentAssessmentClient } from "@/app/student/assessments/[id]/student-assessment-client";

export default async function StudentAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const preview = resolvedSearchParams?.preview === "1";
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <StudentAssessmentClient assessmentId={id} preview={preview} />
    </Suspense>
  );
}
