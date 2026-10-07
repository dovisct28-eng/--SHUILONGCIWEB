// Direction is deliberately absent: every accepted single-hand stroke means NEXT.
// Rearming does not reset the cooldown; a held-open stroke cannot repeat.
export class NextGestureGate {
 constructor(cooldown=1000) { this.cooldown=cooldown;this.armed=true;this.lastTrigger=-Infinity; }
 ready(now) { return this.armed && now-this.lastTrigger>this.cooldown; }
 trigger(now) { if(!this.ready(now))return false;this.armed=false;this.lastTrigger=now;return true; }
 rearm() { this.armed=true; }
}
