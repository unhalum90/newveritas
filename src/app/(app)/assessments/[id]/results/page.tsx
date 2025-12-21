import { Suspense } from "react";

import { AssessmentResultsClient } from "@/app/(app)/assessments/[id]/results/results-client";

export default async function AssessmentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading…</div>}>
      <AssessmentResultsClient assessmentId={id} />
    </Suspense>
  );
}
