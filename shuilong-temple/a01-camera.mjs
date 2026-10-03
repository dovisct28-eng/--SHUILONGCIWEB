// Display cameras only. No model transforms, mirroring or surveyed dimensions.
export const CAMERA_CANDIDATES = Object.freeze({
  A: {phi:.24,theta:0,distance:13.5},
  B: {phi:.36,theta:0,distance:12.8},
  C: {phi:.35,theta:-.16,distance:14},
});
export function createA01Camera(T,camera,candidate='C') {
  const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
  const positions=new T.CatmullRomCurve3([[-3.7,4.35,-8.7],[-5,4.6,-7.4],[-9,6.4,-5],[-17,12.5,-11],[-30,22,-21]].map(p=>new T.Vector3(...p)),false,'centripetal');
  const targets=new T.CatmullRomCurve3([[-1.5,3.5,-12],[-2.5,3.4,-11.6],[-1,2.7,-9],[0,.2,-5],[0,-1.25,-1.75]].map(p=>new T.Vector3(...p)),false,'centripetal');
  const focus=new T.Vector3(),position=new T.Vector3(),overview=new T.Vector3(),finalTarget=new T.Vector3();
  return {
    setCandidate(value){if(!CAMERA_CANDIDATES[value])throw Error('Unknown camera');candidate=value;},
    apply(theta,phi,distance,target,weight,line){
      const choice=CAMERA_CANDIDATES[candidate],narrow=smooth((1.5-camera.aspect)/.25);
      const progress=line?.progress??1;
      const near=weight*(1-smooth((progress-.38)/.10))*(line?.reducedMotion?0:1);
      const angle=phi+choice.phi*weight,azimuth=theta+choice.theta*weight;
      let radius=distance-(choice.distance-11*narrow)*weight;
      finalTarget.copy(target);finalTarget.y-=1.25*weight;
      overview.set(finalTarget.x+radius*Math.sin(angle)*Math.sin(azimuth),finalTarget.y+radius*Math.cos(angle),finalTarget.z+radius*Math.sin(angle)*Math.cos(azimuth));
      const t=smooth(progress/.45);positions.getPoint(t,position);targets.getPoint(t,focus);
      camera.position.copy(overview).lerp(position,near);focus.lerp(finalTarget,1-near);
      camera.lookAt(focus);return focus;
    },
    get candidate(){return candidate;},
  };
}
