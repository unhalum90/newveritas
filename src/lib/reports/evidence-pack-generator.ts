/**
 * Evidence Pack Generator
 * 
 * Per oracy_UK_build.md Section 5 and benchmarks.md Section 4.D:
 * Generates editable evidence packs for SLT/Governors that are:
 * - One-click generation
 * - Fully editable (no locked AI conclusions)
 * - Inspection-ready exports (PDF/CSV)
 * 
 * CRITICAL: All packs include explicit disclaimer that interpretation
 * remains the responsibility of the school.
 */

import { OracyStrand, ORACY_STRANDS } from '../oracy/oracy-strands';
import { CONTEXT_DISCLAIMERS } from '../config/trust-disclaimers';
import { KeyStage, KEY_STAGES } from '../config/uk-config';
import { UK_REPORT_CONFIG } from './uk-report-defaults';

/**
 * Evidence pack structure
 */
export interface EvidencePack {
    id: string;
    schoolId: string;
    generatedAt: Date;
    generatedBy: string;  // Teacher/admin ID

    // Metadata
    title: string;
    academicYear: string;
    keyStage?: KeyStage;
    cohortDescription?: string;

    // Content sections (all editable)
    sections: EvidencePackSection[];

    // Mandatory disclaimer
    disclaimer: string;

    // Export settings
    watermark: string;
}

/**
 * Section within evidence pack
 */
export interface EvidencePackSection {
    id: string;
    title: string;
    type: 'narrative' | 'data' | 'quotes' | 'progression';
    content: string;  // Editable markdown
    isEdited: boolean;
    charts?: ChartData[];
}

/**
 * Chart data for visualisations
 */
export interface ChartData {
    type: 'strand_distribution' | 'progression_over_time' | 'cohort_comparison';
    title: string;
    data: Record<string, number | string>[];
}

/**
 * Input for generating evidence pack
 */
export interface EvidencePackInput {
    schoolId: string;
    teacherId: string;
    academicYear: string;
    keyStage?: KeyStage;
    classIds?: string[];
    dateRange?: { from: Date; to: Date };
}

/**
 * Generate evidence pack
 */
export function generateEvidencePack(input: EvidencePackInput): EvidencePack {
    const { schoolId, teacherId, academicYear, keyStage } = input;

    const sections: EvidencePackSection[] = [
        generateOverviewSection(input),
        generateStrandProfileSection(input),
        generateProgressionSection(input),
        generateExemplarSection(input),
        generateNextStepsSection(input),
    ];

    return {
        id: `ep_${Date.now()}`,
        schoolId,
        generatedAt: new Date(),
        generatedBy: teacherId,
        title: `Oracy Evidence Pack - ${academicYear}${keyStage ? ` - ${KEY_STAGES[keyStage].label}` : ''}`,
        academicYear,
        keyStage,
        sections,
        disclaimer: UK_REPORT_CONFIG.aiDisclaimer || CONTEXT_DISCLAIMERS.evidence_pack,
        watermark: UK_REPORT_CONFIG.frameworkCitation,
    };
}

/**
 * Generate overview section
 */
function generateOverviewSection(input: EvidencePackInput): EvidencePackSection {
    const keyStageLabel = input.keyStage ? KEY_STAGES[input.keyStage].label : 'All Key Stages';

    return {
        id: 'overview',
        title: 'Overview',
        type: 'narrative',
        content: `## Oracy Overview - ${input.academicYear}

This evidence pack summarises oracy development across ${keyStageLabel} for the academic year ${input.academicYear}.

### Context
[Edit this section to add school-specific context]

### Intent
[Describe your school's oracy vision and how this evidence demonstrates intent]

### Implementation
[Summarise how oracy is embedded in curriculum and teaching]

### Impact
[This section will be populated with strand data below]

---
*This overview is fully editable. Interpretation and judgement remain the responsibility of the school.*`,
        isEdited: false,
    };
}

/**
 * Generate strand profile section
 */
function generateStrandProfileSection(input: EvidencePackInput): EvidencePackSection {
    // This would be populated with actual data in production
    const strandSummary = Object.values(ORACY_STRANDS)
        .map(strand => `- **${strand.label}**: [Data to be populated]`)
        .join('\n');

    return {
        id: 'strand_profiles',
        title: 'Strand Profiles',
        type: 'data',
        content: `## Strand Profile Summary

Evidence of oracy development across the four strands:

${strandSummary}

### Key Observations
[Add your professional observations about strand patterns]

### Areas of Strength
[Identify strands where students are showing secure development]

### Focus Areas
[Identify strands requiring additional curriculum attention]

---
*Strand markers indicate observed patterns. They do not represent grades or quality judgements.*`,
        isEdited: false,
        charts: [
            {
                type: 'strand_distribution',
                title: 'Strand Distribution Across Cohort',
                data: [],  // To be populated
            },
        ],
    };
}

/**
 * Generate progression section
 */
function generateProgressionSection(input: EvidencePackInput): EvidencePackSection {
    return {
        id: 'progression',
        title: 'Progression Over Time',
        type: 'progression',
        content: `## Longitudinal Progression

### Baseline to Current
[This section shows progression from baseline assessments to current performance]

### Year-on-Year Comparison
[If prior year data available, compare cohort trajectories]

### Individual Progress Stories
[Select 2-3 anonymised examples showing significant progression]

**Note**: Progression data shows changes in observed markers over time. This data supports but does not replace teacher assessment of student learning.`,
        isEdited: false,
        charts: [
            {
                type: 'progression_over_time',
                title: 'Strand Progression Over Academic Year',
                data: [],  // To be populated
            },
        ],
    };
}

/**
 * Generate exemplar section
 */
function generateExemplarSection(input: EvidencePackInput): EvidencePackSection {
    return {
        id: 'exemplars',
        title: 'Exemplary Responses',
        type: 'quotes',
        content: `## Exemplary Student Responses

The following anonymised quotes demonstrate strong oracy skills:

### Cognitive Strand - Reasoning
> "[Student quote demonstrating reasoning]"
> — Year X Student (anonymised)

**Why this is exemplary**: [Teacher annotation]

### Linguistic Strand - Vocabulary
> "[Student quote demonstrating vocabulary]"
> — Year X Student (anonymised)

**Why this is exemplary**: [Teacher annotation]

### Physical Strand - Delivery
> "[Description of delivery or link to recording]"
> — Year X Student (anonymised)

**Why this is exemplary**: [Teacher annotation]

---
*Add or edit exemplars as appropriate. All student responses are anonymised.*`,
        isEdited: false,
    };
}

/**
 * Generate next steps section
 */
function generateNextStepsSection(input: EvidencePackInput): EvidencePackSection {
    return {
        id: 'next_steps',
        title: 'Next Steps',
        type: 'narrative',
        content: `## Next Steps for Oracy Development

Based on the evidence in this pack, the following priorities are identified:

### Curriculum Actions
1. [Action 1]
2. [Action 2]
3. [Action 3]

### CPD Priorities
- [Staff development need]

### Resource Requirements
- [Any additional resources needed]

### Review Timeline
- Next evidence pack: [Date]
- Mid-year review: [Date]
- Annual review: [Date]

---
*Next steps are entirely for school determination and professional planning.*`,
        isEdited: false,
    };
}

/**
 * Export evidence pack to markdown (for PDF conversion)
 */
export function exportToMarkdown(pack: EvidencePack): string {
    const parts: string[] = [];

    // Title
    parts.push(`# ${pack.title}`);
    parts.push(`Generated: ${pack.generatedAt.toLocaleDateString('en-GB')}`);
    parts.push('');

    // Disclaimer (prominent)
    parts.push('> **Important Disclaimer**');
    parts.push(`> ${pack.disclaimer}`);
    parts.push('');

    // Sections
    for (const section of pack.sections) {
        parts.push(section.content);
        parts.push('');
    }

    // Footer with watermark
    parts.push('---');
    parts.push(`*${pack.watermark}*`);

    return parts.join('\n');
}

/**
 * Check if pack has been edited
 */
export function hasBeenEdited(pack: EvidencePack): boolean {
    return pack.sections.some(s => s.isEdited);
}
