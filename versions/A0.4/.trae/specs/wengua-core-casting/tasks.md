# Tasks — 问卦核心掷爻闭环

> **Spec**: `spec.md`  
> **版本**: v0.2 MVP

---

- [ ] Task 1: 掷爻核心逻辑（`js/app.js`）
  - [ ] SubTask 1.1: 实现 `castOnce()` 函数 — 三枚铜钱模拟，返回 `{ type, changing, value }`
  - [ ] SubTask 1.2: 实现 `findGua(yaoLines)` 函数 — 6 位二进制编码 → `GUA_BY_BINARY` 查表
  - [ ] SubTask 1.3: 实现 `getBianGua(benGua, yaoLines)` 函数 — 动爻翻转 + 二次查表
  - [ ] SubTask 1.4: 实现 `getInterpretationFocus(benGua, bianGua, changingIndices)` — 朱熹变占法 7 种情况判定
  - [ ] SubTask 1.5: 实现 YAO_LABELS 常量 — `["初", "二", "三", "四", "五", "上"]` + 九/六拼接

- [ ] Task 2: 掷爻主流程 + 按钮状态（`js/app.js`）
  - [ ] SubTask 2.1: 重构 `btnCast` 事件监听器 — 串联 6 次 `castOnce()` 循环（async/await 或 setTimeout chain）
  - [ ] SubTask 2.2: 实现 button disabled 状态切换 — "起卦中…" / "再掷一卦"
  - [ ] SubTask 2.3: 实现旧结果清除逻辑 — 第二次点击重置 DOM + yaoLines 数组

- [ ] Task 3: 逐爻绘制动画（`js/animation.js`）
  - [ ] SubTask 3.1: 实现 `drawGua(container, yaoLines)` — 在 `#gua-display` 中从下往上逐爻渲染 DOM
  - [ ] SubTask 3.2: 阳爻 HTML 结构: `<div class="yao yao-yang">━━━</div>`
  - [ ] SubTask 3.3: 阴爻 HTML 结构: `<div class="yao yao-yin">╌ ╌</div>`
  - [ ] SubTask 3.4: 动爻标记: 老阳 → 加 `●`，老阴 → 加 `×`，class `yao-changing`
  - [ ] SubTask 3.5: 每次追加后触发 CSS transition（fadeIn 或 slideUp），间隔 0.5s

- [ ] Task 4: 结果区 DOM 渲染（`js/app.js`）
  - [ ] SubTask 4.1: 实现 `renderResult(result)` — 填充 `#gua-name`、`#gua-symbol`、`#gua-interpretation`
  - [ ] SubTask 4.2: 六爻爻辞列表渲染 — 自下而上排列（`lines[0]`=初爻在底部）
  - [ ] SubTask 4.3: 动爻条目添加 `.changing` class
  - [ ] SubTask 4.4: 变卦卡片渲染（如有）— 卦名 + 卦符 + 卦辞
  - [ ] SubTask 4.5: 朱熹焦点解读渲染 — 标注"主看"和"次看"区分

- [ ] Task 5: 样式补充（`css/style.css`）
  - [ ] SubTask 5.1: `.yao` 基础样式 — 居中、字号、间距、transition
  - [ ] SubTask 5.2: `.yao-yang` vs `.yao-yin` 区分样式
  - [ ] SubTask 5.3: `.yao-changing` 动爻高亮 — 金色（`#c9a94e`）边框 + 光晕
  - [ ] SubTask 5.4: `.bian-gua-card` 变卦卡片 — 背景 `#1a1a1a`、圆角、金色描边
  - [ ] SubTask 5.5: `.gua-focus` 焦点解读区 — 金色左边框 + 稍大字号
  - [ ] SubTask 5.6: `#gua-symbol` 卦符字号调大（如 48px）居中
  - [ ] SubTask 5.7: 爻辞列表 `.yao-line-item` 样式 — 行高、间距、`.changing` 变体

- [ ] Task 6: HTML 微调（`index.html`）
  - [ ] SubTask 6.1: `#result` 区移除 `hidden` class（由 JS 控制显示时机）
  - [ ] SubTask 6.2: 确保 `#gua-display` 初始状态展示 placeholder

# Task Dependencies

- Task 2 依赖 Task 1（需要 `castOnce`、`findGua`、`getBianGua`、`getInterpretationFocus` 四个函数先就绪）
- Task 3 和 Task 4 **可并行**（动画和渲染独立）
- Task 5 和 Task 3/4 **可并行**（样式和逻辑独立）
- Task 6 可与 Task 2-5 并行

# 工时估算

| Task | 子任务数 | 估算人天 | 开发者 |
|------|---------|---------|--------|
| Task 1 | 5 | 0.5 | Dev |
| Task 2 | 3 | 0.5 | Dev |
| Task 3 | 5 | 0.5 | Dev |
| Task 4 | 5 | 0.5 | Dev |
| Task 5 | 7 | 0.3 | Dev |
| Task 6 | 2 | 0.2 | Dev |
| **合计** | **27** | **2.5** | |
