/**
 * Oracy Strands - Voice 21 Framework Aligned
 * 
 * Implements the four canonical oracy strands with 13+ subskills.
 * Per benchmarks.md: Framework alignment is non-optional.
 * 
 * Attribution: Aligned to the Voice 21 Oracy Framework (Cambridge Oracy / Voice 21, 2019)
 */

/**
 * The four canonical oracy strands
 */
export type OracyStrand = 'physical' | 'linguistic' | 'cognitive' | 'social';

/**
 * Subskill categories within each strand
 */
export type PhysicalSubskillCategory = 'voice' | 'body_language';
export type LinguisticSubskillCategory = 'vocabulary' | 'language' | 'rhetorical_techniques';
export type CognitiveSubskillCategory = 'content' | 'structure' | 'clarifying' | 'self_regulation' | 'reasoning';
export type SocialSubskillCategory = 'working_with_others' | 'listening_responding' | 'confidence' | 'audience_awareness';

/**
 * Physical strand subskills
 */
export const PHYSICAL_SUBSKILLS = {
    voice: [
        { id: 'pace_of_speech', label: 'Pace of speech', description: 'Speed and rhythm of spoken delivery' },
        { id: 'tonal_variation', label: 'Tonal variation', description: 'Use of pitch and emphasis' },
        { id: 'clarity_of_pronunciation', label: 'Clarity of pronunciation', description: 'Articulation and enunciation' },
        { id: 'voice_projection', label: 'Voice projection', description: 'Volume appropriate to context' },
    ],
    body_language: [
        { id: 'gesture_posture', label: 'Gesture & posture', description: 'Physical stance and hand movements' },
        { id: 'facial_expression_eye_contact', label: 'Facial expression & eye contact', description: 'Non-verbal communication' },
    ],
} as const;

/**
 * Linguistic strand subskills
 */
export const LINGUISTIC_SUBSKILLS = {
    vocabulary: [
        { id: 'appropriate_vocabulary', label: 'Appropriate vocabulary choice', description: 'Selection of words suited to context' },
        { id: 'tier2_vocabulary', label: 'Tier 2 (academic) vocabulary', description: 'Cross-curricular academic language' },
        { id: 'tier3_vocabulary', label: 'Tier 3 (subject-specific) vocabulary', description: 'Domain-specific terminology' },
    ],
    language: [
        { id: 'register', label: 'Register', description: 'Formality level appropriate to audience' },
        { id: 'grammar', label: 'Grammar', description: 'Correct sentence construction' },
    ],
    rhetorical_techniques: [
        { id: 'metaphor', label: 'Metaphor', description: 'Figurative language use' },
        { id: 'humour_irony_mimicry', label: 'Humour, irony & mimicry', description: 'Playful or persuasive techniques' },
    ],
} as const;

/**
 * Cognitive strand subskills
 */
export const COGNITIVE_SUBSKILLS = {
    content: [
        { id: 'content_choice', label: 'Choice of content to convey meaning', description: 'Selection of relevant information' },
        { id: 'building_on_others', label: 'Building on views of others', description: 'Responding to and extending ideas' },
    ],
    structure: [
        { id: 'organisation_of_talk', label: 'Structure & organisation of talk', description: 'Logical sequencing of ideas' },
    ],
    clarifying: [
        { id: 'seeking_clarification', label: 'Seeking clarification through questioning', description: 'Asking to understand better' },
        { id: 'summarising', label: 'Summarising', description: 'Condensing key points' },
    ],
    self_regulation: [
        { id: 'maintaining_focus', label: 'Maintaining focus on task', description: 'Staying on topic' },
        { id: 'time_management', label: 'Time management', description: 'Appropriate pacing of response' },
    ],
    reasoning: [
        { id: 'giving_reasons', label: 'Giving reasons to support views', description: 'Justifying positions with evidence' },
        { id: 'critically_examining', label: 'Critically examining ideas & views', description: 'Evaluating and questioning' },
    ],
} as const;

/**
 * Social & Emotional strand subskills
 */
export const SOCIAL_SUBSKILLS = {
    working_with_others: [
        { id: 'guiding_interactions', label: 'Guiding or managing interactions', description: 'Facilitating group discussion' },
        { id: 'turn_taking', label: 'Turn-taking', description: 'Appropriate conversational flow' },
    ],
    listening_responding: [
        { id: 'listening_actively', label: 'Listening actively', description: 'Attentive and engaged listening' },
        { id: 'responding_appropriately', label: 'Responding appropriately', description: 'Relevant and respectful responses' },
    ],
    confidence: [
        { id: 'self_assurance', label: 'Self-assurance', description: 'Confidence in speaking' },
        { id: 'liveliness_flair', label: 'Liveliness & flair', description: 'Engaging delivery style' },
    ],
    audience_awareness: [
        { id: 'understanding_audience', label: 'Taking account of level of understanding of audience', description: 'Adapting to listener needs' },
    ],
} as const;

/**
 * Complete strand definitions with all subskills
 */
export const ORACY_STRANDS = {
    physical: {
        id: 'physical',
        label: 'Physical',
        description: 'Voice and body language skills',
        color: '#E74C3C', // Red
        categories: PHYSICAL_SUBSKILLS,
    },
    linguistic: {
        id: 'linguistic',
        label: 'Linguistic',
        description: 'Vocabulary, language, and rhetorical techniques',
        color: '#9B59B6', // Purple
        categories: LINGUISTIC_SUBSKILLS,
    },
    cognitive: {
        id: 'cognitive',
        label: 'Cognitive',
        description: 'Content, structure, reasoning, and self-regulation',
        color: '#27AE60', // Green
        categories: COGNITIVE_SUBSKILLS,
    },
    social: {
        id: 'social',
        label: 'Social & Emotional',
        description: 'Working with others, listening, confidence, and audience awareness',
        color: '#3498DB', // Blue
        categories: SOCIAL_SUBSKILLS,
    },
} as const;

/**
 * Marker detected in a student's response
 */
export interface SubskillMarker {
    subskillId: string;
    detected: boolean;
    evidence?: string;  // Quotable snippet showing the marker
    strength?: 'emerging' | 'developing' | 'secure';
    notes?: string;
}

/**
 * Strand profile for a single assessment
 */
export interface OracyStrandProfile {
    strandType: OracyStrand;
    subskillMarkers: SubskillMarker[];
    exploratoryPatterns?: ExploratoryPattern[];
    baselineComparison?: BaselineComparison;
}

/**
 * Exploratory talk pattern detected
 * Per final_touches.md #1: Process over correctness
 */
export interface ExploratoryPattern {
    type: 'self_correction' | 'tentative_reasoning' | 'building_on_previous' | 'challenge';
    evidence: string;
    timestamp?: number;  // Position in recording
}

/**
 * Baseline comparison for progression tracking
 */
export interface BaselineComparison {
    baselineDate: string;
    baselineMarkers: SubskillMarker[];
    delta: 'improved' | 'maintained' | 'needs_focus';
    deltaNotes?: string;
}

/**
 * Get all subskills for a strand
 */
export function getSubskillsForStrand(strand: OracyStrand): { id: string; label: string; description: string }[] {
    const strandDef = ORACY_STRANDS[strand];
    const subskills: { id: string; label: string; description: string }[] = [];

    for (const category of Object.values(strandDef.categories)) {
        for (const subskill of category) {
            subskills.push({
                id: subskill.id,
                label: subskill.label,
                description: subskill.description,
            });
        }
    }

    return subskills;
}

/**
 * Get all subskills across all strands
 */
export function getAllSubskills(): { strand: OracyStrand; id: string; label: string; description: string }[] {
    const allSubskills: { strand: OracyStrand; id: string; label: string; description: string }[] = [];

    for (const [strandId, strandDef] of Object.entries(ORACY_STRANDS)) {
        const strand = strandId as OracyStrand;
        for (const category of Object.values(strandDef.categories)) {
            for (const subskill of category) {
                allSubskills.push({
                    strand,
                    id: subskill.id,
                    label: subskill.label,
                    description: subskill.description,
                });
            }
        }
    }

    return allSubskills;
}

/**
 * Count total subskills (for display)
 */
export function getTotalSubskillCount(): number {
    return getAllSubskills().length;
}
