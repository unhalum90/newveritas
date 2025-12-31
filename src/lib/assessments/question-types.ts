export const EVIDENCE_FOLLOWUP_TYPE = "evidence_followup";
export const ARTIFACT_FOLLOWUP_TYPE = "artifact_followup";
export const AUDIO_FOLLOWUP_TYPE = "audio_followup";

export function isEvidenceFollowup(type?: string | null) {
  return type === EVIDENCE_FOLLOWUP_TYPE || type === ARTIFACT_FOLLOWUP_TYPE;
}

export function isAudioFollowup(type?: string | null) {
  return type === AUDIO_FOLLOWUP_TYPE;
}
