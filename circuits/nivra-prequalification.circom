pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template NivraPrequalification(depth) {
    // Public trust and replay-binding inputs.
    signal input issuerAx;
    signal input issuerAy;
    signal input issuerKeyVersion;
    signal input policyHash;
    signal input circuitVersion;
    signal input revocationRoot;
    signal input revocationEpoch;
    signal input challenge;
    signal input verifierDomain;
    signal input verificationDay;
    signal input proofExpiryDay;

    // Private credential witness.
    signal input holderSecret;
    signal input holderCommitment;
    signal input averageMonthlyInflowPaise;
    signal input existingMonthlyObligationsPaise;
    signal input activeIncomeMonths;
    signal input measurementStartDay;
    signal input measurementEndDay;
    signal input credentialExpiryDay;
    signal input credentialId;
    signal input signatureR8x;
    signal input signatureR8y;
    signal input signatureS;

    // Private policy witness, committed by policyHash.
    signal input lenderField;
    signal input policyVersion;
    signal input minAverageInflowPaise;
    signal input minActiveMonths;
    signal input maxFoirBps;
    signal input proposedEmiPaise;
    signal input maxCredentialAgeDays;

    // Sparse Merkle non-revocation witness.
    signal input revocationSiblings[depth];

    signal output qualified;

    component secretHash = Poseidon(1);
    secretHash.inputs[0] <== holderSecret;
    secretHash.out === holderCommitment;

    component credentialPartA = Poseidon(6);
    credentialPartA.inputs[0] <== holderCommitment;
    credentialPartA.inputs[1] <== averageMonthlyInflowPaise;
    credentialPartA.inputs[2] <== existingMonthlyObligationsPaise;
    credentialPartA.inputs[3] <== activeIncomeMonths;
    credentialPartA.inputs[4] <== measurementStartDay;
    credentialPartA.inputs[5] <== measurementEndDay;

    component credentialPartB = Poseidon(4);
    credentialPartB.inputs[0] <== credentialExpiryDay;
    credentialPartB.inputs[1] <== credentialId;
    credentialPartB.inputs[2] <== issuerKeyVersion;
    credentialPartB.inputs[3] <== revocationEpoch;

    component credentialMessage = Poseidon(2);
    credentialMessage.inputs[0] <== credentialPartA.out;
    credentialMessage.inputs[1] <== credentialPartB.out;

    component signatureVerifier = EdDSAPoseidonVerifier();
    signatureVerifier.enabled <== 1;
    signatureVerifier.Ax <== issuerAx;
    signatureVerifier.Ay <== issuerAy;
    signatureVerifier.R8x <== signatureR8x;
    signatureVerifier.R8y <== signatureR8y;
    signatureVerifier.S <== signatureS;
    signatureVerifier.M <== credentialMessage.out;

    component computedPolicyHash = Poseidon(7);
    computedPolicyHash.inputs[0] <== lenderField;
    computedPolicyHash.inputs[1] <== policyVersion;
    computedPolicyHash.inputs[2] <== minAverageInflowPaise;
    computedPolicyHash.inputs[3] <== minActiveMonths;
    computedPolicyHash.inputs[4] <== maxFoirBps;
    computedPolicyHash.inputs[5] <== proposedEmiPaise;
    computedPolicyHash.inputs[6] <== maxCredentialAgeDays;
    computedPolicyHash.out === policyHash;
    lenderField === verifierDomain;
    circuitVersion === 1;

    // Explicit unsigned ranges: money and identifiers are 64-bit.
    component inflowBits = Num2Bits(64);
    component obligationsBits = Num2Bits(64);
    component emiBits = Num2Bits(64);
    component credentialIdBits = Num2Bits(64);
    component activeMonthsBits = Num2Bits(8);
    component minMonthsBits = Num2Bits(8);
    component maxFoirBits = Num2Bits(16);
    component datesBits[6];
    inflowBits.in <== averageMonthlyInflowPaise;
    obligationsBits.in <== existingMonthlyObligationsPaise;
    emiBits.in <== proposedEmiPaise;
    credentialIdBits.in <== credentialId;
    activeMonthsBits.in <== activeIncomeMonths;
    minMonthsBits.in <== minActiveMonths;
    maxFoirBits.in <== maxFoirBps;
    datesBits[0] = Num2Bits(32); datesBits[0].in <== measurementStartDay;
    datesBits[1] = Num2Bits(32); datesBits[1].in <== measurementEndDay;
    datesBits[2] = Num2Bits(32); datesBits[2].in <== credentialExpiryDay;
    datesBits[3] = Num2Bits(32); datesBits[3].in <== verificationDay;
    datesBits[4] = Num2Bits(32); datesBits[4].in <== proofExpiryDay;
    datesBits[5] = Num2Bits(32); datesBits[5].in <== maxCredentialAgeDays;

    component enoughInflow = GreaterEqThan(64);
    enoughInflow.in[0] <== averageMonthlyInflowPaise;
    enoughInflow.in[1] <== minAverageInflowPaise;

    component enoughMonths = GreaterEqThan(8);
    enoughMonths.in[0] <== activeIncomeMonths;
    enoughMonths.in[1] <== minActiveMonths;

    component foirWithinLimit = LessEqThan(96);
    foirWithinLimit.in[0] <== (existingMonthlyObligationsPaise + proposedEmiPaise) * 10000;
    foirWithinLimit.in[1] <== averageMonthlyInflowPaise * maxFoirBps;

    component periodOrdered = LessEqThan(32);
    periodOrdered.in[0] <== measurementStartDay;
    periodOrdered.in[1] <== measurementEndDay;

    component measuredBeforeVerification = LessEqThan(32);
    measuredBeforeVerification.in[0] <== measurementEndDay;
    measuredBeforeVerification.in[1] <== verificationDay;

    component freshEnough = LessEqThan(32);
    freshEnough.in[0] <== verificationDay;
    freshEnough.in[1] <== measurementEndDay + maxCredentialAgeDays;

    component unexpiredCredential = LessEqThan(32);
    unexpiredCredential.in[0] <== verificationDay;
    unexpiredCredential.in[1] <== credentialExpiryDay;

    component proofNotExpired = LessEqThan(32);
    proofNotExpired.in[0] <== verificationDay;
    proofNotExpired.in[1] <== proofExpiryDay;

    component shortProofLifetime = LessEqThan(32);
    shortProofLifetime.in[0] <== proofExpiryDay;
    shortProofLifetime.in[1] <== verificationDay + 1;

    // An all-zero leaf means this credential slot is not revoked.
    signal currentHashes[depth + 1];
    currentHashes[0] <== 0;
    component pathHashes[depth];
    signal left[depth];
    signal right[depth];
    for (var i = 0; i < depth; i++) {
        left[i] <== currentHashes[i] + credentialIdBits.out[i] * (revocationSiblings[i] - currentHashes[i]);
        right[i] <== revocationSiblings[i] + credentialIdBits.out[i] * (currentHashes[i] - revocationSiblings[i]);
        pathHashes[i] = Poseidon(2);
        pathHashes[i].inputs[0] <== left[i];
        pathHashes[i].inputs[1] <== right[i];
        currentHashes[i + 1] <== pathHashes[i].out;
    }
    currentHashes[depth] === revocationRoot;

    enoughInflow.out === 1;
    enoughMonths.out === 1;
    foirWithinLimit.out === 1;
    periodOrdered.out === 1;
    measuredBeforeVerification.out === 1;
    freshEnough.out === 1;
    unexpiredCredential.out === 1;
    proofNotExpired.out === 1;
    shortProofLifetime.out === 1;
    qualified <== 1;

    // Challenge is a public Groth16 input. This harmless constraint prevents
    // optimization from removing it while binding every proof to one request.
    challenge * 1 === challenge;
}

component main { public [issuerAx, issuerAy, issuerKeyVersion, policyHash, circuitVersion, revocationRoot, revocationEpoch, challenge, verifierDomain, verificationDay, proofExpiryDay] } = NivraPrequalification(8);

