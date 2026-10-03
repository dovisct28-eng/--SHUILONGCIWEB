// Display cameras only. No model transforms, mirroring or surveyed dimensions.
export const CAMERA_CANDIDATES = Object.freeze({
  A: {phi:.24,theta:0,distance:13.5},
  B: {phi:.36,theta:0,distance:12.8},
  C: {phi:.30,theta:-.10,distance:13.1},
});
export function createA01Camera(T,camera,candidate='C') {
  const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
  const focus=new T.Vector3(),nearTarget=new T.Vector3(0,4.5,-12);
  return {
    setCandidate(value){if(!CAMERA_CANDIDATES[value])throw Error('Unknown camera');candidate=value;},
    apply(theta,phi,distance,target,weight,line){
      const choice=CAMERA_CANDIDATES[candidate],narrow=smooth((1.5-camera.aspect)/.25);
      const near=weight*(1-smooth(((line?.progress??1)-.04)/.16))*(line?.depth===0?0:1);
      const angle=phi+choice.phi*weight,azimuth=theta+choice.theta*weight;
      let radius=distance-(choice.distance-11*narrow)*weight;
      radius+=(10.5+4*narrow-radius)*near;
      focus.copy(target);focus.y-=1.25*weight;focus.lerp(nearTarget,near);
      camera.position.set(focus.x+radius*Math.sin(angle)*Math.sin(azimuth),focus.y+radius*Math.cos(angle),focus.z+radius*Math.sin(angle)*Math.cos(azimuth));
      camera.lookAt(focus);return focus;
    },
    get candidate(){return candidate;},
  };
}
