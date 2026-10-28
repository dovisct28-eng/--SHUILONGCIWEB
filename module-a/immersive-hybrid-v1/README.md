# 水龙祠数字展厅 · Combined B / V2.4-B1

当前建筑基线为用户确认的 **Combined B = Corridor B＋Stage B＋Roof B**，已整合到共享正式模型。基线提交 `25d87f7326ef7714b71936ab84afc61ce153a864`，稳定 Tag `temple-combined-b-b1-2026-10-28`。

## 当前入口与范围

打开 [V2.4-B1 实验展厅](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html)。共享建筑已用于 A01–A04，但本展厅仍为独立实验入口，尚未替代正式 A01–A08 的完整叙事。当前路线包含总览、进入大门、戏台右侧绕行、拓宽后的右廊、第一幅斜向发现、正视停靠、数字阅读和完整反向返回。

旧 G01/G02/G03 生成室内图暂停使用，当前使用真实三维建筑与独立真实壁画纹理；后续室内图尚未重新生成。第二至第五幅完整观看路线尚未完成。模型设计确认不代表整套体验或新的室内图已完成。

## 本地启动

在项目根目录运行：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

模块 A 正式入口：[A01–A08](http://127.0.0.1:4186/module-a/a01/)。模块 B 在 `Mural-Exhibition/` 中运行 `node server.js`，默认端口 3000。页面必须通过 HTTP 打开。当前建筑展厅无需外部图片 API；模块 B 沿用已有依赖。

## 当前模型与第一幅交互

正式构建命令：`node shuilong-temple/build-model.mjs`。源码、GLB、内嵌预览、模型信息和 A01 线稿由现有链路维护，不能运行旧 B0 候选构建替代它。

向下滚轮、方向键或“下一处”推进，反向输入或“上一处”返回。右廊后走近第一幅，经过正视停稳后展开；“详细查看”可缩放、拖动和复位。关闭详情后返回阅读，再返回墙面、廊道和总览。真实壁画不镜像、不重绘。完整基线证据见 [B1 整合记录](../../docs/validation/temple-model-v2/integration-b1/README.md)。该记录保持 B1 提交当时原貌，其中历史文件保留状态和复验命令不构成本次维护后的运行说明。

## 历史版本与退役入口

`index.html` 对应旧 V2.3 实验实现，`v1.html` 为早期 V1；为保留历史代码与已有测试，本次不删除这些文件，它们不是当前 B1 入口。生成资产、提示词、来源及真实壁画完整保留。

[B0 静态设计对照](../../docs/validation/temple-model-v2/README.md)保留参数、源码与关键图片。**历史候选对照已归档，不再提供当前运行入口。** 原 B0 HTML、候选二进制和独立构建/验收脚本已退役，可从[固定 B1 Tag](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/temple-combined-b-b1-2026-10-28/docs/validation/temple-model-v2)恢复。B0 原始 Baseline 应回看 `ef0f366`，不能以当前共享 GLB 冒充当时模型。

V2.1–V2.4-A.1 的技术决策、独特录像和阶段证据仍保留在 `docs/validation/`；其中旧入口及机位说明仅适用于当时版本，不代表当前外观。

## 维护后复验与后续工作

原生单元测试：`node --test module-a/immersive-hybrid-v1/tests/*.test.mjs shuilong-temple/*.test.mjs`。本轮维护回归脚本与结果见 [Repository Cleanup V1.0](../../docs/maintenance/repository-cleanup-v1/README.md)，需要本机已配置的 Playwright/Sharp；不增加网页运行依赖，不覆盖 B1 原始验收记录。

后续包括当前展厅的视觉审查、重新生成与 Combined B 机位匹配的室内图、其余壁画路线及正式体验整合。本轮仅维护和回归。
