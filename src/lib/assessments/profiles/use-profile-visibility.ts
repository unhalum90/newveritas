/**
 * Profile Visibility Hook
 *
 * Provides visibility rules for builder sections and fields based on the selected profile.
 * Used by the wizard to show/hide/collapse sections dynamically.
 */

import { useMemo } from "react";
import type { ProfileId, ProfileVisibility, SectionVisibility, FieldVisibility } from "./schema";
import { getProfile } from "./profiles";

/**
 * Default visibility when no profile is selected (show everything)
 */
const DEFAULT_VISIBILITY: ProfileVisibility = {
    sections: {
        integrity: "expanded",
        standards: "expanded",
        evidence_pack: "collapsed",
        citations: "collapsed",
        blooms_level: "visible",
        target_language: "collapsed",
    },
    fields: {
        pause_threshold: "visible",
        grace_restart: "visible",
        deterministic_followups: "hidden",
    },
};

export type VisibilityHelpers = {
    /** Raw visibility config */
    visibility: ProfileVisibility;

    /** Check if a section should be shown (not hidden) */
    showSection: (section: keyof ProfileVisibility["sections"]) => boolean;

    /** Check if a section should be expanded by default */
    isExpanded: (section: keyof ProfileVisibility["sections"]) => boolean;

    /** Check if a section should be collapsed by default */
    isCollapsed: (section: keyof ProfileVisibility["sections"]) => boolean;

    /** Check if a field should be shown */
    showField: (field: keyof ProfileVisibility["fields"]) => boolean;

    /** Get the visibility state for a section */
    getSectionVisibility: (section: keyof ProfileVisibility["sections"]) => SectionVisibility;

    /** Get the visibility state for a field */
    getFieldVisibility: (field: keyof ProfileVisibility["fields"]) => FieldVisibility;
};

/**
 * Hook that provides visibility helpers based on the selected profile.
 *
 * @param profileId - The currently selected profile ID (or null)
 * @returns Visibility helpers for conditional rendering
 */
export function useProfileVisibility(profileId: ProfileId | string | null): VisibilityHelpers {
    return useMemo(() => {
        const profile = profileId ? getProfile(profileId) : null;
        const visibility = profile?.visibility ?? DEFAULT_VISIBILITY;

        return {
            visibility,

            showSection: (section) => {
                const state = visibility.sections[section];
                return state !== "hidden";
            },

            isExpanded: (section) => {
                const state = visibility.sections[section];
                return state === "expanded";
            },

            isCollapsed: (section) => {
                const state = visibility.sections[section];
                return state === "collapsed";
            },

            showField: (field) => {
                const state = visibility.fields[field];
                return state === "visible";
            },

            getSectionVisibility: (section) => {
                return visibility.sections[section];
            },

            getFieldVisibility: (field) => {
                return visibility.fields[field];
            },
        };
    }, [profileId]);
}

/**
 * Non-hook version for use outside of React components
 */
export function getProfileVisibility(profileId: ProfileId | string | null): ProfileVisibility {
    const profile = profileId ? getProfile(profileId) : null;
    return profile?.visibility ?? DEFAULT_VISIBILITY;
}
