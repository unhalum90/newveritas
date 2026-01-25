/**
 * Class Insight Summary
 * 
 * Per final_touches.md #3: "Teachers cannot review 20-30 recordings deeply"
 * 
 * Generates "60-second class insight" summaries highlighting:
 * - Common misconceptions detected
 * - Weak strands across cohort  
 * - Exemplary reasoning snippets (quotable examples)
 * - Question-led framing
 */

import { OracyStrand, OracyStrandProfile, SubskillMarker, ORACY_STRANDS } from '../oracy/oracy-strands';
import { DetectedPattern, ExploratoryPatternType } from '../oracy/exploratory-talk-patterns';

/**
 * Class insight summary structure
 */
export interface ClassInsightSummary {
    classId: string;
    assessmentId: string;
    generatedAt: Date;
    studentCount: number;

    // Core insights
    strandSummaries: StrandSummary[];
    weakestStrand: OracyStrand | null;
    strongestStrand: OracyStrand | null;

    // Misconceptions and patterns
    commonMisconceptions: string[];
    exploratoryPatternSummary: string;

    // Exemplary snippets
    exemplarySnippets: ExemplarySnippet[];

    // Question-led framing
    keyQuestions: string[];

    // Quick summary (60-second read)
    quickSummary: string;
}

/**
 * Summary for a single strand across class
 */
export interface StrandSummary {
    strand: OracyStrand;
    label: string;
    color: string;
    averageMarkerCount: number;
    studentsShowingStrength: number;
    studentsNeedingFocus: number;
    topSubskills: string[];
    weakSubskills: string[];
}

/**
 * Exemplary snippet from student responses
 */
export interface ExemplarySnippet {
    studentPseudonym: string;  // e.g., "Student A" - not real name
    strand: OracyStrand;
    subskill: string;
    quote: string;
    whyExemplary: string;
}

/**
 * Input data for generating class summary
 */
export interface ClassInsightInput {
    classId: string;
    assessmentId: string;
    studentProfiles: {
        studentId: string;
        profiles: OracyStrandProfile[];
        exploratoryPatterns: DetectedPattern[];
        transcript?: string;
    }[];
}

/**
 * Generate 60-second class insight summary
 */
export function generateClassInsightSummary(input: ClassInsightInput): ClassInsightSummary {
    const { classId, assessmentId, studentProfiles } = input;
    const studentCount = studentProfiles.length;

    // Aggregate strand data
    const strandSummaries = aggregateStrandSummaries(studentProfiles);

    // Find weakest and strongest strands
    const sortedByStrength = [...strandSummaries].sort(
        (a, b) => b.averageMarkerCount - a.averageMarkerCount
    );
    const strongestStrand = sortedByStrength[0]?.strand || null;
    const weakestStrand = sortedByStrength[sortedByStrength.length - 1]?.strand || null;

    // Aggregate exploratory patterns
    const exploratoryPatternSummary = summariseExploratoryPatterns(studentProfiles);

    // Generate question-led insights
    const keyQuestions = generateKeyQuestions(strandSummaries, weakestStrand);

    // Generate quick summary
    const quickSummary = generateQuickSummary(
        studentCount,
        strandSummaries,
        weakestStrand,
        strongestStrand
    );

    return {
        classId,
        assessmentId,
        generatedAt: new Date(),
        studentCount,
        strandSummaries,
        weakestStrand,
        strongestStrand,
        commonMisconceptions: [],  // To be populated by AI analysis
        exploratoryPatternSummary,
        exemplarySnippets: [],  // To be populated by AI analysis
        keyQuestions,
        quickSummary,
    };
}

/**
 * Aggregate strand summaries across all students
 */
function aggregateStrandSummaries(
    studentProfiles: ClassInsightInput['studentProfiles']
): StrandSummary[] {
    const strands: OracyStrand[] = ['physical', 'linguistic', 'cognitive', 'social'];

    return strands.map(strand => {
        const strandDef = ORACY_STRANDS[strand];

        // Get all profiles for this strand
        const profiles = studentProfiles.flatMap(sp =>
            sp.profiles.filter(p => p.strandType === strand)
        );

        // Count markers
        const markerCounts = profiles.map(p =>
            p.subskillMarkers.filter(m => m.detected).length
        );

        const averageMarkerCount = markerCounts.length > 0
            ? markerCounts.reduce((a, b) => a + b, 0) / markerCounts.length
            : 0;

        // Count students showing strength vs needing focus
        const threshold = 3;  // Minimum markers for "showing strength"
        const studentsShowingStrength = markerCounts.filter(c => c >= threshold).length;
        const studentsNeedingFocus = markerCounts.filter(c => c < threshold).length;

        // Aggregate subskill detection
        const subskillCounts: Record<string, number> = {};
        for (const profile of profiles) {
            for (const marker of profile.subskillMarkers) {
                if (marker.detected) {
                    subskillCounts[marker.subskillId] = (subskillCounts[marker.subskillId] || 0) + 1;
                }
            }
        }

        const sortedSubskills = Object.entries(subskillCounts)
            .sort((a, b) => b[1] - a[1]);

        const topSubskills = sortedSubskills.slice(0, 3).map(([id]) => id);
        const weakSubskills = sortedSubskills.slice(-3).map(([id]) => id);

        return {
            strand,
            label: strandDef.label,
            color: strandDef.color,
            averageMarkerCount,
            studentsShowingStrength,
            studentsNeedingFocus,
            topSubskills,
            weakSubskills,
        };
    });
}

/**
 * Summarise exploratory patterns across class
 */
function summariseExploratoryPatterns(
    studentProfiles: ClassInsightInput['studentProfiles']
): string {
    const patternCounts: Record<ExploratoryPatternType, number> = {
        self_correction: 0,
        tentative_reasoning: 0,
        building_on_previous: 0,
        challenge: 0,
        hesitation_thinking: 0,
        reformulation: 0,
    };

    for (const sp of studentProfiles) {
        for (const pattern of sp.exploratoryPatterns) {
            patternCounts[pattern.type]++;
        }
    }

    const highlights: string[] = [];

    if (patternCounts.self_correction > 0) {
        highlights.push(`${patternCounts.self_correction} instances of self-correction (positive thinking indicator)`);
    }
    if (patternCounts.tentative_reasoning > 0) {
        highlights.push(`${patternCounts.tentative_reasoning} instances of tentative reasoning`);
    }
    if (patternCounts.challenge > 0) {
        highlights.push(`${patternCounts.challenge} challenge patterns detected`);
    }

    return highlights.length > 0
        ? highlights.join('; ')
        : 'Limited exploratory talk patterns detected in this cohort.';
}

/**
 * Generate question-led insights for teacher
 */
function generateKeyQuestions(
    strandSummaries: StrandSummary[],
    weakestStrand: OracyStrand | null
): string[] {
    const questions: string[] = [];

    if (weakestStrand) {
        const weakSummary = strandSummaries.find(s => s.strand === weakestStrand);
        if (weakSummary && weakSummary.weakSubskills.length > 0) {
            questions.push(
                `Which ${weakestStrand} subskills are limiting student explanations?`
            );
        }
    }

    // Find any strands with high "needs focus" count
    const concernStrands = strandSummaries.filter(
        s => s.studentsNeedingFocus > s.studentsShowingStrength
    );

    for (const strand of concernStrands.slice(0, 2)) {
        questions.push(
            `What support would help the ${strand.studentsNeedingFocus} students struggling with ${strand.label.toLowerCase()}?`
        );
    }

    // Add vocabulary-specific question if linguistic is weak
    const linguistic = strandSummaries.find(s => s.strand === 'linguistic');
    if (linguistic && linguistic.studentsNeedingFocus > studentCount(strandSummaries) * 0.4) {
        questions.push('Where did vocabulary usage break down?');
    }

    return questions.length > 0
        ? questions
        : ['What patterns do you observe in student responses?'];
}

/**
 * Helper to get total student count
 */
function studentCount(summaries: StrandSummary[]): number {
    if (summaries.length === 0) return 0;
    return summaries[0].studentsShowingStrength + summaries[0].studentsNeedingFocus;
}

/**
 * Generate quick summary (60-second read)
 */
function generateQuickSummary(
    studentCount: number,
    strandSummaries: StrandSummary[],
    weakestStrand: OracyStrand | null,
    strongestStrand: OracyStrand | null
): string {
    const parts: string[] = [];

    parts.push(`${studentCount} students assessed.`);

    if (strongestStrand) {
        const strong = strandSummaries.find(s => s.strand === strongestStrand);
        if (strong) {
            parts.push(
                `Strongest: ${strong.label} (${strong.studentsShowingStrength} students).`
            );
        }
    }

    if (weakestStrand) {
        const weak = strandSummaries.find(s => s.strand === weakestStrand);
        if (weak && weak.studentsNeedingFocus > 0) {
            parts.push(
                `Focus area: ${weak.label} (${weak.studentsNeedingFocus} students need support).`
            );
        }
    }

    return parts.join(' ');
}

/**
 * Format summary for display (3 bullet points max per PRD)
 */
export function formatForQuickView(summary: ClassInsightSummary): string[] {
    const bullets: string[] = [];

    // Bullet 1: Overall picture
    bullets.push(summary.quickSummary);

    // Bullet 2: Key question
    if (summary.keyQuestions.length > 0) {
        bullets.push(`Key question: ${summary.keyQuestions[0]}`);
    }

    // Bullet 3: Exploratory patterns
    if (summary.exploratoryPatternSummary) {
        bullets.push(summary.exploratoryPatternSummary);
    }

    return bullets.slice(0, 3);  // Max 3 bullets
}
