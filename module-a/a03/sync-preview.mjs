// Extend existing offline synchronization without rebuilding geometry.
import '../../shuilong-temple/sync-a02-preview.mjs';
import fs from 'node:fs';
const file=new URL('../../shuilong-temple/水龙祠-交互预览.html',import.meta.url);
let html=fs.readFileSync(file,'utf8');
const call=/(?:const roomArrival=[^;]+;const posterArrival=[^;]+;const posterExit=[^;]+;)*const roomSite=visualTour\?0:[^;]+;a01Environment\?\.apply/;
if(!call.test(html))throw Error('Missing existing environment handoff');
html=html.replace(call,'const roomArrival=smooth(Math.max(0,Math.min(1,(visualScreens-6.4)/.8)));const posterArrival=smooth(Math.max(0,Math.min(1,(visualScreens-10.2)/.75)));const posterExit=smooth(Math.max(0,Math.min(1,(visualScreens-12.3)/.75)));const roomSite=visualTour?0:roomArrival*(1-.62*posterArrival)*(1-posterExit);a01Environment?.apply');
html=html.replace(/lineState\?\.reducedMotion\?\?false,roomSite(?:,[^;]+)?\);/, 'lineState?.reducedMotion??false,Math.max(roomSite,posterArrival*(1-posterExit)),posterArrival*(1-posterExit));');
fs.writeFileSync(file,html);
