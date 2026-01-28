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
 * UK Year Group mappings per Key Stage
 */
export const YEAR_GROUPS: Record<KeyStage, string[]> = {
    KS1: ['Year 1', 'Year 2'],
    KS2: ['Year 3', 'Year 4', 'Year 5', 'Year 6'],
    KS3: ['Year 7', 'Year 8', 'Year 9'],
    KS4: ['Year 10', 'Year 11'],
    KS5: ['Year 12', 'Year 13'],
};

/**
 * National Curriculum Subjects & Domains
 */
export interface NCSubject {
    subject: string;
    domains?: string[];
}

export const NC_SUBJECTS: NCSubject[] = [
    { subject: 'English', domains: ['Reading', 'Writing', 'Speaking & Listening'] },
    { subject: 'Maths', domains: ['Number & Place Value', 'Measurement', 'Geometry', 'Statistics'] },
    { subject: 'Science', domains: ['Living Things', 'Materials', 'Physical Processes'] },
    { subject: 'History' },
    { subject: 'Geography' },
    { subject: 'Computing' },
    { subject: 'Art & Design' },
    { subject: 'Design & Technology' },
    { subject: 'Music' },
    { subject: 'PE' },
    { subject: 'PSHE' },
    { subject: 'RE' },
    { subject: 'MFL' },
];

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

// ============================================
// GCSE EXAM BOARDS & ASSESSMENT OBJECTIVES (KS4)
// ============================================

/**
 * UK Exam Boards
 */
export type ExamBoard = 'AQA' | 'Edexcel' | 'OCR' | 'Eduqas' | 'WJEC' | 'Other';

export const EXAM_BOARDS: { id: ExamBoard; label: string }[] = [
    { id: 'AQA', label: 'AQA' },
    { id: 'Edexcel', label: 'Edexcel (Pearson)' },
    { id: 'OCR', label: 'OCR' },
    { id: 'Eduqas', label: 'Eduqas' },
    { id: 'WJEC', label: 'WJEC' },
    { id: 'Other', label: 'Other' },
];

/**
 * GCSE Assessment Objectives
 * Organized by subject for KS4 assessments
 */
export interface AssessmentObjective {
    id: string;
    code: string;
    description: string;
    shortDescription: string;
}

export interface GCSESubjectAOs {
    subject: string;
    assessmentObjectives: AssessmentObjective[];
}

export const GCSE_ASSESSMENT_OBJECTIVES: GCSESubjectAOs[] = [
    {
        subject: 'English Language',
        assessmentObjectives: [
            { id: 'eng-lang-ao1', code: 'AO1', description: 'Identify and interpret explicit and implicit information and ideas. Select and synthesise evidence from different texts.', shortDescription: 'Identify/Interpret' },
            { id: 'eng-lang-ao2', code: 'AO2', description: 'Explain, comment on and analyse how writers use language and structure to achieve effects and influence readers, using relevant subject terminology.', shortDescription: 'Language/Structure' },
            { id: 'eng-lang-ao3', code: 'AO3', description: 'Compare writers\' ideas and perspectives, as well as how these are conveyed, across two or more texts.', shortDescription: 'Compare' },
            { id: 'eng-lang-ao4', code: 'AO4', description: 'Evaluate texts critically and support this with appropriate textual references.', shortDescription: 'Evaluate' },
            { id: 'eng-lang-ao5', code: 'AO5', description: 'Communicate clearly, effectively and imaginatively, selecting and adapting tone, style and register for different forms, purposes and audiences.', shortDescription: 'Content/Organization' },
            { id: 'eng-lang-ao6', code: 'AO6', description: 'Candidates must use a range of vocabulary and sentence structures for clarity, purpose and effect, with accurate spelling and punctuation.', shortDescription: 'Vocabulary/Technical Accuracy' },
        ],
    },
    {
        subject: 'English Literature',
        assessmentObjectives: [
            { id: 'eng-lit-ao1', code: 'AO1', description: 'Read, understand and respond to texts. Students should be able to maintain a critical style and develop an informed personal response.', shortDescription: 'Respond' },
            { id: 'eng-lit-ao2', code: 'AO2', description: 'Analyse the language, form and structure used by a writer to create meanings and effects, using relevant subject terminology where appropriate.', shortDescription: 'Language/Structure/Form' },
            { id: 'eng-lit-ao3', code: 'AO3', description: 'Show understanding of the relationships between texts and the contexts in which they were written.', shortDescription: 'Context' },
            { id: 'eng-lit-ao4', code: 'AO4', description: 'Use a range of vocabulary and sentence structures for clarity, purpose and effect, with accurate spelling and punctuation.', shortDescription: 'Spelling/Punctuation/Grammar' },
        ],
    },
    {
        subject: 'Maths',
        assessmentObjectives: [
            { id: 'maths-ao1', code: 'AO1', description: 'Use and apply standard techniques. Students should be able to accurately recall facts, terminology and definitions.', shortDescription: 'Recall/Apply' },
            { id: 'maths-ao2', code: 'AO2', description: 'Reason, interpret and communicate mathematically. Make deductions, inferences and draw conclusions from mathematical information.', shortDescription: 'Reason/Communicate' },
            { id: 'maths-ao3', code: 'AO3', description: 'Solve problems within mathematics and in other contexts. Translate problems in mathematical or non-mathematical contexts into a process.', shortDescription: 'Problem Solve' },
        ],
    },
    {
        subject: 'Science',
        assessmentObjectives: [
            { id: 'science-ao1', code: 'AO1', description: 'Demonstrate knowledge and understanding of scientific ideas, techniques and procedures.', shortDescription: 'Knowledge' },
            { id: 'science-ao2', code: 'AO2', description: 'Apply knowledge and understanding of scientific ideas, techniques and procedures.', shortDescription: 'Application' },
            { id: 'science-ao3', code: 'AO3', description: 'Analyse information and ideas to interpret and evaluate, make judgements and draw conclusions, develop and improve experimental procedures.', shortDescription: 'Analysis/Evaluation' },
        ],
    },
    {
        subject: 'History',
        assessmentObjectives: [
            { id: 'history-ao1', code: 'AO1', description: 'Demonstrate knowledge and understanding of the key features and characteristics of the periods studied.', shortDescription: 'Knowledge' },
            { id: 'history-ao2', code: 'AO2', description: 'Explain and analyse historical events and periods studied using second-order historical concepts.', shortDescription: 'Explain/Analyse' },
            { id: 'history-ao3', code: 'AO3', description: 'Analyse, evaluate and use sources to make substantiated judgements in the context of historical events studied.', shortDescription: 'Source Analysis' },
            { id: 'history-ao4', code: 'AO4', description: 'Analyse, evaluate and make substantiated judgements about interpretations in the context of historical events studied.', shortDescription: 'Interpretations' },
        ],
    },
    {
        subject: 'Geography',
        assessmentObjectives: [
            { id: 'geography-ao1', code: 'AO1', description: 'Demonstrate knowledge of locations, places, processes, environments and different scales.', shortDescription: 'Knowledge' },
            { id: 'geography-ao2', code: 'AO2', description: 'Demonstrate geographical understanding of concepts; the interrelationships between places, environments and processes.', shortDescription: 'Understanding' },
            { id: 'geography-ao3', code: 'AO3', description: 'Apply knowledge and understanding to interpret, analyse and evaluate geographical information and issues.', shortDescription: 'Apply/Evaluate' },
            { id: 'geography-ao4', code: 'AO4', description: 'Select, adapt and use a variety of skills and techniques to investigate questions and issues and communicate findings.', shortDescription: 'Skills/Communicate' },
        ],
    },
];

/**
 * Get Assessment Objectives for a subject
 */
export function getAOsForSubject(subject: string): AssessmentObjective[] {
    const found = GCSE_ASSESSMENT_OBJECTIVES.find(s => s.subject === subject);
    return found?.assessmentObjectives ?? [];
}

/**
 * Check if a Key Stage supports GCSE AO tagging
 */
export function supportsGCSEAOs(keyStage: KeyStage | string | null | undefined): boolean {
    return keyStage === 'KS4';
}
