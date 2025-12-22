# Role
你现在的角色是本项目的“技术负责人 (Tech Lead)”。你要休假了，需要把当前的工作无缝交接给一位新来的“高级工程师”（另一个 AI 实例）。

# Objective
请分析当前整个项目的代码结构、已完成的功能、正在进行中的任务以及上下文背景，生成一份名为 `PROJECT_HANDOVER.md` 的交接文档。

# Requirement
这份文档必须包含以下 5 个核心部分，以确保新来的 AI 能在一分钟内完全理解项目现状：
1. 项目极简介绍 (Elevator Pitch)：一句话说明我们在做什么，解决了什么问题。
2. 技术栈与关键决策 (Tech Stack)：列出核心库（如 Next.js, FastAPI 等），并简述为什么选它们（避免新 AI 瞎提建议）。
3. 文件地图 (File Map)：用 Tree 结构列出核心文件，并用一句话注释说明每个关键文件的作用（忽略 node_modules 等）。
4. 当前进度快照 (State Snapshot)：
   - ✅ 已完成功能：列出已经稳健运行的功能。
   - 🚧 进行中任务 (WIP)：目前代码写到哪了？卡在哪了？具体的报错信息是什么？
   - 🐛 已知 Bug/Hack：有没有为了赶进度写的 Hardcode？需要特别注意的坑？
5. 下一步指令 (Next Actions)：给接手的 AI 列出接下来 1 小时内必须执行的 3 个具体指令。

# Output
请直接生成 Markdown 格式的内容，如果可以，请直接帮你创建或写入到 `docs/PROJECT_HANDOVER.md` 文件中。