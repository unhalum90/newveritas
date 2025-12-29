export const EVIDENCE_FOLLOWUP_TYPE = "evidence_followup";

export function isEvidenceFollowup(type?: string | null) {
  return type === EVIDENCE_FOLLOWUP_TYPE;
}
