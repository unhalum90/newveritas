/**
 * Assessment Profiles Module
 *
 * Provides profile-based configuration for the assessment builder.
 */

// Types
export type {
    ProfileId,
    ProfileConfig,
    ProfileDefaults,
    ProfileVisibility,
    ProfileConstraints,
    ProfileControlledFields,
    SectionVisibility,
    FieldVisibility,
    EvidenceUpload,
    CitationRequirement,
    FollowupType,
} from "./schema";

// Profiles
export { PROFILES, PROFILE_LIST, getProfile, isValidProfileId } from "./profiles";

// Application logic
export {
    applyProfile,
    detectOverrides,
    validateAgainstConstraints,
    type BuilderState,
    type ApplyProfileResult,
} from "./apply-profile";

// Visibility
export {
    useProfileVisibility,
    getProfileVisibility,
    type VisibilityHelpers,
} from "./use-profile-visibility";
