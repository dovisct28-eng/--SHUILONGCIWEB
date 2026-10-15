# 出兵入将 · 审片监看器

本工程在Remotion Studio播放ChatCut导出的最新130秒粗剪。五轨可编辑母工程在ChatCut Desktop，实际状态和MG源码位于上层`planning/production-state-v2.json`及`motion-graphics/`。本播放器中的视频不支持独立修改内部字幕或人物动画。

运行`npm run dev -- --no-open --port=4195`；`public/preview-review-v2.mp4`为本地审片副本，不进入Git。`npm run lint`及`npm run build`检查播放器工程。下方保留脚手架工具说明。

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
