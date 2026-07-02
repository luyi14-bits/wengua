# Tasks — 姓名起卦

> **Spec**: `spec.md` | **PRD**: `docs/PRD-问卦-v0.4.md`

---

- [x] Task 1: 康熙字典笔画数据（`js/stroke-data.js`）
  - [x] SubTask 1.1: 创建 `js/stroke-data.js`，声明 `var STROKE_MAP = {...}` 含 3000+ 汉字→繁体康熙笔画映射
  - [x] SubTask 1.2: 内嵌偏旁部首规则（扌4/氵4/忄4/王5/礻5/衤6/阝左8右7/讠7）
  - [x] SubTask 1.3: `index.html` 中在 `gua-data.js` 之后加载 `<script src="js/stroke-data.js">`

- [x] Task 2: 姓名解析 + 笔画计算（`js/app.js`）
  - [x] SubTask 2.1: 声明 `COMPOUND_SURNAMES` 常见复姓表（50+条目）
  - [x] SubTask 2.2: 实现 `parseName(name)` — 识别四种结构
  - [x] SubTask 2.3: 实现 `calcNameStrokes(parsed)` — 查表返回每字康熙笔画数
  - [x] SubTask 2.4: 实现 `nameCast(name)` — 串联 解析→查笔画→meihuaCast→完整结果

- [x] Task 3: 姓名卦渲染（`js/app.js`）
  - [x] SubTask 3.1: 实现 `renderNameResult(result)` — 主渲染函数
  - [x] SubTask 3.2: 笔画明细 DOM — 每字→繁体→画数展示
  - [x] SubTask 3.3: 命名评价卡片 — 复用 FATE_LEVEL 五级文案
  - [x] SubTask 3.4: 未收录字提示
  - [x] SubTask 3.5: 复用本卦/互卦/变卦/体用卡片

- [x] Task 4: 第三标签 + 输入界面（`index.html` + `js/app.js`）
  - [x] SubTask 4.1: `index.html` 在 `#mode-tabs` 新增第三个按钮：`<button id="tab-name" class="mode-tab">姓名起卦</button>`
  - [x] SubTask 4.2: `index.html` 新增 `<div id="name-controls" class="hidden">` — 姓名输入框 + 起卦按钮
  - [x] SubTask 4.3: `js/app.js` 扩展 `switchMode` 支持 'name' 模式
  - [x] SubTask 4.4: 姓名起卦按钮绑定 `nameCast()` 调用链

- [x] Task 5: 样式（`css/style.css`）
  - [x] SubTask 5.1: `#name-controls` 输入框样式 — 居中单行大字号
  - [x] SubTask 5.2: `.stroke-detail` 笔画明细行 — 金色标签+白色数字
  - [x] SubTask 5.3: `.name-eval-card` 命名评价卡片 — 风格统一 `.tiyong-card`
  - [x] SubTask 5.4: 480px 适配

# Task Dependencies

```
Task 1 (stroke-data.js) ──独立──
Task 2 (逻辑)          ──依赖 Task 1
Task 3 (渲染)          ──依赖 Task 2
Task 4 (标签+输入)     ──依赖 Task 1? NO（纯DOM）
Task 5 (样式)           ──与 Task 3/4 可并行
```

- Task 1 完全独立
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 可与 Task 1-3 并行（纯 DOM 结构）
- Task 5 与 Task 3/4 可并行

# 工时估算

| Task | 子任务数 | 估算人天 | 开发者 |
|------|---------|---------|--------|
| Task 1 | 3 | 0.8 | Dev |
| Task 2 | 4 | 0.6 | Dev |
| Task 3 | 5 | 0.5 | Dev |
| Task 4 | 4 | 0.4 | Dev |
| Task 5 | 4 | 0.2 | Dev |
| **合计** | **20** | **2.5** | |
