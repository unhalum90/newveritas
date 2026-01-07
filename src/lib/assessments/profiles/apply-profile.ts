/**
 * Profile Application Logic
 *
 * Functions for applying profiles to builder state, detecting overrides,
 * and managing profile-based configuration.
 */

import type {
    ProfileConfig,
    ProfileConstraints,
    ProfileControlledFields,
    ProfileDefaults,
    ProfileId,
    ProfileVisibility,
} from "./schema";
import { getProfile, PROFILES } from "./profiles";

/**
 * Partial builder state that can be modified by profiles
 */
export type BuilderState = Partial<ProfileControlledFields> & {
    // Integrity fields (may be nested in assessment_integrity)
    pause_threshold_seconds?: number | null;
    tab_switch_monitor?: boolean;
    shuffle_questions?: boolean;
    pledge_enabled?: boolean;
    pledge_version?: number;
    pledge_text?: string | null;
    recording_limit_seconds?: number;
    viewing_timer_seconds?: number;
    allow_grace_restart?: boolean;
    // Assessment fields
    socratic_enabled?: boolean;
    socratic_follow_ups?: number;
    is_practice_mode?: boolean;
};

/**
 * Result of applying a profile
 */
export type ApplyProfileResult = {
    newState: BuilderState;
    visibility: ProfileVisibility;
    constraints: ProfileConstraints;
    appliedDefaults: (keyof ProfileDefaults)[];
};

/**
 * Apply a profile to builder state.
 *
 * @param profileId - The profile to apply
 * @param currentState - Current builder state
 * @param options - Options for application
 * @returns New state with profile applied, visibility model, and constraints
 */
export function applyProfile(
    profileId: ProfileId,
    currentState: BuilderState,
    options: {
        /** If true, reset all fields to defaults even if already set */
        resetToDefaults?: boolean;
        /** If true, only apply to unset (undefined) fields */
        onlyUnset?: boolean;
    } = {}
): ApplyProfileResult {
    const { resetToDefaults = false, onlyUnset = true } = options;
    const profile = getProfile(profileId);

    if (!profile) {
        // Return current state unchanged if profile not found
        return {
            newState: { ...currentState, assessment_profile: profileId },
            visibility: getDefaultVisibility(),
            constraints: getDefaultConstraints(),
            appliedDefaults: [],
        };
    }

    const newState: BuilderState = {
        ...currentState,
        assessment_profile: profileId,
        profile_modified: false,
        profile_version: 1,
        profile_override_keys: [],
    };

    const appliedDefaults: (keyof ProfileDefaults)[] = [];

    // Apply each default
    const defaults = profile.defaults;

    if (shouldApply("recording_limit_seconds", currentState, resetToDefaults, onlyUnset)) {
        newState.recording_limit_seconds = defaults.recording_limit_seconds;
        appliedDefaults.push("recording_limit_seconds");
    }

    if (shouldApply("viewing_timer_seconds", currentState, resetToDefaults, onlyUnset)) {
        newState.viewing_timer_seconds = defaults.viewing_timer_seconds;
        appliedDefaults.push("viewing_timer_seconds");
    }

    if (shouldApply("allow_grace_restart", currentState, resetToDefaults, onlyUnset)) {
        newState.allow_grace_restart = defaults.allow_grace_restart;
        appliedDefaults.push("allow_grace_restart");
    }

    if (shouldApply("socratic_enabled", currentState, resetToDefaults, onlyUnset)) {
        newState.socratic_enabled = defaults.socratic_enabled;
        appliedDefaults.push("socratic_enabled");
    }

    if (shouldApply("socratic_follow_ups", currentState, resetToDefaults, onlyUnset)) {
        newState.socratic_follow_ups = defaults.socratic_follow_ups;
        appliedDefaults.push("socratic_follow_ups");
    }

    if (shouldApply("tab_switch_monitor", currentState, resetToDefaults, onlyUnset)) {
        newState.tab_switch_monitor = defaults.tab_switch_monitor;
        appliedDefaults.push("tab_switch_monitor");
    }

    if (shouldApply("shuffle_questions", currentState, resetToDefaults, onlyUnset)) {
        newState.shuffle_questions = defaults.shuffle_questions;
        appliedDefaults.push("shuffle_questions");
    }

    if (shouldApply("pledge_enabled", currentState, resetToDefaults, onlyUnset)) {
        newState.pledge_enabled = defaults.pledge_enabled;
        appliedDefaults.push("pledge_enabled");
    }

    if (shouldApply("pause_threshold_seconds", currentState, resetToDefaults, onlyUnset)) {
        newState.pause_threshold_seconds = defaults.pause_threshold_seconds;
        appliedDefaults.push("pause_threshold_seconds");
    }

    if (shouldApply("is_practice_mode", currentState, resetToDefaults, onlyUnset)) {
        newState.is_practice_mode = defaults.is_practice_mode;
        appliedDefaults.push("is_practice_mode");
    }

    return {
        newState,
        visibility: profile.visibility,
        constraints: profile.constraints,
        appliedDefaults,
    };
}

/**
 * Detect which fields deviate from profile defaults
 */
export function detectOverrides(
    profileId: ProfileId | null,
    currentState: BuilderState
): string[] {
    if (!profileId) return [];

    const profile = getProfile(profileId);
    if (!profile) return [];

    const overrides: string[] = [];
    const defaults = profile.defaults;

    if (currentState.recording_limit_seconds !== undefined &&
        currentState.recording_limit_seconds !== defaults.recording_limit_seconds) {
        overrides.push("recording_limit_seconds");
    }

    if (currentState.viewing_timer_seconds !== undefined &&
        currentState.viewing_timer_seconds !== defaults.viewing_timer_seconds) {
        overrides.push("viewing_timer_seconds");
    }

    if (currentState.allow_grace_restart !== undefined &&
        currentState.allow_grace_restart !== defaults.allow_grace_restart) {
        overrides.push("allow_grace_restart");
    }

    if (currentState.socratic_enabled !== undefined &&
        currentState.socratic_enabled !== defaults.socratic_enabled) {
        overrides.push("socratic_enabled");
    }

    if (currentState.socratic_follow_ups !== undefined &&
        currentState.socratic_follow_ups !== defaults.socratic_follow_ups) {
        overrides.push("socratic_follow_ups");
    }

    if (currentState.tab_switch_monitor !== undefined &&
        currentState.tab_switch_monitor !== defaults.tab_switch_monitor) {
        overrides.push("tab_switch_monitor");
    }

    if (currentState.shuffle_questions !== undefined &&
        currentState.shuffle_questions !== defaults.shuffle_questions) {
        overrides.push("shuffle_questions");
    }

    if (currentState.pledge_enabled !== undefined &&
        currentState.pledge_enabled !== defaults.pledge_enabled) {
        overrides.push("pledge_enabled");
    }

    if (currentState.pause_threshold_seconds !== undefined &&
        currentState.pause_threshold_seconds !== defaults.pause_threshold_seconds) {
        overrides.push("pause_threshold_seconds");
    }

    if (currentState.is_practice_mode !== undefined &&
        currentState.is_practice_mode !== defaults.is_practice_mode) {
        overrides.push("is_practice_mode");
    }

    return overrides;
}

/**
 * Validate current state against profile constraints
 */
export function validateAgainstConstraints(
    profileId: ProfileId | null,
    state: BuilderState
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    if (!profileId) return { valid: true, errors: [] };

    const profile = getProfile(profileId);
    if (!profile) return { valid: true, errors: [] };

    const errors: Array<{ field: string; message: string }> = [];
    const { constraints } = profile;

    // Recording limit
    const recordingLimit = state.recording_limit_seconds ?? 60;
    if (recordingLimit < constraints.recording_limit_seconds.min ||
        recordingLimit > constraints.recording_limit_seconds.max) {
        errors.push({
            field: "recording_limit_seconds",
            message: `Recording limit must be between ${constraints.recording_limit_seconds.min}s and ${constraints.recording_limit_seconds.max}s for ${profile.label}`,
        });
    }

    // Viewing timer
    const viewingTimer = state.viewing_timer_seconds ?? 20;
    if (viewingTimer < constraints.viewing_timer_seconds.min ||
        viewingTimer > constraints.viewing_timer_seconds.max) {
        errors.push({
            field: "viewing_timer_seconds",
            message: `Viewing timer must be between ${constraints.viewing_timer_seconds.min}s and ${constraints.viewing_timer_seconds.max}s for ${profile.label}`,
        });
    }

    // Follow-ups
    const followUps = state.socratic_follow_ups ?? 0;
    if (followUps < constraints.socratic_follow_ups.min ||
        followUps > constraints.socratic_follow_ups.max) {
        errors.push({
            field: "socratic_follow_ups",
            message: `Follow-ups must be between ${constraints.socratic_follow_ups.min} and ${constraints.socratic_follow_ups.max} for ${profile.label}`,
        });
    }

    // Required pledge
    if (constraints.require_pledge && !state.pledge_enabled) {
        errors.push({
            field: "pledge_enabled",
            message: `Academic integrity pledge is required for ${profile.label}`,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Helper functions

function shouldApply(
    field: string,
    currentState: BuilderState,
    resetToDefaults: boolean,
    onlyUnset: boolean
): boolean {
    if (resetToDefaults) return true;
    if (!onlyUnset) return true;
    return (currentState as Record<string, unknown>)[field] === undefined;
}

function getDefaultVisibility(): ProfileVisibility {
    return {
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
    };
}

function getDefaultConstraints(): ProfileConstraints {
    return {
        recording_limit_seconds: { min: 30, max: 300 },
        viewing_timer_seconds: { min: 10, max: 120 },
        socratic_follow_ups: { min: 0, max: 2 },
        require_pledge: false,
        require_evidence_pack: false,
        require_followup_types_whitelist: false,
    };
}
