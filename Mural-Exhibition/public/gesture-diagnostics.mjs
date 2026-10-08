import {INTERACTION_CONFIG as c} from './interaction-config.mjs';
const rate=a=>a.length?1000/(a.reduce((s,v)=>s+v,0)/a.length):0;
const q=(a,p)=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)]:null;
export function poseFreshnessBudget(metrics={}) {
 if((metrics.samples||0)<8)return c.poseMaxAgeMs;
 return Math.min(c.poseFreshnessCapMs,Math.max(c.poseMaxAgeMs,(metrics.latencyP95Ms||0)+(metrics.intervalP95Ms||0)+c.poseTimingMarginMs));
}
export class GestureDiagnostics {
 constructor(){this.input=[];this.hands=[];this.durations=[];this.lastInput=null;this.lastCallback=null;this.rawHands=0;this.freshHands=0;this.validLandmarks=false;this.filteredReason=null;this.poseInvalidSince=null;this.poseChecks=0;this.poseStale=0;this.states=[];}
 resetTiming(){this.input=[];this.hands=[];this.durations=[];this.lastInput=null;this.lastCallback=null;this.poseInvalidSince=null;this.poseChecks=0;this.poseStale=0;}
 capture(at){if(this.lastInput!==null)this.input.push(at-this.lastInput);this.input=this.input.slice(-120);this.lastInput=at;}
 callback(raw,at,capturedAt,fresh){if(this.lastCallback!==null)this.hands.push(at-this.lastCallback);this.hands=this.hands.slice(-120);this.lastCallback=at;this.durations.push(at-capturedAt);this.durations=this.durations.slice(-120);this.rawHands=raw.length;this.freshHands=fresh?raw.length:0;this.validLandmarks=raw.every(h=>h?.length===21&&h.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));this.filteredReason=!fresh?'HANDS_STALE':!this.validLandmarks?'INVALID_HAND':null;this.handsCapturedAt=capturedAt;}
 pose(fresh,now,observable=fresh){this.poseChecks++;if(!fresh)this.poseStale++;if(!fresh||!observable)this.poseInvalidSince??=now;else this.poseInvalidSince=null;}
 transition(state,now){if(this.states.at(-1)?.state!==state){this.states.push({state,at:now});this.states=this.states.slice(-80);}}
 snapshot(now){return {inputFps:this.lastInput!==null&&now-this.lastInput<500?rate(this.input):0,handsFps:this.lastCallback!==null&&now-this.lastCallback<500?rate(this.hands):0,inputCapturedAt:this.lastInput,inputIntervalP50Ms:q(this.input,.5),inputIntervalP95Ms:q(this.input,.95),handsCapturedAt:this.handsCapturedAt,handsReceivedAt:this.lastCallback,handsIntervalP95Ms:q(this.hands,.95),handsLatencyP50Ms:q(this.durations,.5),handsLatencyP95Ms:q(this.durations,.95),rawHands:this.rawHands,freshHands:this.freshHands,filteredHands:this.rawHands-this.freshHands,validLandmarks:this.validLandmarks,filteredReason:this.filteredReason,poseStaleRatio:this.poseChecks?this.poseStale/this.poseChecks:0,noValidPoseMs:this.poseInvalidSince===null?0:now-this.poseInvalidSince,states:this.states};}
}
