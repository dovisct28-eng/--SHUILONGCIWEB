// Single editorial source for capture, native timeline, captions and sound events.
const chapters=[['A01',0,270],['A02',270,660],['A03',660,1020],['A04',1020,1710],['A05-A08',1710,2340],['B02',2340,3510],['B03',3510,4530],['recap',4530,5010],['ending',5010,5190]].map(([id,startFrame,endFrame])=>({id,startFrame,endFrame}));
const introKeys=[[0,.05],[210,4.5],[240,4.8],[269,5.2],[300,6.4],[420,7.2],[525,8.9],[630,9.8],[660,10.1],[690,10.4],[747,11.8],[810,11.8],[930,12.1],[1019,13.2]];
const tourKeys=[[0,0],[60,4],[180,8],[280,18],[400,22],[500,32],[590,36],[635,41],[660,45]];
const themeKeys=[[0,10.1],[30,10.3],[69,10.63],[87,11.2],[150,11.2],[240,12.3],[359,13.2]];
const galleryEvents={drag:120,dragEnd:195,zoom:195,reset:300,select1:360,line:540,color:660,index:900,select2:930,read:1000};
const gestureEvents=[{action:'NEXT',at:330,release:390},{action:'OPEN',at:660,release:720},{action:'CLOSE',at:930,release:970}];
const recaps=[{id:'recap-space',startFrame:4530,endFrame:4680,title:'01 / 建筑空间',description:'在三维空间中了解壁画位置'},{id:'recap-gallery',startFrame:4680,endFrame:4830,title:'02 / 图鉴探索',description:'从原图到线稿，探索壁画人物'},{id:'recap-gesture',startFrame:4830,endFrame:5010,title:'03 / 体感交互',description:'通过手势输入探索人物信息'}];
module.exports={chapters,introKeys,themeKeys,tourKeys,galleryEvents,gestureEvents,recaps,themeAnchorFrame:747};
