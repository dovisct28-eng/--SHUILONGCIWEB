import {directorState,wallReveal} from '../module-a/visual-director/state.mjs';
// Reuses the existing sun, hemisphere and material instances; mural texture planes are excluded.
export function createDirectorLight(T,{renderer,camera,sun,fill,root}){
  const entries=[];root.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(m=>{if(m.isMesh)entries.push({mesh:m,group:g.name});}));
  const white=new T.Color(0xffffff),neutral=new T.Color(0xf0e8dc);let last=directorState(),fontsRequested=false;
  return {apply(screens,tour){last=directorState(screens,tour);if(last.space===0)return;
    if(!fontsRequested&&typeof document!=='undefined'){fontsRequested=true;const link=document.createElement('link');link.rel='stylesheet';link.href='../module-a/visual-director/fonts/fonts.css';document.head.append(link);const css=document.createElement('style');css.textContent='.narrative-markers .mural-label,.route-node-label,.spatial-label{font-family:"Narrative Sans","Microsoft YaHei",system-ui,sans-serif;line-height:1.5}';document.head.append(css);}
    renderer.toneMappingExposure=last.exposure;camera.fov=last.fov;camera.updateProjectionMatrix();
    fill.intensity=last.fill;fill.color.set(0xd6dce0);fill.groundColor.set(0x514940);
    sun.intensity=last.sun;sun.color.copy(white).lerp(neutral,.45*last.space);sun.position.set(-16,25,14);
    for(const e of entries){const m=e.mesh.material,key=m.userData.textureKey;
      const local=tour?.target&&(tour.target==='mural-01'?e.group==='05_EastGallery':e.group==='03_MainHall');
      const weight=(key==='roof'?.88:key==='wood'?.91:key==='brick'?.90:key==='plaster'?.85:1)*last.architecture;
      m.color.multiplyScalar(1+(weight-1)*last.space);
      if(last.transfer>0&&e.group!=='03_MainHall')m.color.multiplyScalar(1-last.transfer*.45);
      if(local)m.color.multiplyScalar(1+.08*(tour.mode==='playing'?wallReveal(tour.elapsed+.3):1));
    }
  },getState:()=>({...last,lights:2,newTextures:0,newPostTargets:0})};
}
