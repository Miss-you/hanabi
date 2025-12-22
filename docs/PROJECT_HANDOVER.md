# PROJECT_HANDOVER

> Last updated: 2025-12-22

## 1. 项目极简介绍 (Elevator Pitch)

Hanabi-TS 是一个基于 Web Audio + Canvas 的日式音乐烟花可视化系统，自动从音频中提取节奏与能量并生成同步烟花表演。

## 2. 技术栈与关键决策 (Tech Stack)

- TypeScript + Vite：开发/构建速度快，严格类型约束减少运行期问题。
- Canvas 2D：粒子与轨迹控制细粒度，可直接实现烟花物理效果。
- Web Audio API：本地离线分析 + 播放，避免后端依赖。
- ESLint + Prettier：保持代码一致性与可维护性。
- 多页面入口（`vite.config.ts`）：调试页独立入口，便于验证单模块。

## 2.1 开发环境与依赖管理 (Local Setup)

- Node.js >= 18（建议 20 LTS），避免环境差异。
- 统一使用 npm，`package-lock.json` 为依赖版本来源。
- `node_modules` 位于项目根目录，仅本地使用，不提交代码库（已在 `.gitignore` 忽略）。
- 干净环境/CI 使用 `npm ci` 以保证可复现安装。
- 多项目复用建议：优先 workspaces；跨仓库复用可抽为 npm 包。

## 3. 文件地图 (File Map)

```
.
├── index.html                    # 主页面入口与 UI 控件
├── package.json                  # 脚本与依赖
├── tsconfig.json                 # TS 严格配置与路径别名
├── vite.config.ts                # Vite 配置（别名与多页面入口）
├── docs/
│   ├── choreography-design.md    # 编排系统设计文档
│   └── development-log.md        # 开发日志/变更记录
├── pages/                        # 调试页 HTML 入口
│   ├── audio-analyzer/index.html # 音频分析可视化页面
│   ├── firework-types/index.html # 烟花类型展示
│   ├── launcher-test/index.html  # 发射器测试
│   ├── particle-physics/index.html # 粒子物理演示
│   └── renderer-debug/index.html # 渲染器调试
└── src/
    ├── main.ts                   # 应用主流程（分析、编排、渲染）
    ├── audio/
    │   ├── AudioAnalyzer.ts      # 事件提取与时间线生成
    │   ├── FrequencyAnalyzer.ts  # FFT 频谱/频段能量
    │   ├── BeatDetector.ts       # 节拍检测与 BPM 估计
    │   └── Timeline.ts           # 播放时间线与事件调度
    ├── choreography/
    │   ├── Choreographer.ts      # 编排主引擎
    │   ├── RuleEngine.ts         # 规则系统与优先级决策
    │   ├── PatternLibrary.ts     # 10 种表现形式
    │   └── SectionDetector.ts    # 音乐段落检测
    ├── core/
    │   ├── Firework.ts           # 烟花实体
    │   ├── Particle.ts           # 粒子物理
    │   └── types.ts              # 核心类型与常量
    ├── engine/
    │   ├── Renderer.ts           # 画布渲染器
    │   ├── ParticleSystem.ts     # 粒子系统管理
    │   └── FireworkLauncher.ts   # 发射器
    ├── pages/                    # 调试页脚本
    ├── styles/                   # 页面样式
    └── utils/                    # 数学与画布工具
```

## 4. 当前进度快照 (State Snapshot)

- ✅ 已完成功能
  - 音频上传 → 事件提取 → 频谱分析 → 节拍检测 → 编排 → 播放渲染完整链路。
  - 10 种编排表现形式 + 规则引擎 + 段落检测。
  - 主站演示模式/音乐模式/暂停控制。
  - 多个调试页（音频分析、烟花类型、粒子物理、渲染器、发射器）。
- 🚧 进行中任务 (WIP)
  - 未发现明确 WIP 或 TODO；如有新增请更新此处。
- 🐛 已知 Bug/Hack
  - 音频与编排阈值为硬编码（`src/audio/AudioAnalyzer.ts`、`src/choreography/RuleEngine.ts`），需要按曲风调参。
  - `PatternLibrary` 内部通过 `setTimeout` 排程，暂停/停止时不会取消已排队的发射。

## 5. 下一步指令 (Next Actions)

1. `npm run dev`，验证主页演示模式、音乐模式与暂停按钮是否正常。
2. 打开 `/pages/audio-analyzer/`，用短音频验证 BPM/事件数量与频谱显示是否合理。
3. 若需要提升表现密度或节奏贴合度，优先调整 `RuleEngine.ts` 与 `AudioAnalyzer.ts` 的阈值，并记录到 `docs/development-log.md`。

## 维护约定

- 结构变动时更新“文件地图”，行为变动时更新“进度快照”。
- 每次迭代完成后更新本文件的日期与下一步指令。
- 依赖变动需更新 `package-lock.json`，避免混用包管理器。
