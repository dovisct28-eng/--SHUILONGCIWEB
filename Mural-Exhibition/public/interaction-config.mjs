// Exhibition calibration starting points, not physical-camera acceptance values.
// Pose/Hands use raw coordinates; OperatorTracker mirrors palm x exactly once.
export const INTERACTION_CONFIG = Object.freeze({
 primaryZone:Object.freeze({left:.25,right:.75,top:.12,bottom:.90}),
 gestureZone:Object.freeze({left:.08,right:.92,top:.18,bottom:.80}),
 operatorAcquireMs:800, operatorLossGraceMs:1000, poseMaxAgeMs:220,
 poseIntervalMs:80, poseMaxPeople:4, landmarkConfidence:.55,
 minShoulderWidth:.08, personMatchDistance:.65, personMatchAmbiguity:.18,
 personMinScaleRatio:.65, personMaxScaleRatio:1.55, personScaleCostWeight:.25,
 bodySizeReference:.4, candidateWeights:Object.freeze({center:.6,size:.12,visibility:.18,stability:.1}),
 handAssignmentMaxDistance:.55, handAssignmentAmbiguity:.18,
 handAssignmentGraceMs:200, handMaxJump:.8, recentTwoHandMs:220,
 // Shoulder-relative upper-body envelope; physical calibration remains pending.
 handEnvelopeHalfWidth:1.35, handEnvelopeAbove:1.1, handEnvelopeBelow:1.6,
 handPersonAmbiguity:.25, handSideAmbiguity:.18, handFallbackContinuity:.45,
 twoHandNeutralMax:.25, twoHandOpenThreshold:.38, twoHandOpenHoldMs:400,
 twoHandCloseThreshold:.16, twoHandCloseHoldMs:300,
 twoHandMinTravel:.10, twoHandTrendTolerance:.035, twoHandActionMaxMs:2400,
 twoHandNeutralHoldMs:120, nextTwoHandConfirmMs:120,
 releaseOutsideMs:300, releaseAbsentMs:300, releaseSingleMs:500,
 imageAspect:320/240
 ,controlHandAcquireMs:350, controlHandLossGraceMs:650, controlHandRearmMs:250,
 dwellMs:1000, dwellReleaseMs:250, trackingPauseMs:200, dwellMaxStepMs:120,
 pointerTauMs:75, pointerFastTauMs:28, pointerFastSpeed:.35,
 pointerStableSpeed:.65, pointerSettleMs:140, pointerJump:.24,
 pointerInput:Object.freeze({left:.2,right:.8,top:.2,bottom:.8}),
 targetWidth:128, targetHeight:76, targetY:.61, targetLeft:.13, targetRight:.87,
 readingDeadzone:.08, readingMaxSpeed:420, readingScrollMaxStepMs:200,
 readingTransitionMs:750
});
