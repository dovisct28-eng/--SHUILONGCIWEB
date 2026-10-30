import {installRouteSurfaces} from './route-surface-v3.2.mjs';
import {rearWeights} from './route-v3.3.mjs';
export function installRearSurfaces(runtime,T){return installRouteSurfaces(runtime,T,{
 base:'./assets/route-v3.3/',name:'V33-rear-surface-projections',progress:p=>p.route33,weights:rearWeights,gains:[.30,.34],
 safeVertex(mesh,p,n,k,kind){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);if(kind===1)return n.getY(k)>.9&&y>.2&&y<.8&&z< -8;if(kind===0)return z< -8&&((z< -14.7&&n.getZ(k)>.9)||(x< -4.4&&n.getX(k)>.9));return false;},
 // Exclude first/second/fifth and generous rear-mural bands from AI projection.
 fragmentGuard:'if(routeWorld.z> -8.||routeWorld.z< -15.1)discard;float surfaceSafety=1.;if(kind==0){if(routeWorld.x>4.4)discard;float above=smoothstep(2.98,3.20,routeWorld.y),below=1.-smoothstep(.42,.65,routeWorld.y);if(routeWorld.x< -4.4)surfaceSafety=max(above,below);if(routeWorld.z< -14.7){float center=1.-smoothstep(.23,.43,abs(routeWorld.x));surfaceSafety=max(center,max(above,below));}}if(surfaceSafety<.001)discard;diffuseColor.a*=surfaceSafety;',
});}
