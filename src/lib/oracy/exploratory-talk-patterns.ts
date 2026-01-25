/**
 * Exploratory Talk Patterns
 * 
 * Per final_touches.md #1: "Assessment must prioritise process over correctness"
 * 
 * This module defines patterns for detecting:
 * - Self-correction and reformulation
 * - Tentative reasoning (half-formed ideas)
 * - Building on previous ideas
 * - Challenge patterns
 * 
 * AI must tolerate fillers, hesitation, and exploratory talk as POSITIVE indicators
 * of thinking, not errors to penalise.
 */

/**
 * Types of exploratory talk patterns
 */
export type ExploratoryPatternType =
    | 'self_correction'
    | 'tentative_reasoning'
    | 'building_on_previous'
    | 'challenge'
    | 'hesitation_thinking'
    | 'reformulation';

/**
 * Pattern definition with detection markers
 */
export interface ExploratoryPatternDef {
    type: ExploratoryPatternType;
    label: string;
    description: string;
    positiveIndicator: boolean;  // Always true - these are signs of thinking
    detectionMarkers: string[];
    examplePhrases: string[];
}

/**
 * Exploratory talk pattern definitions
 */
export const EXPLORATORY_PATTERNS: Record<ExploratoryPatternType, ExploratoryPatternDef> = {
    self_correction: {
        type: 'self_correction',
        label: 'Self-correction',
        description: 'Student revises or corrects their own thinking mid-response',
        positiveIndicator: true,
        detectionMarkers: [
            'actually',
            'no wait',
            'I mean',
            'let me rephrase',
            'that\'s not quite right',
            'what I meant was',
            'sorry, I should say',
            'to be more precise',
        ],
        examplePhrases: [
            'Actually, I think it\'s more like...',
            'No wait, let me think about that again...',
            'I mean, what I\'m trying to say is...',
        ],
    },

    tentative_reasoning: {
        type: 'tentative_reasoning',
        label: 'Tentative reasoning',
        description: 'Student explores ideas without committing to certainty',
        positiveIndicator: true,
        detectionMarkers: [
            'I think maybe',
            'perhaps',
            'it could be',
            'I\'m not sure but',
            'possibly',
            'it might be',
            'I wonder if',
            'what if',
        ],
        examplePhrases: [
            'I think maybe the reason is...',
            'Perhaps it works because...',
            'I\'m not sure but it could be related to...',
        ],
    },

    building_on_previous: {
        type: 'building_on_previous',
        label: 'Building on previous',
        description: 'Student references and extends earlier ideas',
        positiveIndicator: true,
        detectionMarkers: [
            'adding to that',
            'building on',
            'as I said before',
            'going back to',
            'this connects to',
            'which relates to',
            'following on from',
            'to extend that point',
        ],
        examplePhrases: [
            'Adding to that, I think...',
            'Building on what I said earlier...',
            'This connects to my earlier point about...',
        ],
    },

    challenge: {
        type: 'challenge',
        label: 'Challenge pattern',
        description: 'Student questions or problematises an idea',
        positiveIndicator: true,
        detectionMarkers: [
            'but what about',
            'on the other hand',
            'however',
            'that doesn\'t explain',
            'I disagree because',
            'but surely',
            'the problem with that is',
            'couldn\'t it also be',
        ],
        examplePhrases: [
            'But what about the other side?',
            'On the other hand, you could argue...',
            'However, that doesn\'t fully explain...',
        ],
    },

    hesitation_thinking: {
        type: 'hesitation_thinking',
        label: 'Thinking hesitation',
        description: 'Pauses and fillers indicating active thinking (NOT errors)',
        positiveIndicator: true,
        detectionMarkers: [
            'erm',
            'um',
            'like',
            'let me think',
            'so',
            'well',
            'hmm',
            'you know',
        ],
        examplePhrases: [
            'Erm, so I think...',
            'Let me think... the answer would be...',
            'Well, it\'s kind of like...',
        ],
    },

    reformulation: {
        type: 'reformulation',
        label: 'Reformulation',
        description: 'Student restates idea in different words for clarity',
        positiveIndicator: true,
        detectionMarkers: [
            'in other words',
            'what I\'m saying is',
            'to put it another way',
            'basically',
            'so in summary',
            'the point is',
            'essentially',
        ],
        examplePhrases: [
            'In other words, the main cause was...',
            'What I\'m saying is that...',
            'To put it another way...',
        ],
    },
};

/**
 * Detected pattern in transcript
 */
export interface DetectedPattern {
    type: ExploratoryPatternType;
    evidence: string;  // The actual phrase detected
    position?: number;  // Character position in transcript
    context?: string;  // Surrounding text for context
}

/**
 * Detect exploratory patterns in a transcript
 * Returns all detected patterns with evidence
 */
export function detectExploratoryPatterns(transcript: string): DetectedPattern[] {
    const detected: DetectedPattern[] = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const [type, pattern] of Object.entries(EXPLORATORY_PATTERNS)) {
        for (const marker of pattern.detectionMarkers) {
            const index = lowerTranscript.indexOf(marker.toLowerCase());
            if (index !== -1) {
                // Extract context (50 chars before and after)
                const start = Math.max(0, index - 50);
                const end = Math.min(transcript.length, index + marker.length + 50);
                const context = transcript.slice(start, end);

                detected.push({
                    type: type as ExploratoryPatternType,
                    evidence: transcript.slice(index, index + marker.length + 20).trim(),
                    position: index,
                    context: context,
                });

                break;  // Only detect each pattern type once
            }
        }
    }

    return detected;
}

/**
 * Count exploratory patterns by type
 */
export function countPatternsByType(patterns: DetectedPattern[]): Record<ExploratoryPatternType, number> {
    const counts: Record<ExploratoryPatternType, number> = {
        self_correction: 0,
        tentative_reasoning: 0,
        building_on_previous: 0,
        challenge: 0,
        hesitation_thinking: 0,
        reformulation: 0,
    };

    for (const pattern of patterns) {
        counts[pattern.type]++;
    }

    return counts;
}

/**
 * Generate summary of exploratory talk for teacher
 */
export function generateExploratoryTalkSummary(patterns: DetectedPattern[]): string {
    if (patterns.length === 0) {
        return 'No exploratory talk patterns detected.';
    }

    const counts = countPatternsByType(patterns);
    const summary: string[] = [];

    if (counts.self_correction > 0) {
        summary.push(`Self-correction detected (${counts.self_correction}x) - student revises thinking`);
    }
    if (counts.tentative_reasoning > 0) {
        summary.push(`Tentative reasoning detected - student explores possibilities`);
    }
    if (counts.building_on_previous > 0) {
        summary.push(`Building on ideas - student extends previous points`);
    }
    if (counts.challenge > 0) {
        summary.push(`Challenge patterns - student questions and problematises`);
    }

    return summary.join('. ') + '.';
}
