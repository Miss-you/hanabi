# AGNET.md

本文件用于持续迭代时的协作约定与快速上手指引。

## 项目概览

Hanabi-TS 是基于 TypeScript + Vite 的音频驱动烟花可视化系统，核心包含音频分析、编排规则和 Canvas 渲染。

## 快速开始

- `npm install`
- `npm run dev`（本地开发）
- `npm run build` / `npm run preview`（生产构建与预览）
- `npm run lint` / `npm run format`

## 关键模块与职责

- `src/main.ts`: 应用入口，串联渲染器、音频分析、编排器与时间线。
- `src/audio/`: 音频事件提取、频谱分析、节拍检测、播放时间线。
- `src/choreography/`: 编排引擎、规则系统、段落检测、表现形式库。
- `src/engine/`: 发射器、粒子系统、渲染器等底层实现。
- `src/core/`: Firework/Particle 核心模型与类型定义。
- `src/pages/` + `pages/`: 调试页脚本与 HTML 入口（多页面构建）。
- `src/styles/`: 页面级样式。

## 迭代约定

- 保持 `@/` 路径别名（见 `vite.config.ts` / `tsconfig.json`）。
- 新增烟花类型或模式时，同步更新 `src/core/types.ts` 与相关实现。
- 编排规则优先通过 `src/choreography/RuleEngine.ts` 调整；表现形式集中在 `PatternLibrary.ts`。
- 音频分析阈值为硬编码参数，调整后记录到 `docs/development-log.md`。
- 新增调试页需补齐三处：`pages/<name>/index.html`、`src/pages/<name>.ts`、`src/styles/<name>.css`，并更新 `vite.config.ts`。

## 验证清单

- `npm run dev` 后检查主页（演示模式 + 音乐模式）。
- 浏览调试页：`/pages/firework-types/`、`/pages/audio-analyzer/`、`/pages/particle-physics/`、`/pages/renderer-debug/`、`/pages/launcher-test/`。
- 运行 `npm run lint` 确认无 TS/ESLint 报错。

## 文档维护

- 功能/架构变动后更新 `docs/PROJECT_HANDOVER.md` 与 `docs/development-log.md`。
- 编排逻辑调整时同步维护 `docs/choreography-design.md`。
