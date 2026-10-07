// Gesture v2 authorizes NEXT intent recognition only. These archive/classifier
// blocks must still exactly match their frozen production math.
module.exports=function gestureContract(html) {
 const s=html.replace(/\r\n/g,'\n');
 const block=(a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);if(start<0||end<=start)throw Error('Missing protected gesture block '+a);return s.slice(start,end).trim();};
 return [block('function isHandOpen',s.includes('// Only NEXT')?'// Only NEXT':'function handleGestureLogic'),
  block('const handsWithSize','const handsCountActive'),
  block('const f1 = activeHands[0][8];','} else if (handsCountActive === 1'),
  block('if (isRevealed && handsCountActive > 0)',s.includes('function goToNextCharacterFromGesture')?'function goToNextCharacterFromGesture':'function triggerSwipeFlash')
 ].map(v=>v.replace('const handsWithSize = rawHands.map','const handsWithSize = rawLandmarksList.map').trim()).join('\n');
};
