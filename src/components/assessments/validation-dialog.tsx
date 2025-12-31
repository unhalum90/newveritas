"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ValidationError } from "@/lib/validation/assessment-validator";

type ValidationDialogProps = {
  open: boolean;
  errors: ValidationError[];
  onClose: () => void;
};

export function ValidationDialog({ open, errors, onClose }: ValidationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Fix issues before publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            {errors.length} critical issue{errors.length === 1 ? "" : "s"} must be resolved.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--danger)]">
            {errors.map((error, index) => (
              <li key={`${error.type}-${error.rubric_id ?? error.question_id ?? "general"}-${index}`}>
                {error.message}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Fix Issues
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
