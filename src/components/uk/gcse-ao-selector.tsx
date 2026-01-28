"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    EXAM_BOARDS,
    GCSE_ASSESSMENT_OBJECTIVES,
    getAOsForSubject,
    type ExamBoard,
    type AssessmentObjective
} from "@/lib/config/uk-config";

interface GCSEAOSelectorProps {
    ncSubject: string | null;
    examBoard: ExamBoard | null;
    selectedAOs: string[];
    onExamBoardChange: (board: ExamBoard | null) => void;
    onAOsChange: (aoIds: string[]) => void;
}

/**
 * GCSE Assessment Objectives Selector
 * Only shown when Key Stage is KS4 and an NC Subject is selected
 */
export function GCSEAOSelector({
    ncSubject,
    examBoard,
    selectedAOs,
    onExamBoardChange,
    onAOsChange,
}: GCSEAOSelectorProps) {
    const [availableAOs, setAvailableAOs] = useState<AssessmentObjective[]>([]);

    // Update available AOs when subject changes
    useEffect(() => {
        if (ncSubject) {
            // Map NC subject to GCSE subject (some are different names)
            let gcseSubject = ncSubject;
            if (ncSubject === 'English') gcseSubject = 'English Language';
            if (ncSubject === 'Maths') gcseSubject = 'Maths';

            const aos = getAOsForSubject(gcseSubject);
            setAvailableAOs(aos);

            // Clear selected AOs if subject changed and they're no longer valid
            const validAOs = aos.map(ao => ao.id);
            const stillValid = selectedAOs.filter(id => validAOs.includes(id));
            if (stillValid.length !== selectedAOs.length) {
                onAOsChange(stillValid);
            }
        } else {
            setAvailableAOs([]);
        }
    }, [ncSubject, selectedAOs, onAOsChange]);

    const toggleAO = (aoId: string) => {
        if (selectedAOs.includes(aoId)) {
            onAOsChange(selectedAOs.filter(id => id !== aoId));
        } else {
            onAOsChange([...selectedAOs, aoId]);
        }
    };

    if (!ncSubject) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    GCSE
                </span>
                <h4 className="text-sm font-semibold text-[var(--text)]">
                    Assessment Objectives (KS4)
                </h4>
            </div>

            {/* Exam Board Selection */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Exam Board <span className="text-[var(--muted)] font-normal">(Optional)</span>
                </label>
                <select
                    value={examBoard ?? ""}
                    onChange={(e) => onExamBoardChange(e.target.value as ExamBoard || null)}
                    className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                >
                    <option value="">Select exam board...</option>
                    {EXAM_BOARDS.map(board => (
                        <option key={board.id} value={board.id}>{board.label}</option>
                    ))}
                </select>
            </div>

            {/* Assessment Objectives */}
            {availableAOs.length > 0 ? (
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-[var(--muted)]">
                        Assessment Objectives <span className="text-[var(--muted)] font-normal">(Select all that apply)</span>
                    </label>
                    <div className="grid gap-2">
                        {availableAOs.map(ao => {
                            const isSelected = selectedAOs.includes(ao.id);
                            return (
                                <button
                                    key={ao.id}
                                    type="button"
                                    onClick={() => toggleAO(ao.id)}
                                    className={`
                                        flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                                        ${isSelected
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/50'
                                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                                        }
                                    `}
                                >
                                    <div className={`
                                        flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center
                                        ${isSelected
                                            ? 'border-amber-500 bg-amber-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }
                                    `}>
                                        {isSelected && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {ao.code}
                                            </span>
                                            <span className="text-sm font-medium text-[var(--text)]">
                                                {ao.shortDescription}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                                            {ao.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-[var(--border)] bg-gray-50 dark:bg-gray-900/30 p-4">
                    <p className="text-sm text-[var(--muted)] text-center">
                        No GCSE Assessment Objectives available for this subject.
                        <br />
                        <span className="text-xs">AOs are available for: English, Maths, Science, History, Geography</span>
                    </p>
                </div>
            )}

            {/* Selected Summary */}
            {selectedAOs.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{selectedAOs.length} Assessment Objective{selectedAOs.length !== 1 ? 's' : ''} selected</span>
                </div>
            )}
        </div>
    );
}
