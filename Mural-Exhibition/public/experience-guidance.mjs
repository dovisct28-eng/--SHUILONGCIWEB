// Presentation only: inputs are existing V4.2 snapshots, never raw landmarks.
export function gestureGuidance({ cameraState, reason, pointer, reading, overflow, lastAction, now, experienced }) {
 if (cameraState !== 'RUNNING') {
  const messages = { ERROR:'体感暂不可用 · 可重试或使用鼠标、键盘', DEGRADED:'识别暂不可用 · 可使用鼠标、键盘', IDLE:'摄像头已停止 · 可使用页面按钮', STOPPING:'摄像头正在停止 · 请稍候' };
  return { message:messages[cameraState] || '正在准备摄像头与识别 · 可先用页面按钮', tone:'status' };
 }
 const messages = {
  NO_PERSON:experienced ? '识别已中断 · 回到中央，重新伸出单手' : '① 站到中央 · 让上半身进入画面', PERSON_ACQUIRING:'站位确认中 · 请伸出一只手',
  WAIT_HAND:'② 伸出单手 · 等待光标出现', HAND_NOT_DETECTED:'② 伸出单手 · 等待光标出现',
  HAND_ACQUIRING:'③ 单手确认中 · 等待光标变稳', HAND_LOCKED_PAUSED:'识别短暂中断 · 操作已暂停',
  HAND_LOCK_RELEASED:'控制手已释放 · 请重新伸出单手', POSE_STALE:'识别暂未更新 · 操作已暂停，可用页面按钮',
  HAND_NOT_ASSIGNED:'请调整手掌位置 · 也可使用页面按钮', AMBIGUOUS_PERSON:'请保持单人操作',
  AMBIGUOUS_HAND:'请先使用一只手', HAND_UNSTABLE:'请稳住手掌 · 等待光标变稳',
  DWELLING:'保持光标 · 驻留 1 秒确认', WAIT_RELEASE:'移开光标离开目标 · 再次操作', ACTION_LOCKED:'正在呈现人物 · 请稍候'
 };
 // A real tracking interruption takes precedence over a recent confirmation.
 if (['NO_PERSON','HAND_NOT_DETECTED','HAND_LOCKED_PAUSED','HAND_LOCK_RELEASED','POSE_STALE','HAND_NOT_ASSIGNED','AMBIGUOUS_PERSON','AMBIGUOUS_HAND'].includes(reason)) return { message:messages[reason], tone:'status' };
 if (lastAction && now - lastAction.at < 450) return { message:'已确认 · 移开光标准备下一次操作', tone:'active' };
 if (messages[reason]) return { message:messages[reason], tone:['DWELLING','WAIT_RELEASE'].includes(reason) ? 'active' : 'status' };
 if (!pointer?.valid) return { message:'伸出单手 · 等待光标出现，可用页面按钮', tone:'status' };
 if (reading && overflow) return { message:'光标在正文内上下移动 · 阅读；驻留返回人物', tone:experienced ? 'quiet' : 'ready' };
 return { message:experienced ? '光标驻留 1 秒确认' : '④ 移动光标至目标 · 驻留 1 秒确认', tone:experienced ? 'quiet' : 'ready' };
}
