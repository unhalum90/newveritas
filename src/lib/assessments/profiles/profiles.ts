/**
 * Baseline Assessment Profiles
 *
 * These profiles define the defaults, visibility, and constraints
 * for different assessment contexts (K-6, 7-12, Higher Ed, etc.)
 */

import type { ProfileConfig, ProfileId } from "./schema";

/**
 * K-6 Formative (Portfolio)
 * Low-stakes portfolio capture for elementary students.
 * Minimal integrity controls, shorter recordings, no follow-ups.
 */
const k6FormativeProfile: ProfileConfig = {
    id: "k6_formative",
    label: "K–6 Formative (Portfolio)",
    description:
        "Low-stakes portfolio capture for elementary students. Minimal integrity controls.",
    gradeRange: "K-6",
    defaults: {
        recording_limit_seconds: 60,
        viewing_timer_seconds: 15,
        allow_grace_restart: true,
        socratic_enabled: false,
        socratic_follow_ups: 0,
        tab_switch_monitor: false,
        shuffle_questions: false,
        pledge_enabled: false,
        pause_threshold_seconds: null,
        default_evidence_upload: "optional",
        citation_requirement: "none",
        is_practice_mode: false,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 4,
    },
    visibility: {
        sections: {
            integrity: "hidden",
            standards: "collapsed",
            evidence_pack: "hidden",
            citations: "hidden",
            blooms_level: "hidden",
            target_language: "hidden",
        },
        fields: {
            pause_threshold: "hidden",
            grace_restart: "hidden",
            deterministic_followups: "hidden",
        },
    },
    constraints: {
        recording_limit_seconds: { min: 30, max: 120 },
        viewing_timer_seconds: { min: 10, max: 30 },
        socratic_follow_ups: { min: 0, max: 1 },
        require_pledge: false,
        require_evidence_pack: false,
        require_followup_types_whitelist: false,
    },
};

/**
 * 7-12 Formative (Capture + Defend)
 * Formative practice with optional follow-ups.
 * Light integrity monitoring.
 */
const formative712Profile: ProfileConfig = {
    id: "712_formative",
    label: "7–12 Formative (Capture + Defend)",
    description:
        "Formative practice with optional follow-ups. Light integrity monitoring.",
    gradeRange: "7-12",
    defaults: {
        recording_limit_seconds: 90,
        viewing_timer_seconds: 20,
        allow_grace_restart: true,
        socratic_enabled: true,
        socratic_follow_ups: 1,
        tab_switch_monitor: false,
        shuffle_questions: true,
        pledge_enabled: false,
        pause_threshold_seconds: null,
        default_evidence_upload: "optional",
        citation_requirement: "none",
        is_practice_mode: false,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5,
    },
    visibility: {
        sections: {
            integrity: "collapsed",
            standards: "expanded",
            evidence_pack: "hidden",
            citations: "hidden",
            blooms_level: "visible",
            target_language: "collapsed",
        },
        fields: {
            pause_threshold: "visible",
            grace_restart: "visible",
            deterministic_followups: "hidden",
        },
    },
    constraints: {
        recording_limit_seconds: { min: 30, max: 180 },
        viewing_timer_seconds: { min: 10, max: 60 },
        socratic_follow_ups: { min: 0, max: 2 },
        require_pledge: false,
        require_evidence_pack: false,
        require_followup_types_whitelist: false,
    },
};

/**
 * 7-12 Summative (Oral Checkpoint)
 * Summative checkpoint with integrity controls and academic pledge.
 */
const summative712Profile: ProfileConfig = {
    id: "712_summative",
    label: "7–12 Summative (Oral Checkpoint)",
    description:
        "Summative checkpoint with integrity controls and academic pledge.",
    gradeRange: "7-12",
    defaults: {
        recording_limit_seconds: 120,
        viewing_timer_seconds: 30,
        allow_grace_restart: false,
        socratic_enabled: true,
        socratic_follow_ups: 1,
        tab_switch_monitor: true,
        shuffle_questions: true,
        pledge_enabled: true,
        pause_threshold_seconds: 2.5,
        default_evidence_upload: "optional",
        citation_requirement: "none",
        is_practice_mode: false,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5,
    },
    visibility: {
        sections: {
            integrity: "expanded",
            standards: "expanded",
            evidence_pack: "hidden",
            citations: "hidden",
            blooms_level: "visible",
            target_language: "collapsed",
        },
        fields: {
            pause_threshold: "visible",
            grace_restart: "visible",
            deterministic_followups: "hidden",
        },
    },
    constraints: {
        recording_limit_seconds: { min: 60, max: 180 },
        viewing_timer_seconds: { min: 15, max: 60 },
        socratic_follow_ups: { min: 0, max: 2 },
        require_pledge: false,
        require_evidence_pack: false,
        require_followup_types_whitelist: false,
    },
};

/**
 * Higher Ed Viva (Summative)
 * One-shot oral exam with strict integrity, deterministic follow-ups,
 * evidence pack, and citations. Most constrained profile.
 */
const higherEdVivaProfile: ProfileConfig = {
    id: "higher_ed_viva",
    label: "Higher Ed Viva (Summative)",
    description:
        "One-shot oral exam with strict integrity, deterministic follow-ups, evidence pack, and citations.",
    gradeRange: "Higher Ed",
    defaults: {
        recording_limit_seconds: 180,
        viewing_timer_seconds: 45,
        allow_grace_restart: false,
        socratic_enabled: true,
        socratic_follow_ups: 2,
        followup_types_whitelist: [
            "clarify",
            "justify",
            "transfer",
            "counterexample",
            "citation_check",
        ],
        tab_switch_monitor: true,
        shuffle_questions: true,
        pledge_enabled: true,
        pause_threshold_seconds: 3.0,
        default_evidence_upload: "required",
        citation_requirement: "required",
        is_practice_mode: false,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 6,
    },
    visibility: {
        sections: {
            integrity: "expanded",
            standards: "hidden",
            evidence_pack: "expanded",
            citations: "visible",
            blooms_level: "hidden",
            target_language: "hidden",
        },
        fields: {
            pause_threshold: "visible",
            grace_restart: "hidden",
            deterministic_followups: "visible",
        },
    },
    constraints: {
        recording_limit_seconds: { min: 120, max: 300 },
        viewing_timer_seconds: { min: 30, max: 90 },
        socratic_follow_ups: { min: 1, max: 2 },
        require_pledge: true,
        require_evidence_pack: true,
        require_followup_types_whitelist: true,
    },
};

/**
 * Language Proficiency
 * World language oral proficiency assessment (ACTFL-style).
 * Focus on target language, lighter controls.
 */
const languageProficiencyProfile: ProfileConfig = {
    id: "language_proficiency",
    label: "Language Proficiency",
    description: "World language oral proficiency assessment (ACTFL-style).",
    gradeRange: "All",
    defaults: {
        recording_limit_seconds: 120,
        viewing_timer_seconds: 20,
        allow_grace_restart: true,
        socratic_enabled: true,
        socratic_follow_ups: 1,
        tab_switch_monitor: false,
        shuffle_questions: false,
        pledge_enabled: false,
        pause_threshold_seconds: null,
        default_evidence_upload: "disabled",
        citation_requirement: "none",
        is_practice_mode: false,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5,
    },
    visibility: {
        sections: {
            integrity: "collapsed",
            standards: "hidden",
            evidence_pack: "hidden",
            citations: "hidden",
            blooms_level: "hidden",
            target_language: "expanded",
        },
        fields: {
            pause_threshold: "hidden",
            grace_restart: "visible",
            deterministic_followups: "hidden",
        },
    },
    constraints: {
        recording_limit_seconds: { min: 60, max: 180 },
        viewing_timer_seconds: { min: 15, max: 45 },
        socratic_follow_ups: { min: 0, max: 2 },
        require_pledge: false,
        require_evidence_pack: false,
        require_followup_types_whitelist: false,
    },
};

/**
 * All available profiles, keyed by ID
 */


/**
 * UK ASSESSMENT PROFILES
 * Explicitly mapped to UK Key Stages and terminology.
 */

/**
 * Primary (KS1-KS2) Portfolio
 * Maps to K-6 Formative.
 */
const ukPrimaryProfile: ProfileConfig = {
    id: "uk_primary_portfolio",
    label: "Primary (KS1-KS2) Portfolio",
    description: "Low-stakes portfolio capture for primary pupils. Minimal integrity controls.",
    gradeRange: "KS1-KS2",
    defaults: {
        ...k6FormativeProfile.defaults,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 4, // Developing, Expected, Strong, Exceptional
    },
    visibility: k6FormativeProfile.visibility,
    constraints: k6FormativeProfile.constraints,
};

/**
 * Secondary (KS3-KS4) Practice
 * Maps to 7-12 Formative.
 */
const ukSecondaryFormativeProfile: ProfileConfig = {
    id: "uk_secondary_practice",
    label: "Secondary (KS3-KS4) Practice",
    description: "Formative oracy practice with optional follow-ups. Light monitoring.",
    gradeRange: "KS3-KS4",
    defaults: {
        ...formative712Profile.defaults,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5,
    },
    visibility: formative712Profile.visibility,
    constraints: formative712Profile.constraints,
};

/**
 * Secondary (KS4) Oral Checkpoint
 * Maps to 7-12 Summative.
 */
const ukSecondarySummativeProfile: ProfileConfig = {
    id: "uk_secondary_checkpoint",
    label: "Secondary (KS4) Oral Checkpoint",
    description: "Summative checkpoint (e.g., GCSE Spoken Language) with integrity controls.",
    gradeRange: "KS4",
    defaults: {
        ...summative712Profile.defaults,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5, // Pass, Merit, Distinction etc mapped later
    },
    visibility: summative712Profile.visibility,
    constraints: summative712Profile.constraints,
};

/**
 * Sixth Form (KS5) Viva
 * Maps to Higher Ed Viva.
 */
const ukSixthFormProfile: ProfileConfig = {
    id: "uk_sixth_form_viva",
    label: "Sixth Form (KS5) Viva",
    description: "One-shot oral exam with strict integrity and academic pledge.",
    gradeRange: "KS5",
    defaults: {
        ...higherEdVivaProfile.defaults,
        default_rubric_scale_min: 1,
        default_rubric_scale_max: 5,
    },
    visibility: higherEdVivaProfile.visibility,
    constraints: higherEdVivaProfile.constraints,
};

/**
 * UK Profile List
 */
export const UK_PROFILE_LIST: ProfileConfig[] = [
    ukPrimaryProfile,
    ukSecondaryFormativeProfile,
    ukSecondarySummativeProfile,
    ukSixthFormProfile,
    languageProficiencyProfile, // Shared global profile
];

/**
 * All available profiles, keyed by ID
 */
export const PROFILES: Record<ProfileId, ProfileConfig> = {
    k6_formative: k6FormativeProfile,
    "712_formative": formative712Profile,
    "712_summative": summative712Profile,
    higher_ed_viva: higherEdVivaProfile,
    language_proficiency: languageProficiencyProfile,
    uk_primary_portfolio: ukPrimaryProfile,
    uk_secondary_practice: ukSecondaryFormativeProfile,
    uk_secondary_checkpoint: ukSecondarySummativeProfile,
    uk_sixth_form_viva: ukSixthFormProfile,
};

/**
 * Ordered list for UI display
 */
export const PROFILE_LIST: ProfileConfig[] = [
    k6FormativeProfile,
    formative712Profile,
    summative712Profile,
    higherEdVivaProfile,
    languageProficiencyProfile,
];

/**
 * Get profile by ID, returns undefined if not found
 */
export function getProfile(id: ProfileId | string | null): ProfileConfig | undefined {
    if (!id) return undefined;
    return PROFILES[id as ProfileId];
}

/**
 * Check if a value is a valid profile ID
 */
export function isValidProfileId(id: unknown): id is ProfileId {
    return (
        typeof id === "string" &&
        id in PROFILES
    );
}
