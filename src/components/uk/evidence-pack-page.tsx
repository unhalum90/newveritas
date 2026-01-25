"use client";

import { useState } from "react";
import {
    EvidencePack,
    EvidencePackSection,
    generateEvidencePack,
    exportToMarkdown
} from "@/lib/reports/evidence-pack-generator";
import { CONTEXT_DISCLAIMERS } from "@/lib/config/trust-disclaimers";
import { KeyStage, KEY_STAGES } from "@/lib/config/uk-config";

interface EvidencePackPageProps {
    schoolId: string;
    teacherId: string;
    academicYear?: string;
    keyStage?: KeyStage;
}

/**
 * Evidence Pack Page
 * 
 * One-click generation of inspection-ready evidence packs.
 * Per oracy_UK_build.md Section 5: Editable, exportable evidence.
 */
export function EvidencePackPage({
    schoolId,
    teacherId,
    academicYear = "2025-26",
    keyStage,
}: EvidencePackPageProps) {
    const [pack, setPack] = useState<EvidencePack | null>(null);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        // Generate pack
        const newPack = generateEvidencePack({
            schoolId,
            teacherId,
            academicYear,
            keyStage,
        });

        setPack(newPack);
        setIsGenerating(false);
    };

    const handleEditSection = (section: EvidencePackSection) => {
        setEditingSectionId(section.id);
        setEditedContent(section.content);
    };

    const handleSaveSection = () => {
        if (!pack || !editingSectionId) return;

        const updatedSections = pack.sections.map(s =>
            s.id === editingSectionId
                ? { ...s, content: editedContent, isEdited: true }
                : s
        );

        setPack({ ...pack, sections: updatedSections });
        setEditingSectionId(null);
        setEditedContent("");
    };

    const handleExportMarkdown = () => {
        if (!pack) return;

        const markdown = exportToMarkdown(pack);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `evidence-pack-${pack.academicYear}.md`;
        a.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text)]">
                    Oracy Evidence Pack
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                    Generate inspection-ready evidence for school self-evaluation
                </p>
            </div>

            {/* Disclaimer Banner */}
            <div className="p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                            Important Notice
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {CONTEXT_DISCLAIMERS.evidence_pack}
                        </p>
                    </div>
                </div>
            </div>

            {!pack ? (
                /* Generation Form */
                <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
                        Generate Evidence Pack
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                Academic Year
                            </label>
                            <input
                                type="text"
                                value={academicYear}
                                disabled
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                Key Stage
                            </label>
                            <select
                                value={keyStage ?? ""}
                                disabled
                                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)]"
                            >
                                <option value="">All Key Stages</option>
                                {Object.entries(KEY_STAGES).map(([key, info]) => (
                                    <option key={key} value={key}>{info.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? "Generating..." : "Generate Evidence Pack"}
                    </button>
                </div>
            ) : (
                /* Pack Display */
                <div className="space-y-6">
                    {/* Pack Header */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-elevated)]">
                        <div>
                            <h2 className="font-semibold text-[var(--text)]">{pack.title}</h2>
                            <p className="text-sm text-[var(--text-tertiary)]">
                                Generated: {pack.generatedAt.toLocaleDateString('en-GB')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportMarkdown}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors"
                            >
                                Export Markdown
                            </button>
                            <button
                                onClick={() => setPack(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>

                    {/* Sections */}
                    {pack.sections.map(section => (
                        <div
                            key={section.id}
                            className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-[var(--text)]">{section.title}</h3>
                                <div className="flex items-center gap-2">
                                    {section.isEdited && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Edited
                                        </span>
                                    )}
                                    {editingSectionId === section.id ? (
                                        <>
                                            <button
                                                onClick={handleSaveSection}
                                                className="px-3 py-1 rounded text-sm font-medium text-white bg-[var(--primary)]"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingSectionId(null)}
                                                className="px-3 py-1 rounded text-sm font-medium text-[var(--text-tertiary)]"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleEditSection(section)}
                                            className="px-3 py-1 rounded text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-subtle)]"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {editingSectionId === section.id ? (
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full h-64 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)] font-mono text-sm"
                                />
                            ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-[var(--text-secondary)]">
                                        {section.content}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Watermark */}
                    <div className="text-center text-xs text-[var(--text-tertiary)] py-4">
                        {pack.watermark}
                    </div>
                </div>
            )}
        </div>
    );
}
