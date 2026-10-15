import type { LoanPolicy, SignedCredential } from "@/lib/types";

export function isPolicyEligible(credential: SignedCredential, policy: LoanPolicy, verificationDay: number) {
  const totalObligations = credential.existingMonthlyObligationsPaise + policy.proposedEmiPaise;
  const foirPass = totalObligations * 10_000 <= credential.averageMonthlyInflowPaise * policy.maxFoirBps;
  return (
    credential.averageMonthlyInflowPaise >= policy.minAverageInflowPaise &&
    credential.activeIncomeMonths >= policy.minActiveMonths &&
    foirPass &&
    credential.measurementStartDay <= credential.measurementEndDay &&
    credential.measurementEndDay <= verificationDay &&
    verificationDay <= credential.measurementEndDay + policy.maxCredentialAgeDays &&
    verificationDay <= credential.credentialExpiryDay
  );
}

