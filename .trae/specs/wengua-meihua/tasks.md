# Tasks — 梅花易数双模式

> **Spec**: `spec.md` | **PRD**: `docs/PRD-问卦-v0.3.md`

---

- [x] Task 1: 模式切换标签栏（`index.html` + `css/style.css` + `js/app.js`）
  - [x] SubTask 1.1: `index.html` — 在 `#main-stage` 顶部新增 `<div id="mode-tabs">`，内含两个 `<button>` 标签
  - [x] SubTask 1.2: `index.html` — 在 `#controls` 之后新增 `<div id="meihua-controls" class="hidden">`，内含三输入框 + 辅助按钮 + 起卦按钮
  - [x] SubTask 1.3: `css/style.css` — `.mode-tab` / `.mode-tab.active` 标签样式（暗金主题，active 有下划线或背景色区分）
  - [x] SubTask 1.4: `js/app.js` — 实现 `switchMode(mode)` 函数：切换 `currentMode`、标签 active、控件显隐、`#gua-display` 清空
  - [x] SubTask 1.5: `js/app.js` — DOMContentLoaded 中绑定标签点击事件 + 默认 `switchMode('tongqian')`
  - [x] SubTask 1.6: `css/style.css` — `#meihua-controls` 梅花输入区布局样式（三输入框并排 + 辅助按钮行 + 起卦按钮）

- [x] Task 2: 梅花算法核心（`js/app.js`）
  - [x] SubTask 2.1: 声明 `XIANTIAN_TRIGRAM`、`TRIGRAM_TO_BINARY` 两个常量映射表
  - [x] SubTask 2.2: 实现 `numberToTrigram(n)` — 数字%8 → 先天八卦符号，余0→坤
  - [x] SubTask 2.3: 实现 `meihuaCast(num1, num2, num3)` — 三数 → 上卦+下卦+动爻+本卦，通过 `TRIGRAM_TO_BINARY` 合成 binary 查 `GUA_BY_BINARY`
  - [x] SubTask 2.4: 实现 `calcHuGua(benGua)` — 取中间四爻重新组合为上下互卦 → 查表
  - [x] SubTask 2.5: 声明 `TRIGRAM_WUXING`、`WUXING_SHENG`、`WUXING_KE` 三个常量
  - [x] SubTask 2.6: 实现 `calcTiYong(upper, lower, dongYao)` — 动爻≤3→体=上卦/用=下卦；动爻≥4→体=下卦/用=上卦
  - [x] SubTask 2.7: 实现 `judgeShengKe(tiWuxing, yongWuxing)` — 按生克表返回 { relation, judgment, level }（5级）

- [x] Task 3: 梅花结果渲染（`js/app.js`）
  - [x] SubTask 3.1: 实现 `renderMeihuaResult(result)` — 主渲染函数，串联四卡片 + 焦点
  - [x] SubTask 3.2: 本卦卡片 DOM — 卦名+卦符+卦辞+数理来源文案
  - [x] SubTask 3.3: 互卦卡片 DOM — 复用 `.bian-gua-card` 样式
  - [x] SubTask 3.4: 变卦卡片 DOM — 复用 v0.2 `getBianGua()` + `.bian-gua-card`
  - [x] SubTask 3.5: 体用生克卡片 DOM — 体卦名/用卦名/五行/生克关系/吉凶等级，按 level 着色
  - [x] SubTask 3.6: 复用 `getInterpretationFocus()` 生成焦点解读卡片
  - [x] SubTask 3.7: `#gua-display` 中展示本卦的上下卦八卦符号组合

- [x] Task 4: 数字输入交互（`js/app.js`）
  - [x] SubTask 4.1: 实现输入验证 `validateMeihuaInput()` — 非空、正整数、≤9999，不合法时红色边框+阻止起卦
  - [x] SubTask 4.2: 实现"🎲 随机数字"按钮
  - [x] SubTask 4.3: 实现"🕐 用当前时间"按钮
  - [x] SubTask 4.4: 实现 `doMeihuaCast()` — 读三框值→验证→`meihuaCast()`→写结果→调 `renderMeihuaResult`
  - [x] SubTask 4.5: 梅花起卦按钮 state 管理 — 起卦中 disabled / 完成后恢复

- [x] Task 5: 样式补充（`css/style.css`）
  - [x] SubTask 5.1: `#meihua-controls` 输入框样式 — 暗金主题、focus 状态、error 红色边框
  - [x] SubTask 5.2: `.mode-tab` 切换动画 — transition 0.2s
  - [x] SubTask 5.3: 体用生克卡片 5 级颜色 — level5绿/level4蓝/level3金/level2黄/level1红
  - [x] SubTask 5.4: 梅花模式 `#gua-display` 中八卦符号字号调大
  - [x] SubTask 5.5: 480px 移动端适配

# Task Dependencies

```
Task 1 ──┬──→ Task 3 ──→ Task 5
         │
Task 2 ──┘

Task 4 依赖 Task 1（需要输入区 DOM）+ Task 2（需要算法）
Task 5 与 Task 3/4 可并行（纯样式）
```

- Task 2 独立（纯算法，不依赖 DOM）
- Task 1 和 Task 2 **可并行**
- Task 3 依赖 Task 1（需要 DOM id）+ Task 2（需要算法返回值）
- Task 4 依赖 Task 1（需要输入区）+ Task 2（需要算法）+ Task 3（需要 `renderMeihuaResult`）
- Task 5 与 Task 3/4 **可并行**

# 工时估算

| Task | 子任务数 | 估算人天 | 开发者 |
|------|---------|---------|--------|
| Task 1 | 6 | 0.5 | Dev |
| Task 2 | 7 | 1.0 | Dev |
| Task 3 | 7 | 0.8 | Dev |
| Task 4 | 5 | 0.5 | Dev |
| Task 5 | 5 | 0.2 | Dev |
| **合计** | **30** | **3.0** | |
