// Normalize only the HF05-authorized latch/NEXT hook. Recognition and reading
// math must still match the frozen handler; broad regex removal is avoided.
module.exports=function gestureContract(html) {
 const start=html.indexOf('function handleGestureLogic');
 const end=html.indexOf(html.includes('function goToNextCharacterFromGesture')?'function goToNextCharacterFromGesture':'function triggerSwipeFlash',start);
 return html.slice(start,end).replace(/\r\n/g,'\n')
  .replace(/if \(dist > 0\.35 && !isRevealed\) \{[\s\S]*?(?=\n            \} else if)/,'REVEAL_ACTION')
  .replaceAll("                continuousClosedFrames = 0; currentHandState = 'closed'; nextGesture.rearm();\n",'')
  .replace("if (continuousClosedFrames > 2) { currentHandState = 'closed'; nextGesture.rearm(); }","if (continuousClosedFrames > 2) currentHandState = 'closed';")
  .replace('if (nextGesture.ready(now))','if (now - swipeCooldown > 1000)')
  .replace(/triggerSwipeFlash\(\);\s*loadSeriesData\(currentSeriesIndex \+ 1\);\s*swipeCooldown = now;/,'NEXT_ACTION')
  .replace('goToNextCharacterFromGesture(now);','NEXT_ACTION').trim();
};
