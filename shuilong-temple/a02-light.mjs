import {architecturalRoom,ease} from '../module-a/a02/spatial.mjs';
import {directorState} from '../module-a/visual-director/state.mjs';
import {a03Visual} from '../module-a/a03/composition.mjs';
// Reuses the sun, fog, terrain and materials. A03 inherits these same local lights.
// The focus controller restores base colors before each apply: seeks never accumulate tint.
export function createA02Light(T,{renderer,camera,sun,fill,root,scene,floor}) {
  const entries=[];root.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(m=>{if(m.isMesh)entries.push(m.material);}));
  const hero={roof:[.53,.54,.53],wood:[.54,.46,.38],brick:[.61,.48,.43],plaster:[1.35,1.37,1.39],stone:[.42,.48,.51],paving:[.74,.77,.79]};
  const room={roof:[.53,.61,.72],wood:[.60,.51,.43],brick:[.56,.46,.42],plaster:[.84,.88,.92],stone:[.37,.38,.36],paving:[.61,.61,.58]};
  const courtyard=new T.PointLight(0xffd2a0,0,15,2);courtyard.position.set(-2,2.4,-3);scene.add(courtyard);
  const gallery=new T.PointLight(0xf5c48d,0,11,2);gallery.position.set(3,2.2,8);scene.add(gallery);
  const original={roof:.88,wood:.91,brick:.90,plaster:.85};
  const tint=new T.Color(),target=new T.Vector3(0,-1.15,-1.75),position=new T.Vector3(),focus=new T.Vector3(),direction=new T.Vector3();
  let last=null;
  const pass=()=>Number(new URLSearchParams(window.parent.location.search).get('a02-pass')||5);
  return {
    camera(screens){const s=architecturalRoom(screens);if(!s.weight)return;
      // Retain the Hero azimuth. A gentle height/target change opens up the courtyard.
      const radius=camera.aspect<1.8?48:43.5,phi=.93,theta=3.96;
      position.set(radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));
      direction.set(0,0,-1).applyQuaternion(camera.quaternion);
      focus.copy(camera.position).addScaledVector(direction,camera.position.distanceTo(target));
      camera.position.lerp(position,s.weight);focus.lerp(target,s.weight);camera.lookAt(focus);
    },
    apply(screens){if(screens<=6.4||screens>=13.05)return false;
      const s=architecturalRoom(Math.min(screens,10.2)),a=ease((screens-6.4)/.6),h=1-a,settle=s.arrival;
      const lit=pass()>=2;
      const end={exposure:lit?1.01:.98,fill:lit?.33:.72,sun:lit?3.5:4.5};
      // The endpoint reconnects to the existing A03 inputs without developing A03.
      const t=ease((screens-12.3)/.75),legacy=directorState(screens);
      renderer.toneMappingExposure=(.98+(end.exposure-.98)*settle)*(1-t)+legacy.exposure*t;
      fill.intensity=(.72+(end.fill-.72)*settle)*(1-t)+legacy.fill*t;
      fill.color.set(0xa5b9ce).lerp(new T.Color(0xd6dce0),t);
      fill.groundColor.set(lit?0x4c5b67:0x313d4a).lerp(new T.Color(0x514940),t);
      sun.intensity=(4.5+(end.sun-4.5)*settle)*(1-t)+legacy.sun*t;
      sun.color.set(0xffd4a1).lerp(new T.Color(0xf0e8dc),.4*settle).lerp(new T.Color(0xffffff).lerp(new T.Color(0xf0e8dc),.45),t);
      sun.position.set(-16+4*s.weight,22+3*settle,16-32*s.weight);
      courtyard.intensity=lit?40*s.weight*(1-t):0;gallery.intensity=lit?30*s.weight*(1-t):0;
      // A03-only warm directional contrast; A02's approved endpoint remains exact.
      const poster=ease((screens-10.2)/.75)*(1-t);
      renderer.toneMappingExposure+=(1.10-renderer.toneMappingExposure)*poster;
      sun.intensity+=(5.2-sun.intensity)*poster;sun.color.lerp(new T.Color(0xffc99c),.55*poster);
      sun.position.lerp(new T.Vector3(-16,18,-20),poster);
      fill.intensity+=(.24-fill.intensity)*poster;
      const cutaway=a03Visual(screens).cutaway;
      courtyard.position.set(-2,2.4,-3-6*cutaway*poster);
      if(lit){courtyard.intensity+=(12+6*cutaway)*poster;gallery.intensity+=(8+5*cutaway)*poster;}
      camera.fov=(32+(31.5-32)*settle)*(1-t)+legacy.fov*t;camera.updateProjectionMatrix();
      for(const m of entries){const key=m.userData.textureKey,from=hero[key];if(!from)continue;
        const endTint=lit?room[key]:from;
        const values=from.map((v,i)=>{
          const desired=(v+(endTint[i]-v)*settle)*(1-t)+(original[key]??1)*legacy.architecture*t;
          return desired/(1+(v-1)*h);
        });tint.setRGB(...values);m.color.multiply(tint);
        // Matte materials keep roof detail from becoming a specular focus.
        if(lit)m.roughness=m.roughness+(Math.max(m.roughness,key==='roof'?.84:.94)-m.roughness)*s.weight;
      }
      if(scene){scene.fog.color.set(0x15222b).lerp(new T.Color(0xe7e5df),t);scene.fog.density=(.007+.002*s.weight)*(1-t)+(.007+.003*ease((screens-10.5)/2.7))*t;}
      if(floor){floor.visible=true;floor.material.depthWrite=false;floor.material.opacity=(.15+.04*s.weight)*(1-t)+.18*t;}
      last={...s,exposure:renderer.toneMappingExposure,fill:fill.intensity,sun:sun.intensity,fov:camera.fov,lights:4,newTextures:0,newPostTargets:0};
      return true;
    },reset(){courtyard.intensity=gallery.intensity=0;},getState:()=>last,
  };
}
