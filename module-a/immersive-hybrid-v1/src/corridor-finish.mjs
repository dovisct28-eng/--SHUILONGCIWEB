// Display fields on the existing design model, not surveyed material samples.
export const FINISH_DEFAULTS=Object.freeze({wall:true,floor:true,wood:true,lighting:true});
export function finishWeights(time,blend,mode,enabled=true){const u=Math.max(0,Math.min(1,(time-1.6)/.35));return enabled&&time>1.6&&mode==='hybrid'?(blend??u*u*(3-2*u)):0;}
export const finishNoise=`
float hfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hfHash(i),hfHash(i+vec2(1.,0.)),f.x),mix(hfHash(i+vec2(0.,1.)),hfHash(i+1.),f.x),f.y);}
float hfGrain(vec2 uv){return (hfNoise(uv)-.5)*(1.-smoothstep(2.,13.,length(vViewPosition)));}
`;
export function finishShader(kind){
 const wall=`vec2 q=galleryWorld.zy;
 float broad=hfNoise(q*vec2(.31,.52)),plaster=hfNoise(q*vec2(2.8,3.6)+broad*.45);
 float foot=1.-smoothstep(.32,.98,galleryWorld.y),head=smoothstep(1.9,2.7,galleryWorld.y);
 float bays=pow(.5+.5*cos((galleryWorld.z-7.2)*2.0944),10.);
 float wear=smoothstep(.66,.84,hfNoise(q*7.3+plaster))*.055;
 diffuseColor.rgb*=.97+.24*(broad-.5)+.19*(plaster-.5)+hfGrain(q*160.)*.075-wear-foot*.14-head*.075-bays*.055;
 diffuseColor.rgb*=mix(vec3(.97,1.,1.025),vec3(1.04,1.015,.97),broad);`;
 const floor=`vec2 q=galleryWorld.xz;float broad=hfNoise(q*.55),aggregate=hfNoise(q*9.1+hfNoise(q*1.7));
 float worn=smoothstep(.45,.8,hfNoise(q*vec2(1.8,.35)));
 diffuseColor.rgb*=.96+.13*(broad-.5)+.075*(aggregate-.5)+hfGrain(q*190.)*.09+worn*.025;`;
 const wood=`vec2 q=galleryWorld.xz;float streak=hfNoise(vec2(q.x*53.+q.y*41.,galleryWorld.y*.8));
 float fiber=hfNoise(vec2(q.x*157.+q.y*127.,galleryWorld.y*2.3));diffuseColor.rgb*=.97+.12*(streak-.5)+.045*(fiber-.5);`;
 return {map:kind==='wall'?wall:kind==='floor'?floor:kind==='roof'?'':wood,
 roughness:kind==='floor'?'roughnessFactor=clamp(roughnessFactor+.07*(aggregate-.5)-worn*.025,.78,1.);':kind==='wall'?'roughnessFactor=clamp(roughnessFactor+.05*(plaster-.5),.82,1.);':kind==='roof'?'':'roughnessFactor=clamp(roughnessFactor+.08*(streak-.5),.65,1.);',
 light:`float ceiling=smoothstep(2.25,2.75,galleryWorld.y);float towardEnd=1.-smoothstep(-5.,9.5,galleryWorld.z);
 vec3 bounce=${kind==='wood'?'mix(vec3(.029,.024,.018),vec3(.039,.034,.026),ceiling)':kind==='roof'?'vec3(.011,.012,.012)':kind==='wall'?'vec3(.010,.012,.012)':'vec3(.006,.007,.007)'};
 outgoingLight+=bounce*finishLight*(.82+towardEnd*.18);
 float air=(1.-exp(-length(vViewPosition)*.026))*.15*finishLight;outgoingLight=mix(outgoingLight,vec3(.080,.100,.108),air);`};
}
