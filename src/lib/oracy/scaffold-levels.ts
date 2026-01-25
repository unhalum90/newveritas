/**
 * Scaffold Levels
 * 
 * Per final_touches.md #7: "Scaffolds must be removable"
 * 
 * Implements progressive scaffold fading:
 * - Heavy: Full sentence stems, guided prompts
 * - Light: Minimal prompts, key vocabulary hints
 * - None: Open response, student independence
 * 
 * Tracks scaffold reliance over time to support progression toward independence.
 */

/**
 * Scaffold level types
 */
export type ScaffoldLevel = 'heavy' | 'light' | 'none';

/**
 * Scaffold level configuration
 */
export interface ScaffoldLevelConfig {
    level: ScaffoldLevel;
    label: string;
    description: string;
    features: string[];
    recommendedFor: string;
}

/**
 * Scaffold level definitions
 */
export const SCAFFOLD_LEVELS: Record<ScaffoldLevel, ScaffoldLevelConfig> = {
    heavy: {
        level: 'heavy',
        label: 'Full Support',
        description: 'Comprehensive scaffolding with sentence stems and guided prompts',
        features: [
            'Full sentence stems provided',
            'Structured prompt sequence',
            'Vocabulary bank visible',
            'Reasoning frame templates',
            'Example responses available',
        ],
        recommendedFor: 'EAL students, SLCN students, or introducing new oracy skills',
    },

    light: {
        level: 'light',
        label: 'Partial Support',
        description: 'Minimal scaffolding with key vocabulary hints only',
        features: [
            'Key vocabulary hints only',
            'Brief prompt reminder',
            'No sentence stems',
            'Encourages independent structure',
        ],
        recommendedFor: 'Students developing confidence, familiar with task type',
    },

    none: {
        level: 'none',
        label: 'Independent',
        description: 'No scaffolding - open response demonstrating independence',
        features: [
            'Open response format',
            'No prompts or hints',
            'Full student independence',
            'Assessment of autonomous oracy',
        ],
        recommendedFor: 'Secure students, summative assessment, high-stakes contexts',
    },
};

/**
 * Sentence stem templates for heavy scaffolding
 */
export const SENTENCE_STEMS = {
    reasoning: [
        'I think this because...',
        'The evidence shows that...',
        'This matters because...',
        'One reason is...',
        'Based on this, I believe...',
    ],

    structure: [
        'Firstly, I would like to explain...',
        'To begin with...',
        'Moving on to my next point...',
        'In conclusion...',
        'To summarise...',
    ],

    challenge: [
        'However, on the other hand...',
        'But what about...?',
        'An alternative view might be...',
        'This could be challenged by...',
        'Nevertheless...',
    ],

    building: [
        'Adding to this point...',
        'Building on what was said...',
        'This connects to...',
        'Furthermore...',
        'In addition to this...',
    ],

    clarifying: [
        'To put it another way...',
        'What I mean by this is...',
        'In other words...',
        'To be more specific...',
        'Let me explain further...',
    ],
};

/**
 * Scaffold usage record
 */
export interface ScaffoldUsageRecord {
    studentId: string;
    assessmentId: string;
    scaffoldLevel: ScaffoldLevel;
    createdAt: Date;
}

/**
 * Scaffold progression analysis
 */
export interface ScaffoldProgression {
    studentId: string;
    usageHistory: ScaffoldUsageRecord[];
    currentLevel: ScaffoldLevel;
    recommendation: ScaffoldLevel;
    progressionNotes: string;
}

/**
 * Analyse scaffold usage and recommend next level
 */
export function analyseScaffoldProgression(usageHistory: ScaffoldUsageRecord[]): {
    recommendation: ScaffoldLevel;
    notes: string;
} {
    if (usageHistory.length === 0) {
        return {
            recommendation: 'heavy',
            notes: 'No prior usage - recommend starting with full support',
        };
    }

    // Sort by date, most recent first
    const sorted = [...usageHistory].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const recentLevel = sorted[0].scaffoldLevel;

    // Count usage at each level in last 5 assessments
    const recentUsage = sorted.slice(0, 5);
    const levelCounts = {
        heavy: recentUsage.filter(u => u.scaffoldLevel === 'heavy').length,
        light: recentUsage.filter(u => u.scaffoldLevel === 'light').length,
        none: recentUsage.filter(u => u.scaffoldLevel === 'none').length,
    };

    // Recommend progression
    if (recentLevel === 'heavy' && levelCounts.heavy >= 3) {
        return {
            recommendation: 'light',
            notes: 'Student has used full support consistently - consider reducing scaffold',
        };
    }

    if (recentLevel === 'light' && levelCounts.light >= 3) {
        return {
            recommendation: 'none',
            notes: 'Student developing independence - consider removing scaffold',
        };
    }

    if (recentLevel === 'none' && levelCounts.none >= 3) {
        return {
            recommendation: 'none',
            notes: 'Student demonstrating independence - maintain current level',
        };
    }

    return {
        recommendation: recentLevel,
        notes: 'Maintain current scaffold level',
    };
}

/**
 * Get sentence stems for a scaffold level and category
 */
export function getSentenceStems(
    level: ScaffoldLevel,
    categories?: (keyof typeof SENTENCE_STEMS)[]
): string[] {
    if (level === 'none') {
        return [];
    }

    if (level === 'light') {
        // Return first stem from each category only
        const cats = categories || (Object.keys(SENTENCE_STEMS) as (keyof typeof SENTENCE_STEMS)[]);
        return cats.map(cat => SENTENCE_STEMS[cat][0]);
    }

    // Heavy: return all stems for requested categories
    const cats = categories || (Object.keys(SENTENCE_STEMS) as (keyof typeof SENTENCE_STEMS)[]);
    return cats.flatMap(cat => SENTENCE_STEMS[cat]);
}

/**
 * Check if student is ready for scaffold reduction
 */
export function isReadyForScaffoldReduction(
    currentLevel: ScaffoldLevel,
    consecutiveSuccesses: number
): boolean {
    if (currentLevel === 'none') {
        return false;  // Already at independence
    }

    // Require 3+ consecutive successes at current level
    return consecutiveSuccesses >= 3;
}
