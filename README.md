# 打ち上げ花火 (Hanabi-TS)

日式音乐烟花可视化系统 - 基于 TypeScript 的音频驱动烟花动画

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 功能特性

- **音乐模式**: 上传音频文件，自动分析节奏、频率，生成同步烟花效果
- **演示模式**: 无需音频，自动播放渐进式烟花动画
- **三种烟花类型**:
  - 牡丹 (Botan): 经典圆形烟花
  - 菊花 (Kiku): 复杂分层烟花
  - 柳树 (Willow): 垂落型烟花

## 使用方法

访问 `http://localhost:5173` 后：

1. **加载音乐**: 点击「加载音乐」按钮上传音频文件（支持 mp3/wav/ogg）
2. **演示模式**: 点击「演示模式」按钮观看自动播放
3. **暂停/继续**: 点击「暂停」按钮控制播放

## 项目结构

```
src/
├── audio/              # 音频分析模块
│   ├── AudioAnalyzer.ts      # 音频分析器
│   ├── BeatDetector.ts       # 节拍检测
│   ├── FrequencyAnalyzer.ts  # 频率分析
│   └── Timeline.ts           # 时间线管理
├── choreography/       # 烟花编排引擎
│   ├── Choreographer.ts      # 编排器
│   ├── PatternLibrary.ts     # 烟花模式库
│   └── SectionDetector.ts    # 音乐段落检测
├── core/               # 核心类型和烟花定义
│   ├── Firework.ts           # 烟花类
│   ├── Particle.ts           # 粒子类
│   └── types.ts              # 类型定义
├── engine/             # 渲染引擎
│   ├── Renderer.ts           # 画布渲染器
│   ├── ParticleSystem.ts     # 粒子系统
│   └── FireworkLauncher.ts   # 烟花发射器
└── utils/              # 工具函数
    ├── math.ts               # 数学工具
    └── canvas.ts             # 画布工具
```

## 调试页面

开发时可访问以下页面进行调试：

- `/pages/firework-types/` - 烟花类型测试
- `/pages/audio-analyzer/` - 音频分析可视化
- `/pages/particle-physics/` - 粒子物理演示
- `/pages/renderer-debug/` - 渲染器调试
- `/pages/launcher-test/` - 发射器测试

## 技术栈

- **框架**: TypeScript + Vite
- **图形**: Canvas 2D API
- **音频**: Web Audio API
- **代码规范**: ESLint + Prettier

## 开发命令

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 音频分析流程

1. 解码音频文件 → AudioBuffer
2. 频率分析 → 提取低音/中音/高音频段
3. 节拍检测 → 计算 BPM 和节拍点
4. 编排生成 → 根据音乐特征生成烟花序列
5. 实时渲染 → 粒子系统模拟物理效果

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

需要支持 Web Audio API 和 Canvas 2D。
