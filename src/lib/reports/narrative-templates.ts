/**
 * Narrative Report Templates
 * 
 * Per final_touches.md #8: "Reporting must be narrative-ready"
 * 
 * Pre-built narrative report sections:
 * - "What improved" - progress summary
 * - "Why it matters" - significance framing
 * - "Evidence examples" - quotable snippets
 * 
 * All templates use inspection-ready language.
 */

import { OracyStrand, ORACY_STRANDS } from '../oracy/oracy-strands';
import { KeyStage, KEY_STAGES } from '../config/uk-config';

/**
 * Narrative template types
 */
export type NarrativeTemplateType =
    | 'what_improved'
    | 'why_it_matters'
    | 'evidence_examples'
    | 'cohort_summary'
    | 'individual_progress'
    | 'intervention_impact';

/**
 * Narrative template structure
 */
export interface NarrativeTemplate {
    type: NarrativeTemplateType;
    title: string;
    description: string;
    placeholders: TemplatePlaceholder[];
    template: string;
}

/**
 * Placeholder in template
 */
export interface TemplatePlaceholder {
    key: string;
    description: string;
    example: string;
    required: boolean;
}

/**
 * Pre-built narrative templates
 */
export const NARRATIVE_TEMPLATES: Record<NarrativeTemplateType, NarrativeTemplate> = {
    what_improved: {
        type: 'what_improved',
        title: 'What Improved',
        description: 'Summarise progression and improvements observed',
        placeholders: [
            { key: 'STRAND', description: 'Oracy strand name', example: 'Cognitive', required: true },
            { key: 'SUBSKILL', description: 'Specific subskill', example: 'reasoning', required: false },
            { key: 'BASELINE', description: 'Starting point description', example: 'limited evidence of structured reasoning', required: true },
            { key: 'CURRENT', description: 'Current state description', example: 'consistent use of reasoning markers', required: true },
            { key: 'TIMEFRAME', description: 'Period of improvement', example: 'Autumn to Spring term', required: true },
        ],
        template: `### What Improved

Over {{TIMEFRAME}}, students showed marked development in the **{{STRAND}}** strand{{#SUBSKILL}}, particularly in {{SUBSKILL}}{{/SUBSKILL}}.

**Starting Point**: {{BASELINE}}

**Current Position**: {{CURRENT}}

This progression demonstrates the impact of focused oracy teaching and indicates secure development in this area.`,
    },

    why_it_matters: {
        type: 'why_it_matters',
        title: 'Why It Matters',
        description: 'Frame the significance of observed patterns',
        placeholders: [
            { key: 'OBSERVATION', description: 'Key observation', example: 'increase in reasoning markers', required: true },
            { key: 'CURRICULUM_LINK', description: 'Link to curriculum', example: 'supports analytical writing in GCSE English', required: true },
            { key: 'WIDER_IMPACT', description: 'Broader significance', example: 'confidence in whole-class discussion', required: false },
        ],
        template: `### Why It Matters

The {{OBSERVATION}} is significant because it {{CURRICULUM_LINK}}.

{{#WIDER_IMPACT}}Beyond academic outcomes, this development supports {{WIDER_IMPACT}}, contributing to students' readiness for post-secondary pathways.{{/WIDER_IMPACT}}

Strong oracy skills are foundational to learning across all subjects and support students' ability to articulate, question, and refine their thinking.`,
    },

    evidence_examples: {
        type: 'evidence_examples',
        title: 'Evidence Examples',
        description: 'Quotable snippets with annotation',
        placeholders: [
            { key: 'QUOTE', description: 'Student quote (anonymised)', example: 'The reason I think this is because the evidence shows...', required: true },
            { key: 'YEAR_GROUP', description: 'Year group', example: 'Year 9', required: true },
            { key: 'STRAND', description: 'Relevant strand', example: 'Cognitive', required: true },
            { key: 'WHY_EXEMPLARY', description: 'Teacher annotation', example: 'Uses causal connector and references evidence', required: true },
        ],
        template: `### Evidence Example

> "{{QUOTE}}"
> — {{YEAR_GROUP}} Student (anonymised)

**Strand**: {{STRAND}}

**Why this is exemplary**: {{WHY_EXEMPLARY}}

This response demonstrates the type of oracy development the school is working toward across all key stages.`,
    },

    cohort_summary: {
        type: 'cohort_summary',
        title: 'Cohort Summary',
        description: 'Overview of cohort-level patterns',
        placeholders: [
            { key: 'KEY_STAGE', description: 'Key Stage', example: 'KS3', required: true },
            { key: 'STUDENT_COUNT', description: 'Number of students', example: '120', required: true },
            { key: 'STRONGEST_STRAND', description: 'Best performing strand', example: 'Physical', required: true },
            { key: 'FOCUS_STRAND', description: 'Strand needing focus', example: 'Cognitive', required: true },
            { key: 'NOTABLE_PATTERN', description: 'Key pattern observed', example: 'strong vocabulary but limited reasoning structure', required: false },
        ],
        template: `### Cohort Summary: {{KEY_STAGE}}

Across {{STUDENT_COUNT}} students in {{KEY_STAGE}}, oracy evidence shows:

**Area of Strength**: {{STRONGEST_STRAND}} strand shows secure development across the cohort.

**Focus Area**: {{FOCUS_STRAND}} strand requires additional curriculum attention.

{{#NOTABLE_PATTERN}}**Notable Pattern**: {{NOTABLE_PATTERN}}{{/NOTABLE_PATTERN}}

This analysis informs curriculum planning and targeted intervention for the next term.`,
    },

    individual_progress: {
        type: 'individual_progress',
        title: 'Individual Progress',
        description: 'Anonymised individual progress narrative',
        placeholders: [
            { key: 'PSEUDONYM', description: 'Anonymised identifier', example: 'Student A', required: true },
            { key: 'CONTEXT', description: 'Relevant context', example: 'EAL student joining mid-year', required: false },
            { key: 'STARTING_POINT', description: 'Initial position', example: 'limited spoken contribution', required: true },
            { key: 'JOURNEY', description: 'Development journey', example: 'through scaffolded talk tasks and peer collaboration', required: true },
            { key: 'CURRENT_POSITION', description: 'Where they are now', example: 'confident contribution in whole-class discussion', required: true },
        ],
        template: `### Individual Progress: {{PSEUDONYM}}

{{#CONTEXT}}**Context**: {{CONTEXT}}{{/CONTEXT}}

**Starting Point**: {{STARTING_POINT}}

**Development Journey**: {{JOURNEY}}

**Current Position**: {{CURRENT_POSITION}}

This case demonstrates the school's commitment to developing oracy for all students, regardless of starting point.`,
    },

    intervention_impact: {
        type: 'intervention_impact',
        title: 'Intervention Impact',
        description: 'Impact of specific oracy intervention',
        placeholders: [
            { key: 'INTERVENTION', description: 'Name of intervention', example: 'Talk for Writing', required: true },
            { key: 'TARGET_GROUP', description: 'Who received intervention', example: 'Year 7 students with below-expected oracy', required: true },
            { key: 'DURATION', description: 'How long', example: '6 weeks', required: true },
            { key: 'PRE_EVIDENCE', description: 'Evidence before', example: '23% showing reasoning markers', required: true },
            { key: 'POST_EVIDENCE', description: 'Evidence after', example: '67% showing reasoning markers', required: true },
        ],
        template: `### Intervention Impact: {{INTERVENTION}}

**Target Group**: {{TARGET_GROUP}}
**Duration**: {{DURATION}}

**Pre-intervention**: {{PRE_EVIDENCE}}
**Post-intervention**: {{POST_EVIDENCE}}

This evidence demonstrates the impact of targeted oracy intervention on student outcomes. The improvement indicates the intervention is effective and should be considered for wider rollout.`,
    },
};

/**
 * Fill template with values
 */
export function fillTemplate(
    templateType: NarrativeTemplateType,
    values: Record<string, string>
): string {
    const template = NARRATIVE_TEMPLATES[templateType];
    let result = template.template;

    // Replace required placeholders
    for (const placeholder of template.placeholders) {
        const value = values[placeholder.key];
        if (value) {
            result = result.replace(new RegExp(`{{${placeholder.key}}}`, 'g'), value);
        } else if (placeholder.required) {
            result = result.replace(new RegExp(`{{${placeholder.key}}}`, 'g'), `[${placeholder.description}]`);
        }
    }

    // Handle conditional sections ({{#KEY}}...{{/KEY}})
    for (const placeholder of template.placeholders) {
        const value = values[placeholder.key];
        const conditionalRegex = new RegExp(`{{#${placeholder.key}}}(.+?){{/${placeholder.key}}}`, 'gs');

        if (value) {
            result = result.replace(conditionalRegex, '$1');
        } else {
            result = result.replace(conditionalRegex, '');
        }
    }

    return result.trim();
}

/**
 * Get all templates for a context
 */
export function getTemplatesForContext(context: 'individual' | 'cohort' | 'intervention'): NarrativeTemplate[] {
    switch (context) {
        case 'individual':
            return [
                NARRATIVE_TEMPLATES.individual_progress,
                NARRATIVE_TEMPLATES.what_improved,
                NARRATIVE_TEMPLATES.evidence_examples,
            ];
        case 'cohort':
            return [
                NARRATIVE_TEMPLATES.cohort_summary,
                NARRATIVE_TEMPLATES.what_improved,
                NARRATIVE_TEMPLATES.why_it_matters,
            ];
        case 'intervention':
            return [
                NARRATIVE_TEMPLATES.intervention_impact,
                NARRATIVE_TEMPLATES.what_improved,
                NARRATIVE_TEMPLATES.evidence_examples,
            ];
    }
}
