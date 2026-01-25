"use client";

import { useState } from "react";
import {
    OracyStrand,
    ORACY_STRANDS,
    getSubskillsForStrand
} from "@/lib/oracy/oracy-strands";

interface OracyStrandSelectorProps {
    value: OracyStrand[];
    onChange: (strands: OracyStrand[]) => void;
    maxSelection?: number;
    showSubskills?: boolean;
    className?: string;
}

/**
 * Oracy Strand Selector
 * 
 * Multi-select component for Voice 21 Framework strands.
 * Used in assessment creation for UK locale.
 */
export function OracyStrandSelector({
    value,
    onChange,
    maxSelection,
    showSubskills = false,
    className = "",
}: OracyStrandSelectorProps) {
    const [expandedStrand, setExpandedStrand] = useState<OracyStrand | null>(null);

    const strands = Object.entries(ORACY_STRANDS) as [OracyStrand, typeof ORACY_STRANDS[OracyStrand]][];

    const toggleStrand = (strand: OracyStrand) => {
        if (value.includes(strand)) {
            onChange(value.filter(s => s !== strand));
        } else {
            if (maxSelection && value.length >= maxSelection) {
                // Replace oldest selection
                onChange([...value.slice(1), strand]);
            } else {
                onChange([...value, strand]);
            }
        }
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {strands.map(([key, strand]) => {
                    const isSelected = value.includes(key);

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => toggleStrand(key)}
                            onDoubleClick={() => showSubskills && setExpandedStrand(expandedStrand === key ? null : key)}
                            className={`
                p-4 rounded-xl border-2 transition-all text-left relative
                ${isSelected
                                    ? "border-2 ring-2 ring-opacity-20"
                                    : "border-[var(--border)] bg-[var(--surface)] hover:border-opacity-50"
                                }
              `}
                            style={{
                                borderColor: isSelected ? strand.color : undefined,
                                backgroundColor: isSelected ? `${strand.color}10` : undefined,
                                boxShadow: isSelected ? `0 0 0 3px ${strand.color}20` : undefined,
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-full mb-2"
                                style={{ backgroundColor: strand.color }}
                            />
                            <div className="font-semibold text-[var(--text)]">{strand.label}</div>
                            <div className="text-xs text-[var(--text-tertiary)] mt-1">
                                {strand.description}
                            </div>
                            {isSelected && (
                                <div
                                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: strand.color }}
                                >
                                    ✓
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {showSubskills && expandedStrand && (
                <div className="p-4 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <h4 className="font-medium text-[var(--text)] mb-3">
                        {ORACY_STRANDS[expandedStrand].label} Subskills
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {getSubskillsForStrand(expandedStrand).map(subskill => (
                            <div
                                key={subskill.id}
                                className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)]"
                            >
                                <div className="text-sm font-medium text-[var(--text)]">
                                    {subskill.label}
                                </div>
                                <div className="text-xs text-[var(--text-tertiary)]">
                                    {subskill.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map(strandKey => (
                        <span
                            key={strandKey}
                            className="px-2 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: ORACY_STRANDS[strandKey].color }}
                        >
                            {ORACY_STRANDS[strandKey].label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Oracy Strand Badge
 */
interface OracyStrandBadgeProps {
    strand: OracyStrand;
    size?: "sm" | "md" | "lg";
}

export function OracyStrandBadge({ strand, size = "md" }: OracyStrandBadgeProps) {
    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full text-white ${sizeClasses[size]}`}
            style={{ backgroundColor: ORACY_STRANDS[strand].color }}
        >
            <span
                className="w-2 h-2 rounded-full bg-white bg-opacity-30"
            />
            {ORACY_STRANDS[strand].label}
        </span>
    );
}

/**
 * Strand Profile Display
 * 
 * Shows strand markers for a student's assessment.
 */
interface StrandProfileDisplayProps {
    strands: OracyStrand[];
    markerCounts?: Record<OracyStrand, number>;
    className?: string;
}

export function StrandProfileDisplay({
    strands,
    markerCounts,
    className = "",
}: StrandProfileDisplayProps) {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {strands.map(strand => (
                <div
                    key={strand}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                        borderColor: ORACY_STRANDS[strand].color,
                        backgroundColor: `${ORACY_STRANDS[strand].color}10`,
                    }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ORACY_STRANDS[strand].color }}
                    />
                    <span className="text-sm font-medium text-[var(--text)]">
                        {ORACY_STRANDS[strand].label}
                    </span>
                    {markerCounts && (
                        <span
                            className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: ORACY_STRANDS[strand].color }}
                        >
                            {markerCounts[strand]} markers
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
