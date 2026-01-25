/**
 * Oracy Module Index
 * 
 * UK Oracy strand intelligence engine aligned to Voice 21 Framework.
 */

// Core strand definitions
export type {
    OracyStrand,
    OracyStrandProfile,
    SubskillMarker,
    ExploratoryPattern,
    BaselineComparison,
} from './oracy-strands';

export {
    ORACY_STRANDS,
    PHYSICAL_SUBSKILLS,
    LINGUISTIC_SUBSKILLS,
    COGNITIVE_SUBSKILLS,
    SOCIAL_SUBSKILLS,
    getSubskillsForStrand,
    getAllSubskills,
    getTotalSubskillCount,
} from './oracy-strands';

// Exploratory talk patterns
export type {
    ExploratoryPatternType,
    ExploratoryPatternDef,
    DetectedPattern,
} from './exploratory-talk-patterns';

export {
    EXPLORATORY_PATTERNS,
    detectExploratoryPatterns,
    countPatternsByType,
    generateExploratoryTalkSummary,
} from './exploratory-talk-patterns';

// Scaffold fading system
export type {
    ScaffoldLevel,
    ScaffoldLevelConfig,
    ScaffoldUsageRecord,
    ScaffoldProgression,
} from './scaffold-levels';

export {
    SCAFFOLD_LEVELS,
    SENTENCE_STEMS,
    analyseScaffoldProgression,
    getSentenceStems,
    isReadyForScaffoldReduction,
} from './scaffold-levels';
