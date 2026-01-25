/**
 * GCSE-Aligned Prompt Packs
 * 
 * Per oracy_UK_build.md Section 7.1:
 * Pre-built, editable prompt banks aligned to high-stakes expectations.
 * 
 * Prompts mirror exam-board language WITHOUT claiming accreditation.
 * 
 * Subjects covered:
 * - English Language: Spoken Language Endorsement practice
 * - Science: Oral explanations of Required Practicals
 * - History: Structured significance and causation explanations
 */

import { OracyStrand } from '../oracy/oracy-strands';
import { ScaffoldLevel } from '../oracy/scaffold-levels';

/**
 * GCSE subject areas with oracy prompts
 */
export type GCSESubject =
    | 'english_language'
    | 'science'
    | 'history';

/**
 * Prompt pack structure
 */
export interface PromptPack {
    id: string;
    subject: GCSESubject;
    title: string;
    description: string;
    targetKeyStages: ('KS4' | 'KS5')[];
    prompts: GCSEPrompt[];
    strandFocus: OracyStrand[];
    examBoardNotes?: string;
}

/**
 * Individual GCSE prompt
 */
export interface GCSEPrompt {
    id: string;
    title: string;
    promptText: string;
    scaffoldVariants: Record<ScaffoldLevel, string>;
    targetStrands: OracyStrand[];
    successCriteria: string[];
    timingGuidance: string;
    exemplarResponse?: string;
}

/**
 * English Language - Spoken Language Endorsement
 */
export const ENGLISH_LANGUAGE_PACK: PromptPack = {
    id: 'gcse_english_spoken',
    subject: 'english_language',
    title: 'Spoken Language Endorsement Practice',
    description: 'Practice prompts aligned to GCSE English Language spoken language requirements',
    targetKeyStages: ['KS4'],
    strandFocus: ['physical', 'linguistic', 'cognitive'],
    examBoardNotes: 'Aligned to spoken language endorsement requirements. Not exam board accredited.',
    prompts: [
        {
            id: 'eng_persuasive_speech',
            title: 'Persuasive Speech',
            promptText: 'Prepare and deliver a 3-5 minute persuasive speech on a topic of your choice. You should aim to convince your audience to take action or change their perspective.',
            scaffoldVariants: {
                heavy: 'Prepare a persuasive speech using this structure:\n1. Hook: Begin with "Imagine if..."\n2. State your position: "I believe that..."\n3. First reason: "Firstly, this matters because..."\n4. Evidence: "The evidence shows that..."\n5. Counter-argument: "Some might say... but..."\n6. Call to action: "Therefore, I urge you to..."',
                light: 'Structure: Hook → Position → Reasons with evidence → Counter-argument → Call to action',
                none: 'Prepare and deliver a 3-5 minute persuasive speech on a topic of your choice.',
            },
            targetStrands: ['physical', 'linguistic', 'cognitive'],
            successCriteria: [
                'Clear, confident delivery with appropriate pace and volume',
                'Use of rhetorical techniques (rule of three, rhetorical questions)',
                'Logical structure with clear progression of ideas',
                'Effective use of evidence to support claims',
                'Direct address to audience',
            ],
            timingGuidance: '3-5 minutes speaking time',
        },
        {
            id: 'eng_response_viewpoint',
            title: 'Response to a Viewpoint',
            promptText: 'Listen to the statement provided, then explain whether you agree or disagree, giving reasons for your view and responding to potential counter-arguments.',
            scaffoldVariants: {
                heavy: 'Respond using this structure:\n1. "Having heard this viewpoint, I..."\n2. "My main reason is that... because..."\n3. "Some might argue that... however..."\n4. "To conclude, I maintain that..."',
                light: 'Consider: Your position → Main reasons → Counter-arguments → Conclusion',
                none: 'Respond to the statement, explaining your view with reasons and addressing counter-arguments.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Clear statement of position',
                'Reasons supported by evidence or examples',
                'Acknowledgement and response to opposing views',
                'Appropriate register for discussion',
            ],
            timingGuidance: '2-3 minutes speaking time',
        },
        {
            id: 'eng_presentation_topic',
            title: 'Presentation on a Topic',
            promptText: 'Research and present on a topic you are passionate about. Your presentation should inform and engage your audience.',
            scaffoldVariants: {
                heavy: 'Structure your presentation:\n1. Introduction: "Today I\'m going to talk about... because..."\n2. Background: "First, let me explain..."\n3. Main points (3): "The first thing to know... Secondly... Finally..."\n4. Personal connection: "This matters to me because..."\n5. Conclusion: "In summary... I hope you\'ll agree that..."',
                light: 'Include: Introduction → Background → 3 main points → Personal connection → Conclusion',
                none: 'Present on a topic you are passionate about, informing and engaging your audience.',
            },
            targetStrands: ['physical', 'linguistic', 'cognitive', 'social'],
            successCriteria: [
                'Confident and engaging delivery',
                'Clear structure and signposting',
                'Subject-appropriate vocabulary',
                'Evidence of research and understanding',
                'Ability to respond to questions',
            ],
            timingGuidance: '5-7 minutes including questions',
        },
    ],
};

/**
 * Science - Required Practicals Explanations
 */
export const SCIENCE_PACK: PromptPack = {
    id: 'gcse_science_practicals',
    subject: 'science',
    title: 'Required Practicals - Oral Explanations',
    description: 'Practice prompts for explaining required practical procedures and results',
    targetKeyStages: ['KS4'],
    strandFocus: ['cognitive', 'linguistic'],
    examBoardNotes: 'Aligned to common required practicals. Specific practicals vary by exam board.',
    prompts: [
        {
            id: 'sci_practical_method',
            title: 'Explain a Practical Method',
            promptText: 'Explain the method for [practical name], including the key steps, variables, and safety considerations.',
            scaffoldVariants: {
                heavy: 'Explain the method:\n1. "The aim of this practical is to..."\n2. "The independent variable is... and the dependent variable is..."\n3. "The control variables include..."\n4. "First, we... Then... After that... Finally..."\n5. "Safety considerations include... because..."',
                light: 'Cover: Aim → Variables (IV, DV, control) → Step-by-step method → Safety',
                none: 'Explain the method for this practical, including key steps, variables, and safety.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Correct identification of variables',
                'Logical sequencing of steps',
                'Use of scientific terminology',
                'Explanation of safety measures with reasoning',
                'Understanding of fair testing',
            ],
            timingGuidance: '2-3 minutes',
        },
        {
            id: 'sci_results_analysis',
            title: 'Analyse Results',
            promptText: 'Looking at the results from [practical name], describe the pattern you observe and explain what it shows about [concept].',
            scaffoldVariants: {
                heavy: 'Analyse the results:\n1. "The pattern in the results shows that..."\n2. "As the [IV] increases, the [DV]..."\n3. "This is because..."\n4. "The scientific explanation is that..."\n5. "One anomaly I notice is... which could be due to..."',
                light: 'Describe: Pattern → Relationship between variables → Scientific explanation → Anomalies',
                none: 'Describe the pattern in the results and explain what it shows.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Accurate description of results pattern',
                'Correct use of increase/decrease terminology',
                'Link to underlying scientific concept',
                'Identification of anomalies',
                'Use of data to support statements',
            ],
            timingGuidance: '2-3 minutes',
        },
        {
            id: 'sci_evaluate_method',
            title: 'Evaluate a Method',
            promptText: 'Evaluate the method used in [practical name]. What were the strengths and limitations? How could it be improved?',
            scaffoldVariants: {
                heavy: 'Evaluate the method:\n1. "A strength of this method was... because..."\n2. "However, a limitation was... because..."\n3. "This may have affected the results by..."\n4. "To improve the method, we could... which would..."',
                light: 'Consider: Strengths → Limitations → Effect on results → Improvements',
                none: 'Evaluate the strengths and limitations of the method and suggest improvements.',
            },
            targetStrands: ['cognitive'],
            successCriteria: [
                'Identification of genuine strengths',
                'Recognition of limitations with reasoning',
                'Understanding of how limitations affect results',
                'Practical and relevant improvement suggestions',
            ],
            timingGuidance: '2-3 minutes',
        },
    ],
};

/**
 * History - Significance and Causation
 */
export const HISTORY_PACK: PromptPack = {
    id: 'gcse_history_explanations',
    subject: 'history',
    title: 'Historical Significance and Causation',
    description: 'Practice prompts for structured historical explanations',
    targetKeyStages: ['KS4'],
    strandFocus: ['cognitive', 'linguistic'],
    examBoardNotes: 'Generic historical thinking skills applicable across exam boards.',
    prompts: [
        {
            id: 'hist_explain_significance',
            title: 'Explain Historical Significance',
            promptText: 'Explain why [event/person/development] was historically significant.',
            scaffoldVariants: {
                heavy: 'Explain significance:\n1. "[Event] was significant because..."\n2. "At the time, this mattered because..."\n3. "In the longer term, this led to..."\n4. "Compared to other [events], this was particularly significant because..."\n5. "Historians today consider this significant because..."',
                light: 'Consider: Immediate impact → Long-term consequences → Comparison → Historical importance',
                none: 'Explain why this was historically significant.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Clear explanation of significance',
                'Reference to immediate and long-term impact',
                'Use of historical terminology',
                'Evidence to support claims',
                'Consideration of different perspectives',
            ],
            timingGuidance: '2-3 minutes',
        },
        {
            id: 'hist_explain_causation',
            title: 'Explain Causation',
            promptText: 'Explain what caused [event/change]. Which factors were most important?',
            scaffoldVariants: {
                heavy: 'Explain causation:\n1. "[Event] was caused by several factors..."\n2. "One cause was... This led to... because..."\n3. "Another cause was... The evidence for this is..."\n4. "The most important cause was... because without it..."\n5. "These causes were linked because..."',
                light: 'Cover: Multiple causes → Evidence for each → Most important cause → Links between causes',
                none: 'Explain what caused this event and which factors were most important.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Identification of multiple causes',
                'Evidence to support each cause',
                'Judgement about relative importance',
                'Understanding of how causes are linked',
                'Structured explanation',
            ],
            timingGuidance: '3-4 minutes',
        },
        {
            id: 'hist_compare_interpretations',
            title: 'Compare Historical Interpretations',
            promptText: 'Compare two interpretations of [event/person]. Why might historians disagree?',
            scaffoldVariants: {
                heavy: 'Compare interpretations:\n1. "Interpretation A suggests that... The evidence used is..."\n2. "Interpretation B, however, argues... This is based on..."\n3. "The interpretations differ because..."\n4. "Historians might disagree because of different... [evidence/perspectives/questions]"\n5. "I find [A/B] more convincing because..."',
                light: 'Cover: Interpretation A → Interpretation B → Why they differ → Which is more convincing',
                none: 'Compare the two interpretations and explain why historians might disagree.',
            },
            targetStrands: ['cognitive', 'linguistic'],
            successCriteria: [
                'Accurate summary of both interpretations',
                'Recognition of evidence used',
                'Understanding of why interpretations differ',
                'Reasoned judgement with justification',
            ],
            timingGuidance: '3-4 minutes',
        },
    ],
};

/**
 * All prompt packs
 */
export const ALL_PROMPT_PACKS: PromptPack[] = [
    ENGLISH_LANGUAGE_PACK,
    SCIENCE_PACK,
    HISTORY_PACK,
];

/**
 * Get prompt pack by subject
 */
export function getPromptPackBySubject(subject: GCSESubject): PromptPack | undefined {
    return ALL_PROMPT_PACKS.find(pack => pack.subject === subject);
}

/**
 * Get all prompts for a strand focus
 */
export function getPromptsForStrand(strand: OracyStrand): GCSEPrompt[] {
    return ALL_PROMPT_PACKS.flatMap(pack =>
        pack.prompts.filter(prompt => prompt.targetStrands.includes(strand))
    );
}

/**
 * Get prompt variant for scaffold level
 */
export function getPromptWithScaffold(
    prompt: GCSEPrompt,
    scaffoldLevel: ScaffoldLevel
): string {
    return prompt.scaffoldVariants[scaffoldLevel];
}
