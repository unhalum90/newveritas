"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReviewStage = {
  step: number;
  title: string;
  summary: string;
  details?: string[];
};

type AssessmentReviewDialogProps = {
  open: boolean;
  stages: ReviewStage[];
  loading?: boolean;
  onEditStep: (step: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function AssessmentReviewDialog({
  open,
  stages,
  loading = false,
  onEditStep,
  onClose,
  onConfirm,
}: AssessmentReviewDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Review before publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {stages.map((stage) => (
              <div key={stage.step} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{stage.title}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{stage.summary}</div>
                    {stage.details && stage.details.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
                        {stage.details.map((detail, index) => (
                          <li key={`${stage.step}-${index}`}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => onEditStep(stage.step)} disabled={loading}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}

            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="text-sm font-semibold text-[var(--text)]">AI review</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Coming in Phase 2: automated checks for rubric alignment and clarity.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Keep Editing
            </Button>
            <Button type="button" onClick={onConfirm} disabled={loading}>
              {loading ? "Publishing..." : "Confirm & Publish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
