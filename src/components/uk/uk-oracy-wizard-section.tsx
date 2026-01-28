"use client";

import { useState } from "react";
import { useUKLocale } from "@/hooks/use-uk-locale";
import { KeyStageCardSelector } from "@/components/uk/key-stage-selector";
import { GCSEAOSelector } from "@/components/uk/gcse-ao-selector";
import { YEAR_GROUPS, NC_SUBJECTS, KeyStage, ExamBoard, supportsGCSEAOs } from "@/lib/config/uk-config";

interface UKOracyWizardSectionProps {
    keyStage: KeyStage | null;
    onKeyStageChange: (ks: KeyStage | null) => void;
    yearGroup: string | null;
    onYearGroupChange: (yg: string | null) => void;
    ncSubject: { subject: string; domain: string | null } | null;
    onNCSubjectChange: (val: { subject: string; domain: string | null } | null) => void;
    oracyFocus: string;
    onOracyFocusChange: (focus: string) => void;
    // GCSE KS4 props
    examBoard?: ExamBoard | null;
    onExamBoardChange?: (board: ExamBoard | null) => void;
    assessmentObjectives?: string[];
    onAssessmentObjectivesChange?: (aos: string[]) => void;
    // Other props
    contextType?: string;
    onContextTypeChange?: (type: string) => void;
    scaffoldLevel?: "heavy" | "light" | "none";
    onScaffoldLevelChange?: (level: "heavy" | "light" | "none") => void;
    disabled?: boolean;
}

/**
 * UK Oracy Wizard Section
 * 
 * Conditional section for UK locale assessments.
 * Aligned with National Curriculum and manual oracy focus.
 * Includes GCSE Assessment Objectives for KS4.
 */
export function UKOracyWizardSection({
    keyStage,
    onKeyStageChange,
    yearGroup,
    onYearGroupChange,
    ncSubject,
    onNCSubjectChange,
    oracyFocus,
    onOracyFocusChange,
    examBoard,
    onExamBoardChange,
    assessmentObjectives = [],
    onAssessmentObjectivesChange,
    contextType = "lesson",
    onContextTypeChange,
    scaffoldLevel = "heavy",
    onScaffoldLevelChange,
    disabled = false,
}: UKOracyWizardSectionProps) {
    const { isUK } = useUKLocale();

    // Don't render if not UK locale
    if (!isUK) return null;

    // Available year groups filtered by Key Stage
    const availableYearGroups = keyStage ? YEAR_GROUPS[keyStage] : [];

    // Current subject's domains
    const currentSubject = NC_SUBJECTS.find(s => s.subject === ncSubject?.subject);

    // Check if GCSE AO section should be shown
    const showGCSESection = supportsGCSEAOs(keyStage) && ncSubject && onExamBoardChange && onAssessmentObjectivesChange;

    return (
        <div className="space-y-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2 mb-4">
                <span
                    className="w-2 h-2 rounded-full bg-blue-500"
                    aria-hidden="true"
                />
                <h3 className="font-semibold text-[var(--text)]">UK Curriculum Settings</h3>
            </div>

            {/* Key Stage Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Key Stage
                </label>
                <KeyStageCardSelector
                    value={keyStage}
                    onChange={(ks) => {
                        if (!disabled) {
                            onKeyStageChange(ks);
                            onYearGroupChange(null); // Reset year group when KS changes
                            // Clear GCSE data if moving away from KS4
                            if (ks !== 'KS4' && onExamBoardChange && onAssessmentObjectivesChange) {
                                onExamBoardChange(null);
                                onAssessmentObjectivesChange([]);
                            }
                        }
                    }}
                    className={disabled ? "opacity-50 pointer-events-none" : ""}
                />
            </div>

            {/* Year Group Selection */}
            {keyStage && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Year Group
                    </label>
                    <select
                        value={yearGroup ?? ""}
                        onChange={(e) => !disabled && onYearGroupChange(e.target.value || null)}
                        disabled={disabled}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="">Select Year Group</option>
                        {availableYearGroups.map(yg => (
                            <option key={yg} value={yg}>{yg}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* National Curriculum Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        NC Subject
                    </label>
                    <select
                        value={ncSubject?.subject ?? ""}
                        onChange={(e) => {
                            if (!disabled) {
                                const subject = e.target.value;
                                onNCSubjectChange(subject ? { subject, domain: null } : null);
                                // Clear GCSE AOs when subject changes
                                if (onAssessmentObjectivesChange) {
                                    onAssessmentObjectivesChange([]);
                                }
                            }
                        }}
                        disabled={disabled}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="">Select Subject</option>
                        {NC_SUBJECTS.map(s => (
                            <option key={s.subject} value={s.subject}>{s.subject}</option>
                        ))}
                    </select>
                </div>

                {currentSubject?.domains && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">
                            NC Domain (Optional)
                        </label>
                        <select
                            value={ncSubject?.domain ?? ""}
                            onChange={(e) => {
                                if (!disabled && ncSubject) {
                                    onNCSubjectChange({ ...ncSubject, domain: e.target.value || null });
                                }
                            }}
                            disabled={disabled}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                            <option value="">Select Domain</option>
                            {currentSubject.domains.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* GCSE Assessment Objectives (KS4 only) */}
            {showGCSESection && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-[var(--border)] pt-6 mt-6">
                    <GCSEAOSelector
                        ncSubject={ncSubject.subject}
                        examBoard={examBoard ?? null}
                        selectedAOs={assessmentObjectives}
                        onExamBoardChange={onExamBoardChange}
                        onAOsChange={onAssessmentObjectivesChange}
                    />
                </div>
            )}

            {/* Manual Oracy Focus */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Oracy Focus
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">
                        (Optional - describe skills to assess)
                    </span>
                </label>
                <textarea
                    value={oracyFocus}
                    onChange={(e) => !disabled && onOracyFocusChange(e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., Physical (volume and pace). Cognitive (structured reasoning and evidence)."
                    className="w-full h-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    maxLength={500}
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                    Voice21 schools: enter your framework strands here for alignment.
                </p>
            </div>

            {/* Context Type */}
            {onContextTypeChange && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Activity Context
                    </label>
                    <select
                        value={contextType}
                        onChange={(e) => !disabled && onContextTypeChange(e.target.value)}
                        disabled={disabled}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                        <option value="lesson">Lesson Activity</option>
                        <option value="homework">Homework Task</option>
                        <option value="formative">Formative Check-in</option>
                        <option value="summative">Summative Assessment</option>
                        <option value="portfolio">Portfolio Evidence</option>
                    </select>
                </div>
            )}

            {/* Scaffold Level */}
            {onScaffoldLevelChange && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Scaffold Level
                    </label>
                    <div className="flex gap-3">
                        {(["heavy", "light", "none"] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => !disabled && onScaffoldLevelChange(level)}
                                disabled={disabled}
                                className={`
                                flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all
                                ${scaffoldLevel === level
                                        ? "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]"
                                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary-muted)]"
                                    }
                                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                `}
                            >
                                {level === "heavy" && "Heavy (sentence stems)"}
                                {level === "light" && "Light (prompts only)"}
                                {level === "none" && "None (independent)"}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                        {scaffoldLevel === "heavy" && "Provides sentence starters and structured prompts"}
                        {scaffoldLevel === "light" && "Gentle guidance without explicit structures"}
                        {scaffoldLevel === "none" && "Fully independent response"}
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Hook to manage UK oracy wizard state
 */
export function useUKOracyWizardState() {
    const [keyStage, setKeyStage] = useState<KeyStage | null>(null);
    const [yearGroup, setYearGroup] = useState<string | null>(null);
    const [ncSubject, setNCSubject] = useState<{ subject: string; domain: string | null } | null>(null);
    const [oracyFocus, setOracyFocus] = useState("");
    const [examBoard, setExamBoard] = useState<ExamBoard | null>(null);
    const [assessmentObjectives, setAssessmentObjectives] = useState<string[]>([]);
    const [contextType, setContextType] = useState("lesson");
    const [scaffoldLevel, setScaffoldLevel] = useState<"heavy" | "light" | "none">("heavy");

    return {
        keyStage,
        setKeyStage,
        yearGroup,
        setYearGroup,
        ncSubject,
        setNCSubject,
        oracyFocus,
        setOracyFocus,
        examBoard,
        setExamBoard,
        assessmentObjectives,
        setAssessmentObjectives,
        contextType,
        setContextType,
        scaffoldLevel,
        setScaffoldLevel,
        // Serialise for API
        toAPIPayload: () => ({
            key_stage: keyStage,
            year_group: yearGroup ? parseInt(yearGroup.replace("Year ", "")) : null,
            nc_subject: ncSubject,
            oracy_focus: oracyFocus,
            exam_board: examBoard,
            assessment_objectives: assessmentObjectives.length > 0 ? assessmentObjectives : null,
            activity_context: contextType,
            scaffold_level: scaffoldLevel,
            curriculum_region: "UK"
        }),
    };
}
