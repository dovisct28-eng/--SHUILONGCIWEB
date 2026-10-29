import {FIRST_MURAL} from './corridor-path.mjs';
import {homography} from './depth-layers.mjs';

// Design-model coordinates on the wall above the mural, not on its image.
// The narrow offset places the label just in front of the same wall plane.
const {position:[x,y,z],width,height}=FIRST_MURAL,top=y+height/2,left=z-width/2;
export const WALL_CUE_CORNERS=Object.freeze([
 [x+.01,top+.40,left+.08], [x+.01,top+.40,left+2.08],
 [x+.01,top+.12,left+2.08], [x+.01,top+.12,left+.08],
].map(Object.freeze));
export function projectWallCue(camera,frame,container){
 camera.updateMatrixWorld();const points=WALL_CUE_CORNERS.map(point=>{const v=camera.position.clone().fromArray(point).project(camera);return [frame.left-container.left+(v.x+1)*frame.width/2,frame.top-container.top+(1-v.y)*frame.height/2];});
 return {points,matrix:homography(points,500,110)};
}
