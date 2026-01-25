/**
 * UK Scoring Prompts
 * 
 * Per oracy_UK_build.md and final_touches.md:
 * - No scores, only strand-based markers
 * - Process over correctness (tolerate fillers, self-correction)
 * - EAL-aware analysis
 * 
 * These prompts replace the "strict grader" approach for UK locale.
 */

import { OracyStrand, ORACY_STRANDS, getAllSubskills } from '@/lib/oracy/oracy-strands';
import { EXPLORATORY_PATTERNS } from '@/lib/oracy/exploratory-talk-patterns';

/**
 * Build subskill list for prompt
 */
function buildSubskillList(): string {
    const subskills = getAllSubskills();
    const byStrand = subskills.reduce((acc, s) => {
        acc[s.strand] = acc[s.strand] || [];
        acc[s.strand].push(`- ${s.id}: ${s.label}`);
        return acc;
    }, {} as Record<OracyStrand, string[]>);

    return Object.entries(byStrand)
        .map(([strand, items]) => `${ORACY_STRANDS[strand as OracyStrand].label}:\n${items.join('\n')}`)
        .join('\n\n');
}

/**
 * Build exploratory pattern markers for prompt
 */
function buildExploratoryPatternList(): string {
    return Object.values(EXPLORATORY_PATTERNS)
        .map(p => `- ${p.type}: "${p.detectionMarkers.slice(0, 3).join('", "')}"`)
        .join('\n');
}

/**
 * UK Oracy Analysis System Prompt
 * 
 * Replaces "strict grader" with "evidence curator" approach.
 */
export const UK_ORACY_SYSTEM_PROMPT = `You are an oracy evidence curator for UK schools. Your role is to observe and document oracy markers - NOT to grade or judge.

CRITICAL RULES:
1. DO NOT assign scores or grades
2. DO NOT use words like "score", "grade", "accuracy", "pass", "fail"
3. DO prioritise PROCESS over correctness - exploratory talk is POSITIVE
4. DO tolerate and CELEBRATE: fillers (um, er), self-correction, pauses, hesitation
5. DO separate reasoning quality from language proficiency (EAL awareness)

Return ONLY JSON matching this exact structure:
{
  "transcript": "verbatim transcription",
  "strand_markers": {
    "physical": { "detected": ["subskill_id"], "evidence": {"subskill_id": "quote"} },
    "linguistic": { "detected": ["subskill_id"], "evidence": {"subskill_id": "quote"} },
    "cognitive": { "detected": ["subskill_id"], "evidence": {"subskill_id": "quote"} },
    "social": { "detected": ["subskill_id"], "evidence": {"subskill_id": "quote"} }
  },
  "exploratory_patterns": [
    { "type": "self_correction|tentative_reasoning|building_on_previous|challenge", "evidence": "quote" }
  ],
  "process_observations": "Description of thinking process observed",
  "eal_note": "Only if relevant: language separate from reasoning quality"
}

SUBSKILL REFERENCE:
${buildSubskillList()}

EXPLORATORY PATTERNS TO DETECT (these are POSITIVE indicators):
${buildExploratoryPatternList()}
`;

/**
 * UK Oracy Analysis User Prompt Template
 */
export function buildUKOracyUserPrompt(params: {
    questionText: string;
    transcript: string;
    selectedStrands?: OracyStrand[];
    contextType?: string;
}): string {
    const { questionText, transcript, selectedStrands, contextType } = params;

    const strandFocus = selectedStrands && selectedStrands.length > 0
        ? `Focus particularly on these strands: ${selectedStrands.map(s => ORACY_STRANDS[s].label).join(', ')}`
        : 'Analyse all four oracy strands.';

    const context = contextType
        ? `Context: This is a ${contextType} activity.`
        : '';

    return `Analyse this student's spoken response for oracy markers.

Question/prompt:
${questionText}

${context}

Student's response:
${transcript}

${strandFocus}

REMEMBER:
- Detect markers, don't grade
- Self-correction and hesitation are POSITIVE thinking indicators
- Quote specific evidence for each marker detected
- Note any exploratory talk patterns (tentative reasoning, building on ideas, challenge)
- If this appears to be an EAL student, note reasoning quality separately from language proficiency`;
}

/**
 * Parse UK oracy analysis response
 */
export interface UKOracyAnalysisResult {
    transcript: string;
    strandMarkers: {
        physical: { detected: string[]; evidence: Record<string, string> };
        linguistic: { detected: string[]; evidence: Record<string, string> };
        cognitive: { detected: string[]; evidence: Record<string, string> };
        social: { detected: string[]; evidence: Record<string, string> };
    };
    exploratoryPatterns: Array<{ type: string; evidence: string }>;
    processObservations: string;
    ealNote?: string;
}

export function parseUKOracyResponse(data: unknown): UKOracyAnalysisResult | null {
    const obj = data as {
        transcript?: string;
        strand_markers?: {
            physical?: { detected?: string[]; evidence?: Record<string, string> };
            linguistic?: { detected?: string[]; evidence?: Record<string, string> };
            cognitive?: { detected?: string[]; evidence?: Record<string, string> };
            social?: { detected?: string[]; evidence?: Record<string, string> };
        };
        exploratory_patterns?: Array<{ type?: string; evidence?: string }>;
        process_observations?: string;
        eal_note?: string;
    } | null;

    if (!obj || typeof obj.transcript !== 'string') return null;

    const defaultStrand = { detected: [], evidence: {} };

    return {
        transcript: obj.transcript,
        strandMarkers: {
            physical: {
                detected: obj.strand_markers?.physical?.detected ?? [],
                evidence: obj.strand_markers?.physical?.evidence ?? {},
            },
            linguistic: {
                detected: obj.strand_markers?.linguistic?.detected ?? [],
                evidence: obj.strand_markers?.linguistic?.evidence ?? {},
            },
            cognitive: {
                detected: obj.strand_markers?.cognitive?.detected ?? [],
                evidence: obj.strand_markers?.cognitive?.evidence ?? {},
            },
            social: {
                detected: obj.strand_markers?.social?.detected ?? [],
                evidence: obj.strand_markers?.social?.evidence ?? {},
            },
        },
        exploratoryPatterns: (obj.exploratory_patterns ?? [])
            .filter(p => p.type && p.evidence)
            .map(p => ({ type: p.type!, evidence: p.evidence! })),
        processObservations: obj.process_observations ?? '',
        ealNote: obj.eal_note,
    };
}

/**
 * Count total markers detected across all strands
 */
export function countTotalMarkers(result: UKOracyAnalysisResult): number {
    return (
        result.strandMarkers.physical.detected.length +
        result.strandMarkers.linguistic.detected.length +
        result.strandMarkers.cognitive.detected.length +
        result.strandMarkers.social.detected.length
    );
}
