// B1 uses the shared Combined B architecture. Old generated interiors remain
// available in historical source/assets, but cannot load through this entry.
export const GALLERY_CONFIG=Object.freeze({model:'combined-b',version:'V2.4-B1',generatedInterior:false});
export function createDisabledInterior(){
 return {load:async()=>true,update(){},setEnabled(){},setMode(){},setBlend(){},setFeature(){},
  get status(){return 'disabled';},get error(){return null;},
  state:()=>({status:'disabled',mode:'original',generatedInterior:false,textures:0,effective:[],preparation:[],reason:'Combined B pure 3D; old interior calibration suspended'}),dispose(){}};
}
