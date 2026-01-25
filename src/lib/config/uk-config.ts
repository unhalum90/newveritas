/**
 * UK Configuration Module
 * 
 * Centralized configuration for UK locale, Key Stages, and school descriptors.
 * Per dev_team_final_alignment.md: Tenant-level configuration, not separate deployment.
 */

export type Jurisdiction = 'US' | 'UK';

export type KeyStage = 'KS1' | 'KS2' | 'KS3' | 'KS4' | 'KS5';

export interface KeyStageInfo {
    stage: KeyStage;
    label: string;
    years: string;
    ageRange: string;
}

/**
 * UK Key Stage mappings
 */
export const KEY_STAGES: Record<KeyStage, KeyStageInfo> = {
    KS1: { stage: 'KS1', label: 'Key Stage 1', years: 'Years 1-2', ageRange: '5-7' },
    KS2: { stage: 'KS2', label: 'Key Stage 2', years: 'Years 3-6', ageRange: '7-11' },
    KS3: { stage: 'KS3', label: 'Key Stage 3', years: 'Years 7-9', ageRange: '11-14' },
    KS4: { stage: 'KS4', label: 'Key Stage 4', years: 'Years 10-11', ageRange: '14-16' },
    KS5: { stage: 'KS5', label: 'Key Stage 5', years: 'Years 12-13', ageRange: '16-18' },
};

/**
 * Map US grade levels to UK Key Stages
 */
export const US_TO_UK_GRADE_MAP: Record<string, KeyStage> = {
    'K': 'KS1',
    '1': 'KS1',
    '2': 'KS1',
    '3': 'KS2',
    '4': 'KS2',
    '5': 'KS2',
    '6': 'KS2',
    '7': 'KS3',
    '8': 'KS3',
    '9': 'KS3',
    '10': 'KS4',
    '11': 'KS4',
    '12': 'KS5',
    'Higher Ed': 'KS5',
};

/**
 * Default UK descriptors (school-configurable)
 * Per oracy_UK_build.md Section 3.1: These are templates, not mandates
 */
export const DEFAULT_UK_DESCRIPTORS = [
    'Exceptional',
    'Strong Standard',
    'Expected Standard',
    'Needs Attention',
    'Urgent Improvement',
] as const;

export type UKDescriptor = typeof DEFAULT_UK_DESCRIPTORS[number];

/**
 * Language guardrails - banned terms in UK locale
 * Per dev_team_final_alignment.md: Language & Trust Guardrails
 */
export const BANNED_TERMS_UK = [
    'score',
    'grade',
    'predict',
    'judge',
    'ranking',
    'accuracy',
    'pass',
    'fail',
] as const;

/**
 * Approved replacement terms for UK locale
 */
export const APPROVED_TERMS_UK = {
    score: 'marker',
    grade: 'descriptor',
    grading: 'evidence capture',
    predict: 'indicate',
    judge: 'observe',
    ranking: 'progression',
    accuracy: 'alignment',
    pass: 'meets expectations',
    fail: 'needs development',
} as const;

/**
 * Assessment context types for UK oracy
 */
export type AssessmentContext = 'lesson' | 'showcase' | 'project' | 'assembly' | 'presentation';

export const ASSESSMENT_CONTEXTS: Record<AssessmentContext, string> = {
    lesson: 'Lesson Activity',
    showcase: 'Showcase Event',
    project: 'Project Work',
    assembly: 'Assembly',
    presentation: 'Formal Presentation',
};

/**
 * UK locale configuration for assessments
 */
export interface UKLocaleConfig {
    jurisdiction: 'UK';
    keyStage: KeyStage;
    descriptors?: string[];
    contextType?: AssessmentContext;
    oracyStrandsEnabled?: boolean;
}

/**
 * Check if jurisdiction is UK
 */
export function isUKLocale(jurisdiction: Jurisdiction | string | undefined): boolean {
    return jurisdiction === 'UK';
}

/**
 * Get Key Stage from US grade level
 */
export function getKeyStageFromGrade(usGrade: string): KeyStage | null {
    return US_TO_UK_GRADE_MAP[usGrade] || null;
}

/**
 * Replace banned terms with approved alternatives
 */
export function sanitizeForUK(text: string): string {
    let result = text;
    for (const [banned, replacement] of Object.entries(APPROVED_TERMS_UK)) {
        const regex = new RegExp(`\\b${banned}\\b`, 'gi');
        result = result.replace(regex, replacement);
    }
    return result;
}

/**
 * Check if text contains banned terms
 */
export function containsBannedTerms(text: string): string[] {
    const found: string[] = [];
    for (const term of BANNED_TERMS_UK) {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(text)) {
            found.push(term);
        }
    }
    return found;
}

// ============================================
// WORKSPACE-LEVEL LOCALE CONFIGURATION
// ============================================

/**
 * Workspace locale configuration
 * This is set at school creation and inherited by all workspaces/teachers
 */
export interface WorkspaceLocaleConfig {
    locale: Jurisdiction;
    localeLocked: boolean;

    // UK-specific defaults
    hideScores: boolean;
    hideGrades: boolean;
    hideRubricLanguage: boolean;
    enableOracyStrands: boolean;
    narrativeFeedbackPrimary: boolean;

    // Descriptors
    descriptors: readonly string[];
}

/**
 * Default configuration for US workspaces
 */
export const US_WORKSPACE_DEFAULTS: WorkspaceLocaleConfig = {
    locale: 'US',
    localeLocked: false,
    hideScores: false,
    hideGrades: false,
    hideRubricLanguage: false,
    enableOracyStrands: false,
    narrativeFeedbackPrimary: false,
    descriptors: [],
};

/**
 * Default configuration for UK workspaces
 * Per uk_centric_build.md Section 5.2
 */
export const UK_WORKSPACE_DEFAULTS: WorkspaceLocaleConfig = {
    locale: 'UK',
    localeLocked: true,  // UK schools cannot change locale
    hideScores: true,     // Numeric scores: disabled
    hideGrades: true,     // Letter grades: disabled
    hideRubricLanguage: true,  // Rubric language: hidden
    enableOracyStrands: true,  // Oracy strands: enabled by default
    narrativeFeedbackPrimary: true,  // Narrative feedback: primary output
    descriptors: DEFAULT_UK_DESCRIPTORS,
};

/**
 * Get defaults for a given locale
 */
export function getDefaultsForLocale(locale: Jurisdiction | string | undefined): WorkspaceLocaleConfig {
    if (isUKLocale(locale)) {
        return UK_WORKSPACE_DEFAULTS;
    }
    return US_WORKSPACE_DEFAULTS;
}

/**
 * Check if scores should be hidden for this locale
 */
export function shouldHideScores(locale: Jurisdiction | string | undefined): boolean {
    return getDefaultsForLocale(locale).hideScores;
}

/**
 * Check if grades should be hidden for this locale
 */
export function shouldHideGrades(locale: Jurisdiction | string | undefined): boolean {
    return getDefaultsForLocale(locale).hideGrades;
}

/**
 * Check if oracy strands should be enabled by default
 */
export function shouldEnableOracyStrands(locale: Jurisdiction | string | undefined): boolean {
    return getDefaultsForLocale(locale).enableOracyStrands;
}

/**
 * Get UK-appropriate terminology
 */
export const UK_TERMINOLOGY: Record<string, string> = {
    'Score': 'Indicator',
    'score': 'indicator',
    'Scores': 'Indicators',
    'scores': 'indicators',
    'Rubric': 'Progression Markers',
    'rubric': 'progression markers',
    'Grade': 'Descriptor',
    'grade': 'descriptor',
    'Grades': 'Descriptors',
    'grades': 'descriptors',
    'Mastery': 'Secure',
    'mastery': 'secure',
    'Objective met': 'Evidence observed',
    'objective met': 'evidence observed',
    'Assessment': 'Evidence Capture',
    'Grading': 'Evidence Capture',
    'grading': 'evidence capture',
};

/**
 * Translate term for UK locale
 */
export function translateTermForLocale(term: string, locale: Jurisdiction | string | undefined): string {
    if (!isUKLocale(locale)) return term;
    return UK_TERMINOLOGY[term] ?? term;
}

/**
 * Map country input to locale
 */
export function countryToLocale(country: string | null | undefined): Jurisdiction {
    if (!country) return 'US';
    const normalized = country.toLowerCase().trim();
    const ukCountries = ['uk', 'gb', 'united kingdom', 'england', 'scotland', 'wales', 'northern ireland', 'britain', 'great britain'];
    return ukCountries.includes(normalized) ? 'UK' : 'US';
}

