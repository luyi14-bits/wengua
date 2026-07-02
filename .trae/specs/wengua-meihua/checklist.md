# Checklist — 梅花易数双模式

> **Spec**: `spec.md` | **Tasks**: `tasks.md`

---

## Task 1: 模式切换标签栏

- [x] `#mode-tabs` 包含两个 `<button>`: `tab-tongqian` 和 `tab-meihua`
- [x] 页面加载默认铜钱标签 `.active`，梅花控件 `#meihua-controls` 隐藏
- [x] 点击梅花标签：铜钱标签取消 `.active`，梅花标签加 `.active`，`#btn-cast` 隐藏，`#meihua-controls` 显示
- [x] 点击铜钱标签：梅花标签取消 `.active`，铜钱标签加 `.active`，`#meihua-controls` 隐藏，`#btn-cast` 显示
- [x] 切换模式时 `#gua-display` 清空（恢复 placeholder）、`#result` 隐藏
- [x] 铜钱模式结果保留：切走后切回，上次结果重新显示（DOM 持久化）
- [x] 标签样式符合暗金主题（`#c9a94e` 激活色），hover/active 有反馈
- [x] 480px 宽度下标签不换行

## Task 2: 梅花算法核心

- [x] `XIANTIAN_TRIGRAM` 数组: [null, '☰','☱','☲','☳','☴','☵','☶','☷'] 索引 1-8
- [x] `TRIGRAM_TO_BINARY` 映射: 乾111/兑110/离101/震100/巽011/坎010/艮001/坤000
- [x] `numberToTrigram(15)` → `{ symbol:'☶', xiantianNum:7 }` (15%8=7→艮)
- [x] `numberToTrigram(8)` → `{ symbol:'☷', xiantianNum:8 }` (余0→坤=8)
- [x] `meihuaCast(15,9,20)` → `benGua.id===26` (山天大畜䷙), `dongYao===2`
- [x] `meihuaCast(8,16,6)` → `benGua.id===2` (坤为地䷁), `dongYao===6`
- [x] `calcHuGua` 遍历 64 卦均返回非 null
- [x] `TRIGRAM_WUXING`: 乾金/兑金/离火/震木/巽木/坎水/艮土/坤土
- [x] `WUXING_SHENG`: 木→火→土→金→水→木 闭环
- [x] `WUXING_KE`: 木→土→水→火→金→木 闭环
- [x] `calcTiYong(☰, ☳, 2)` → `tiGua=☰, yongGua=☳` (动爻≤3→体=上卦)
- [x] `calcTiYong(☰, ☳, 5)` → `tiGua=☳, yongGua=☰` (动爻≥4→体=下卦)
- [x] `judgeShengKe('木','水')` → `{ relation:'用生体', judgment:'大吉', level:5 }`
- [x] `judgeShengKe('金','金')` → `{ relation:'体用比和', judgment:'吉', level:4 }`
- [x] `judgeShengKe('木','土')` → `{ relation:'体克用', judgment:'小吉', level:3 }`
- [x] `judgeShengKe('木','火')` → `{ relation:'体生用', judgment:'泄气', level:2 }`
- [x] `judgeShengKe('木','金')` → `{ relation:'用克体', judgment:'凶', level:1 }`

## Task 3: 梅花结果渲染

- [x] 结果区依次渲染四张卡片：本卦 → 互卦 → 变卦 → 体用生克 → 焦点
- [x] 本卦卡片含：卦名 + 卦符（Unicode）+ 卦辞 + 数理来源文案
- [x] 数理来源文案格式正确（如"上卦 7(艮☶)，下卦 1(乾☰)，动在第 2 爻"）
- [x] 互卦卡片含：卦名 + 卦符 + "互卦 · 揭示发展过程中的中间状态"
- [x] 变卦卡片复用 v0.2 `.bian-gua-card` 样式（金色边框、深色背景）
- [x] 体用生克卡片按 level 正确着色：5绿/4蓝/3金/2黄/1红
- [x] 体用生克卡片显示 emoji 图标：✅/✅/➡️/⚠️/❌
- [x] 焦点解读复用 `getInterpretationFocus()`，动爻=1 场景正确
- [x] `#gua-display` 显示本卦上下卦八卦符号（如"☶☰"）

## Task 4: 数字输入交互

- [x] 三输入框 label 为"上卦数"/"下卦数"/"动爻数"
- [x] 空值输入时点"起卦"→ 红色边框提示，不起卦
- [x] 负数/-0 输入→ 红色边框 + 起卦拦截
- [x] 小数输入→ 红色边框 + 起卦拦截
- [x] >9999 输入→ 红色边框 + 起卦拦截
- [x] "🎲 随机数字"→ 三框填入 [1,999] 随机整数 + 立即触发 `doMeihuaCast()`
- [x] "🕐 用当前时间"→ 按公历年月日时法正确计算三数 + 立即触发
- [x] 正常输入 → 点"起卦"→ 流程正确执行
- [x] 起卦中按钮 disabled，完成后恢复

## Task 5: 样式补充

- [x] 输入框暗金主题：深色背景 + `#c9a94e` border-color on focus
- [x] 输入框 error 状态：红色边框（`#e05555`）
- [x] `.mode-tab` 切换 transition 0.2s 流畅
- [x] 体用生克卡片 5 种颜色视觉可区分
- [x] 梅花八卦符号字号 ≥ 36px，双符号并排不溢出
- [x] 480px 下三输入框 + 辅助按钮不换行

## 跨模块 / 回归红线

- [x] 铜钱模式全部 v0.2 功能正常（掷爻→动画→查表→变卦→朱熹→渲染）
- [x] 标签切换 5 次以上无 JS error
- [x] 铜钱和梅花各运行 3 次 → Console 0 error
- [x] 不引入新的 CDN/库/npm 依赖
- [x] `gua-data.js` 仅读取不修改
- [x] Chrome / Firefox / Edge 下 Unicode 八卦符号渲染正常

## 总览

| 分类 | 项数 |
|------|:---:|
| Task 1 | 8 |
| Task 2 | 17 |
| Task 3 | 9 |
| Task 4 | 9 |
| Task 5 | 6 |
| 跨模块 | 6 |
| **合计** | **55 ✓** |
