"use client";

import { useState } from "react";
import { useUKLocale } from "@/hooks/use-uk-locale";
import { KeyStageCardSelector } from "@/components/uk/key-stage-selector";
import { OracyStrandSelector } from "@/components/uk/oracy-strand-selector";
import { KeyStage } from "@/lib/config/uk-config";
import { OracyStrand } from "@/lib/oracy/oracy-strands";

interface UKOracyWizardSectionProps {
    keyStage: KeyStage | null;
    onKeyStageChange: (ks: KeyStage | null) => void;
    selectedStrands: OracyStrand[];
    onStrandsChange: (strands: OracyStrand[]) => void;
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
 * Add this to the assessment wizard Step 2 (General Info) for UK users.
 */
export function UKOracyWizardSection({
    keyStage,
    onKeyStageChange,
    selectedStrands,
    onStrandsChange,
    contextType = "lesson",
    onContextTypeChange,
    scaffoldLevel = "heavy",
    onScaffoldLevelChange,
    disabled = false,
}: UKOracyWizardSectionProps) {
    const { isUK } = useUKLocale();

    // Don't render if not UK locale
    if (!isUK) return null;

    return (
        <div className="space-y-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-2 mb-4">
                <span
                    className="w-2 h-2 rounded-full bg-blue-500"
                    aria-hidden="true"
                />
                <h3 className="font-semibold text-[var(--text)]">UK Oracy Settings</h3>
            </div>

            {/* Key Stage Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Key Stage
                </label>
                <KeyStageCardSelector
                    value={keyStage}
                    onChange={(ks) => !disabled && onKeyStageChange(ks)}
                    className={disabled ? "opacity-50 pointer-events-none" : ""}
                />
            </div>

            {/* Oracy Strand Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Oracy Focus Strands
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">
                        (Select 1-4 strands to assess)
                    </span>
                </label>
                <OracyStrandSelector
                    value={selectedStrands}
                    onChange={(strands) => !disabled && onStrandsChange(strands)}
                    maxSelection={4}
                    showSubskills={true}
                    className={disabled ? "opacity-50 pointer-events-none" : ""}
                />
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
                        <option value="discussion">Class Discussion</option>
                        <option value="presentation">Individual Presentation</option>
                        <option value="group_talk">Group Talk</option>
                        <option value="debate">Debate</option>
                        <option value="interview">Interview/Role-play</option>
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
                        {scaffoldLevel === "light" && "Provides guiding questions without sentence stems"}
                        {scaffoldLevel === "none" && "Student speaks independently without scaffolding"}
                    </p>
                </div>
            )}

            {/* Trust Banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
                <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                <p className="text-blue-700 dark:text-blue-300">
                    This assessment uses the Voice 21 Oracy Framework for evidence capture, not grading.
                    AI will detect strand markers, not assign scores.
                </p>
            </div>
        </div>
    );
}

/**
 * Hook to manage UK oracy wizard state
 */
export function useUKOracyWizardState() {
    const [keyStage, setKeyStage] = useState<KeyStage | null>(null);
    const [selectedStrands, setSelectedStrands] = useState<OracyStrand[]>([]);
    const [contextType, setContextType] = useState("lesson");
    const [scaffoldLevel, setScaffoldLevel] = useState<"heavy" | "light" | "none">("heavy");

    return {
        keyStage,
        setKeyStage,
        selectedStrands,
        setSelectedStrands,
        contextType,
        setContextType,
        scaffoldLevel,
        setScaffoldLevel,
        // Serialise for API
        toAPIPayload: () => ({
            uk_locale_config: {
                key_stage: keyStage,
                context_type: contextType,
            },
            oracy_strands: selectedStrands,
            scaffold_level: scaffoldLevel,
        }),
    };
}
