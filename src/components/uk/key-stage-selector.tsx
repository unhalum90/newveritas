"use client";

import { KeyStage, KEY_STAGES, KeyStageInfo } from "@/lib/config/uk-config";

interface KeyStageSelectorProps {
    value: KeyStage | null;
    onChange: (keyStage: KeyStage | null) => void;
    label?: string;
    showYearRange?: boolean;
    className?: string;
}

/**
 * Key Stage Selector Component
 * 
 * UK-specific selector for Key Stages (KS1-KS5).
 * Replaces US grade level selector for UK locale.
 */
export function KeyStageSelector({
    value,
    onChange,
    label = "Key Stage",
    showYearRange = true,
    className = "",
}: KeyStageSelectorProps) {
    const keyStageEntries = Object.entries(KEY_STAGES) as [KeyStage, KeyStageInfo][];

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {label}
                </label>
            )}
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value as KeyStage || null)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
                <option value="">Select Key Stage</option>
                {keyStageEntries.map(([key, info]) => (
                    <option key={key} value={key}>
                        {info.label} {showYearRange && `(${info.years})`}
                    </option>
                ))}
            </select>
            {value && showYearRange && (
                <p className="text-xs text-[var(--text-tertiary)]">
                    Age range: {KEY_STAGES[value].ageRange} years
                </p>
            )}
        </div>
    );
}

/**
 * Key Stage Badge Component
 * 
 * Display badge showing the current Key Stage.
 */
interface KeyStageBadgeProps {
    keyStage: KeyStage;
    size?: "sm" | "md" | "lg";
}

export function KeyStageBadge({ keyStage, size = "md" }: KeyStageBadgeProps) {
    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] ${sizeClasses[size]}`}
        >
            {keyStage}
        </span>
    );
}

/**
 * Key Stage Card Selector
 * 
 * Visual card-based selector for Key Stages.
 */
interface KeyStageCardSelectorProps {
    value: KeyStage | null;
    onChange: (keyStage: KeyStage) => void;
    className?: string;
}

export function KeyStageCardSelector({
    value,
    onChange,
    className = "",
}: KeyStageCardSelectorProps) {
    const keyStageEntries = Object.entries(KEY_STAGES) as [KeyStage, KeyStageInfo][];

    return (
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${className}`}>
            {keyStageEntries.map(([key, info]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`
            p-4 rounded-xl border-2 transition-all text-left
            ${value === key
                            ? "border-[var(--primary)] bg-[var(--primary-subtle)] ring-2 ring-[var(--primary)] ring-opacity-20"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-muted)]"
                        }
          `}
                >
                    <div className="font-bold text-lg text-[var(--text)]">{key}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{info.years}</div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1">Ages {info.ageRange}</div>
                </button>
            ))}
        </div>
    );
}
