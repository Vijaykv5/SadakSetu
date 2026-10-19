export const EVIDENCE_ACCESS_WINDOW_MS = 5 * 60 * 1_000;

export function evidenceAccessMessage(capsuleId: string, commitment: string, requestedAt: number) {
  return [
    "SadakSetu restricted evidence access",
    `Capsule: ${capsuleId}`,
    `Commitment: ${commitment}`,
    `Requested at: ${requestedAt}`,
  ].join("\n");
}
