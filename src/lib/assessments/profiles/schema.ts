/**
 * Assessment Profile Schema
 *
 * Defines the structure of assessment profiles that control:
 * - Defaults: Auto-populated settings when profile is selected
 * - Visibility: Which sections/fields are shown/hidden in the builder
 * - Constraints: Validation rules for the profile
 */

export type ProfileId =
    | "k6_formative"
    | "712_formative"
    | "712_summative"
    | "higher_ed_viva"
    | "language_proficiency";

export type SectionVisibility = "hidden" | "visible" | "collapsed" | "expanded";
export type FieldVisibility = "hidden" | "visible";
export type EvidenceUpload = "disabled" | "optional" | "required";
export type CitationRequirement = "none" | "optional" | "required";

/**
 * Follow-up types for deterministic follow-up generation (Higher Ed)
 */
export type FollowupType =
    | "clarify"
    | "justify"
    | "transfer"
    | "counterexample"
    | "citation_check";

/**
 * Default values applied when a profile is selected
 */
export type ProfileDefaults = {
    // Timing
    recording_limit_seconds: number;
    viewing_timer_seconds: number;

    // Attempts
    allow_grace_restart: boolean;

    // Follow-ups
    socratic_enabled: boolean;
    socratic_follow_ups: number;
    followup_types_whitelist?: FollowupType[];

    // Integrity
    tab_switch_monitor: boolean;
    shuffle_questions: boolean;
    pledge_enabled: boolean;
    pause_threshold_seconds: number | null;

    // Evidence
    default_evidence_upload: EvidenceUpload;
    citation_requirement: CitationRequirement;

    // Mode
    is_practice_mode: boolean;

    // Rubric
    default_rubric_scale_min: number;
    default_rubric_scale_max: number;
};

/**
 * Visibility rules for builder panels/fields
 */
export type ProfileVisibility = {
    sections: {
        integrity: SectionVisibility;
        standards: SectionVisibility;
        evidence_pack: SectionVisibility;
        citations: SectionVisibility;
        blooms_level: SectionVisibility;
        target_language: SectionVisibility;
    };
    fields: {
        pause_threshold: FieldVisibility;
        grace_restart: FieldVisibility;
        deterministic_followups: FieldVisibility;
    };
};

/**
 * Constraints that prevent invalid configurations
 */
export type ProfileConstraints = {
    recording_limit_seconds: { min: number; max: number };
    viewing_timer_seconds: { min: number; max: number };
    socratic_follow_ups: { min: number; max: number };
    require_pledge: boolean;
    require_evidence_pack: boolean;
    require_followup_types_whitelist: boolean;
};

/**
 * Complete profile configuration
 */
export type ProfileConfig = {
    id: ProfileId;
    label: string;
    description: string;
    gradeRange: string;
    defaults: ProfileDefaults;
    visibility: ProfileVisibility;
    constraints: ProfileConstraints;
};

/**
 * Assessment fields that can be controlled by profiles
 */
export type ProfileControlledFields = {
    assessment_profile: ProfileId | null;
    profile_modified: boolean;
    profile_version: number;
    profile_override_keys: string[];
    recording_limit_seconds: number;
    viewing_timer_seconds: number;
    socratic_enabled: boolean;
    socratic_follow_ups: number;
    tab_switch_monitor: boolean;
    shuffle_questions: boolean;
    pledge_enabled: boolean;
    pause_threshold_seconds: number | null;
    allow_grace_restart: boolean;
    is_practice_mode: boolean;
};
