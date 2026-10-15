"""Consolidate actual outputs only; refuses stale frame evidence."""
import hashlib,json
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1]
def read(p):return json.loads((base/p).read_text(encoding='utf-8'))
def write(p,r):(base/p).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
source=base/'previews/preview-v3-150s.mp4';digest=hashlib.sha256(source.read_bytes()).hexdigest()
review=read('docs/v3-frame-review.json');verify=read('docs/preview-v3-150s-verification.json');sync=read('docs/v3-final-sync.json');audit=read('local/v3-audit/final-all-frames.json')
assert review['sha256']==digest,'Stale exported-frame evidence'
assert verify['status']=='PASS' and verify['sizeBytes']==source.stat().st_size
assert audit['decodedFrames']==4500 and all(x['withinOneFrame']for x in sync['sfxCorrelation'])
d=np.array(audit['pairMeanAbsoluteDifferences']);regions=[]
for name,intervals in [('A04 moving',[(900,954),(965,1002),(1019,1140),(1164,1285),(1307,1384)]),('B02 drag',[(1985,2050)]),('OPEN geometry',[(3601,3623)]),('CLOSE geometry',[(3871,3893)])]:
 v=np.concatenate([d[a:b]for a,b in intervals]);regions.append({'region':name,'pairCount':len(v),'nearDuplicatePairs':int((v<.035).sum()),'minimumDifference':float(v.min()),'medianDifference':float(np.median(v))})
for name in ['next','open','close']:
 r=read(f'local/v3-audit/final-{name}-ring.json');regions.append({'region':name+' dwell ring ROI','pairCount':r['decodedFrames']-1,'nearDuplicatePairs':r['nearDuplicatePairs']})
assert all(r['nearDuplicatePairs']==0 for r in regions)
measurements={'source':source.name,'sha256':digest,'allDecodedFrames':4500,'ptsDeltaMs':audit['ptsDeltaMs'],'fullFrameNearDuplicateCandidates':audit['nearDuplicatePairs'],'candidatePercent':audit['nearDuplicatePercent'],'classifiedMotionRegions':regions,'interpretation':'Full-frame candidates include designed reading holds, spatial docks and small-area motion. They are not an abnormal-drop percentage.','limits':audit['limits']}
write('docs/v3-motion-measurements.json',measurements);write('docs/v3-motion-regions.json',regions)
plan=read('planning/timeline-v3-150s.json');plan['status']='PREVIEW_CANDIDATE_READY_FINAL_APPROVAL_PENDING';write('planning/timeline-v3-150s.json',plan)
state=read('planning/production-state-v3.json');state['stage']='PREVIEW_CANDIDATE_TECHNICALLY_VERIFIED';state['outputVerification']={'sha256':digest,'decodedFrames':4500,'videoDurationSeconds':150,'internalBlackFrames':0,'sfxWithinOneFrame':True};write('planning/production-state-v3.json',state)
comparison=review['actualFrameComparisons'];ss=[x['block8LumaSSIM']for x in comparison];ps=[x['psnrDb']for x in comparison]
quality=f'''# V3 画质与连续性验收

2026-10-15。对象为实际 `previews/preview-v3-150s.mp4`，SHA256 `{digest}`，不是时间线配置推定。

## 技术与运动

- 全部4500帧解码；1920×1080、H.264/yuv420p、CFR30；视频150.000秒。AAC48k双声道192kbps；音频与容器150.015979秒，属于编码填充，未隐藏此差异。
- 文件{source.stat().st_size:,}字节，约{source.stat().st_size/1024**2:.2f}MiB。原生视频码率约6.21Mbps。Desktop导出接口未开放CRF或码率参数，**没有声称采用CRF16–18或15–25Mbps**，也未把已压缩成片再加码率冒充提升。
- PTS相邻33.333–33.334ms。全片候选静止对{audit['nearDuplicatePairs']} /4499（{audit['nearDuplicatePercent']}%）含阅读、停靠及小区域动画，不能叫掉帧率。按实际动作区域独立检查：A04移动410对、B02拖动65对、OPEN/CLOSE各22对、三个驻留环各29对，近重复均0。详见v3-motion-measurements.json。
- 内部黑帧0；仅F4498–4499低于黑场阈值，属于末12帧淡出。验证器已收紧，1帧内部黑场也不放行。
- NEXT/OPEN/CLOSE确认音F3240/F3600/F3870，实际音轨相关性偏移均0ms；PCM峰值{verify['peakDbFS']:.2f}dBFS、RMS {verify['rmsDbFS']:.2f}dBFS，无采样削波；不冒称真峰值或LUFS测量。

## 图像及剪辑复查

已检查所有章节/操作切点前后1秒（-30、-1、0、+1、+15、+30帧），覆盖三幅壁画顺序、A03稳定布局、A08真实入口、B02全景/拖动/层切换/另一人物、B03驻留与简介开合、回顾及片尾。发现的B02加载1帧和视频尾解码1帧黑场均修正，最后导出F2684–2686及F2848–2850另行逐帧核对。

壁画纹理、建筑斜边、线框、中文、人物边缘使用原尺寸PNG抽查。7组真实源/输出对应帧：8×8块亮度SSIM {min(ss):.4f}–{max(ss):.4f}，PSNR {min(ps):.2f}–{max(ps):.2f}dB。它不是全片滑窗SSIM，也不单凭数值宣称主观画质通过；实际对照未发现新增拉伸、重影或明显压缩块，高清源没有先缩小再放大。

没有看到作者/学校/账号/地址栏/本地路径；元数据身份标签检查通过。画面匿名检查为所有切点和代表帧检查，未冒称4500帧OCR逐字认证。B03持续“交互效果模拟演示 / 数字化演绎内容”，源B02人物动画保留原Veo标识，不把它当真实文物或摄像头证据。

## 比较与边界

V2三个主要实录源为25fps，转30fps会增加周期性重复；V3用PNG浏览器逐帧采样，无损中间文件后原生导出，运动区间未再发现固定5–6帧重采样规律。V2 A04两处跳过约10.87/12.47秒源路径，V3保留完整前行/转向，仅按公开时间映射压时。V2 OPEN的left/width直接跳变310/120px，V3在24帧内连续插值；实际导出对照和短片保留本地。

技术与编辑检查通过，仍为**审片候选**。音乐衔接/听感与最终参赛认可由用户审片决定；离线采集不认证现场实时30fps或实体摄像头性能。A04素色定位面、现有色稿动画与13秒壁画节选等边界见v3-edit-decisions.md。
'''
(base/'docs/v3-quality-report.md').write_text(quality,encoding='utf-8')
production=f'''# V3 制作交付记录

2026-10-15，150秒审片候选已完成。最新文件 `previews/preview-v3-150s.mp4`（{source.stat().st_size:,}字节），SHA256 `{digest}`。用户明确确认后才生成 `renders/chubingrujiang-e-150s-final.mp4`，当前未用final命名冒充获认可终稿。

## 原生工程

- 项目仍为“出兵入将｜竞赛宣传片130秒”，project `050726e1-fb18-4c5b-beb0-851c06f616fe`。
- 独立时间线“出兵入将｜150秒参赛演示 V3”，`43b9d733-c0e8-4b41-b2de-e15e57437a83`。旧V1/V2及旧测试保留；新增V3 20秒测试亦保留。
- 16条主画面片段、9条独立字幕/片名、独立配乐及3条确认音，五轨可编辑；来源标注轨独立预留，B03持续标识在其可编辑MG属性中。10种在用MG源和实际属性见motion-graphics-properties-v3.json；独立SRT为subtitles/chubingrujiang-v3-150s.srt。
- 实际时间线回读、源入点、轨道与导出任务记录在production-state-v3.json；新版时码不再用3900帧硬编码核验。字幕属性实际改为测试文字并在原生帧中看到后恢复；重新target项目回读仍4500帧/五条时间线。不是进程退出重启或跨机器媒体可搬迁认证。
- Remotion仅新增 `/V3Review` 视频监看器，`public/preview-review-v3.mp4`本地副本；母剪辑始终在ChatCut，没有用整片Remotion替换工作流。

## 重新采集与修复

A01–A03、完整A04、A05/06/07、A08真实入口和完整B02全部另存V3。Playwright1.62.1固定25fps录像不支持fps参数，因此使用真实页面受控时钟+PNG逐帧采集，再以30fps无损中间文件导入。业务页面、摄像头逻辑、模型和原壁画像素未修改。B03另建37秒源，保留单手、移入、驻留、NEXT、释放、OPEN、阅读、CLOSE因果关系。

A08导航销毁上下文造成第一次录制收尾中断；采用独立补录，实际释放后URL为既有localhost:3000入口。初次150秒导出的B02有1帧空图，下一版1帧视频尾出现解码黑场；两次均未接受，最终用真实源PNG阅读停留解决。失败产物和日志本地保留，后续检测不掩盖前次失败。

配乐沿用现有纯器乐母文件，另剪150秒：原音0–130.8s与最后20s，130–130.8s交叉衔接，首尾淡变。没有新付费生成，也不是可分离乐器stem。听感仍待用户认可。

## 验证和交付边界

20秒关键门槛通过后才录全片。相关测试15/15；MG TypeScript、监看器lint/bundle通过；全部4500帧解码和严格黑场检测、PTS、声轨/确认音、各切点实际帧检查完成。详细数据见v3-quality-report.md与对应JSON。15张精选约8.63MiB放在仓库docs/validation/promo-video-v3/selected，完整回归和对照短片只留本地。

赛事完整文件及高校正式通知核对：E类允许参照D类提交视频+PPT；1080p/H.264/MP4/中文字幕有明确依据。150秒与30fps为本任务目标；10M是展板上限，文件未规定视频大小上限。完整参赛包还需PPT设计说明，本轮授权为视频专项，没有冒称PPT已制作。

所有视频、音乐母文件和完整录屏均不进入普通Git。本次代码/时码/文档/精选证据按显式清单提交。用户原有素材修改、删除、08目录、归档脚本和历史截图保持未纳入。Git提交与远程master的核实SHA见实际交付消息，不在文档写入无法自指的提交值。
'''
(base/'docs/v3-production-report.md').write_text(production,encoding='utf-8')
selected=base.parent/'docs/validation/promo-video-v3/selected';files=sorted(selected.iterdir());total=sum(p.stat().st_size for p in files)
readme=f'''# V3 精选实际导出证据

15张精选，总计{total:,}字节（{total/1024**2:.2f}MiB）：13张1920×1080无损WebP和2张JPG修复对照。实际导出SHA256 `{digest}`。覆盖建筑、空间、A03、A04三次停靠、B02全景及三种图像、B03驻留与展开、片尾。清单及帧号见[帧审查数据](../../../promo-video/docs/v3-frame-review.json)。

完整PNG、所有切点前后1秒接触表、对照短片及4500帧差分留在promo-video/local/v3-review与local/v3-audit，已忽略；不减少真实测试，不提交母版、音乐或整批录像。B03为预设模拟，音乐与参赛终稿待用户认可。
'''
(selected.parent/'README.md').write_text(readme,encoding='utf-8')
print(json.dumps({'status':'PREVIEW_CANDIDATE_READY','sha256':digest,'bytes':source.stat().st_size,'selectedCount':len(files),'selectedBytes':total}))
