# Checklist — 问卦核心掷爻闭环

> **Spec**: `spec.md` | **Tasks**: `tasks.md`

---

## Task 1: 掷爻核心逻辑

- [ ] `castOnce()` 返回对象含 `type`（'yang'/'yin'）、`changing`（boolean）、`value`（0/1）三个字段
- [ ] `castOnce()` 四种结果概率正确：少阳(2正面)≈37.5%，少阴(1正面)≈37.5%，老阴(3正面)≈12.5%，老阳(0正面)≈12.5%
- [ ] `findGua(yaoLines)` 对 `["111111"]` 返回乾为天（id=1）
- [ ] `findGua(yaoLines)` 对 `["000000"]` 返回坤为地（id=2）
- [ ] `findGua(yaoLines)` 对所有 64 种合法 binary 值均返回非 null
- [ ] `getBianGua()` 无动爻时返回 `{ gua: null, indices: [] }`
- [ ] `getBianGua()` 1 个动爻时正确翻转对应 bit 并查表
- [ ] `getInterpretationFocus()` 覆盖 7 种动爻数情况（0/1/2/3/4/5/6），每种输出正确的 `type` 和 `primary`
- [ ] 乾卦 6 动爻 → `type: 'yongjiu'`，坤卦 6 动爻 → `type: 'yongliu'`
- [ ] YAO_LABELS 常量：初爻 index=0 → "初九"/"初六"，上爻 index=5 → "上九"/"上六"

## Task 2: 掷爻主流程 + 按钮状态

- [ ] 点击按钮后，6 次掷爻依次执行，每次间隔约 0.5s
- [ ] 掷爻期间按钮 `disabled=true`，文字变为"起卦中…"
- [ ] 6 次掷爻完成后，按钮恢复 `disabled=false`，文字变为"再掷一卦"
- [ ] 第二次点击"再掷一卦"时，`#gua-display` 内容清空，结果区清空，重新开始掷爻
- [ ] 快速连续点击按钮不会触发多次掷爻流程（disabled 防护）

## Task 3: 逐爻绘制动画

- [ ] 每次 `castOnce()` 完成后，对应爻追加到 `#gua-display`
- [ ] 爻从下往上排列（初爻在底部，上爻在顶部）
- [ ] 阳爻显示为 "━━━"，阴爻显示为 "╌ ╌"
- [ ] 老阳显示变化标记（如 ●），老阴显示变化标记（如 ×）
- [ ] 动爻有 `yao-changing` class
- [ ] 逐爻动画有可见过渡效果（fadeIn / slideUp）

## Task 4: 结果区 DOM 渲染

- [ ] `#gua-name` 显示卦名（如"乾为天"）
- [ ] `#gua-symbol` 显示 Unicode 卦符（如"䷀"）
- [ ] `#gua-interpretation` 显示完整卦辞（如"元亨利贞。"）
- [ ] 六爻爻辞从 `lines[0]`（初爻）到 `lines[5]`（上爻）顺序展示，初爻在底部
- [ ] 动爻对应的爻辞条目有 `.changing` class
- [ ] 存在变卦时，展示变卦卦名 + 卦符 + 卦辞
- [ ] 朱熹焦点解读标注"主看"和"次看"
- [ ] 焦点区内容正确（对照 Spec R4 表格）

## Task 5: 样式补充

- [ ] `.yao` 有居中、适当字号（≥18px）、行间距（≥8px）
- [ ] `.yao-changing` 有金色（`#c9a94e`）视觉区分（如边框/光晕/颜色）
- [ ] `.bian-gua-card` 有深色背景、圆角、金色描边
- [ ] `.gua-focus` 有金色左边框 + 稍大字号
- [ ] `#gua-symbol` 卦符字号 ≥ 48px 居中
- [ ] 暗金主题（`#0f0f0f` 底 + `#c9a94e` 金色）一致性未被破坏
- [ ] 整体在 480px 宽度移动端不溢出、不断行

## Task 6: HTML 微调

- [ ] `#result` 初始无 `hidden` class（或由 JS 动态控制显隐）
- [ ] `#gua-display` 初始显示 placeholder 文字"静心凝神，掷爻起卦"
- [ ] 所有 id 引用（`gua-name`, `gua-symbol`, `gua-interpretation`）在 JS 中可用

## 跨模块红线

- [ ] Console 无 JS 报错（DevTools 打开状态下掷爻 3 次）
- [ ] 不引入任何第三方 CDN/库/npm 依赖
- [ ] `gua-data.js` 仅被读取，不被修改
- [ ] Chrome / Firefox / Edge 均正常渲染 Unicode 卦符

## 总览

| 分类 | 项数 |
|------|:---:|
| Task 1 | 10 |
| Task 2 | 5 |
| Task 3 | 6 |
| Task 4 | 8 |
| Task 5 | 7 |
| Task 6 | 3 |
| 跨模块 | 4 |
| **合计** | **43** |
