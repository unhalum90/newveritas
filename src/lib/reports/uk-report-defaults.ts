
/**
 * UK Reporting Configuration
 * 
 * Defines specific behaviors for UK report generation.
 * Per dev_team_final_alignment.md: "Reports defaults to editable narrative format"
 */

export const UK_REPORT_CONFIG = {
    // Default to narrative format instead of score-cards
    defaultFormat: 'narrative' as const,

    // Disclaimer required on all AI-generated reports in UK
    aiDisclaimer: `This report was assisted by AI analysis of student oracy. It is intended to support, not replace, teacher judgement. All evidence should be verified against classroom observation.`,

    // Voice 21 alignment note
    frameworkCitation: `Assessed against the Voice 21 Oracy Framework (UK Edition).`,

    // Terminology overrides for Report UI
    labels: {
        scoreSummary: "Progression Indicators",
        strengths: "Observed Strengths",
        improvements: "Areas for Development",
        transcript: "Evidence Transcript",
    },

    // Evidence Pack Settings
    evidencePack: {
        includeAudioLinks: true,
        includeRubricDefinitions: true,
        includeStrandBreakdown: true,
    }
};

/**
 * Get report footer for UK context
 */
export function getUKReportFooter(schoolName?: string) {
    const year = new Date().getFullYear();
    return `${schoolName || 'Veritas AI'} | Oracy Evidence Record ${year} | ${UK_REPORT_CONFIG.frameworkCitation}`;
}
