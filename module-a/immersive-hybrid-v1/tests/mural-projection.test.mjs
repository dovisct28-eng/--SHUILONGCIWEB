import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {muralCorners,projectedCorners,readingDistance,MURAL_SOURCE} from '../src/mural-anchor.mjs';
import {sampleMuralTurn} from '../src/mural-transition-controller.mjs';
import {homography} from '../src/depth-layers.mjs';
test('authentic texture is complete and plane preserves its ratio within metadata rounding',()=>{
 const pts=muralCorners();assert.deepEqual(pts[0],[4.865,2.17735,2.9749999999999996]);assert.ok(pts[1][2]>pts[0][2]);assert.ok(Math.abs(3.65/1.2547-MURAL_SOURCE.width/MURAL_SOURCE.height)<.0002);
});
test('actual projected quadrilateral and homography are valid at all turn samples and viewports',()=>{
 for(const [w,h]of [[1920,1080],[1440,900],[1366,768]]){const c=new T.PerspectiveCamera(48,w/h,.045,180);
  for(let i=0;i<=100;i++){const p=sampleMuralTurn(i/100);c.position.fromArray(p.position);c.lookAt(...p.target);c.updateProjectionMatrix();const corners=projectedCorners(T,c);assert.ok(corners.every(p=>[p.x,p.y,p.depth].every(Number.isFinite)&&p.depth<1&&p.depth>-1));const mat=homography(corners.map(p=>[p.x*w,p.y*h]));assert.ok(mat.every(Number.isFinite));assert.ok(corners[1].x>corners[0].x);}
  const d=readingDistance(w/h);c.position.set(4.865-d,1.55,4.8);c.lookAt(4.865,1.55,4.8);const a=projectedCorners(T,c);assert.ok(a.every(p=>p.x>0&&p.x<1&&p.y>0&&p.y<1));assert.ok(Math.abs((a[1].x-a[0].x)*w/((a[3].y-a[0].y)*h)-3.65/1.2547)<1e-9);
 }
});
test('homography refuses degenerate corners',()=>assert.throws(()=>homography([[0,0],[0,0],[0,0],[0,0]]),/Degenerate/));
