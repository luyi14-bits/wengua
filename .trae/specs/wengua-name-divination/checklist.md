# Checklist — 姓名起卦

> **Spec**: `spec.md` | **Tasks**: `tasks.md`

---

## Task 1: 康熙字典笔画数据

- [x] `js/stroke-data.js` 存在，声明 `var STROKE_MAP = {...}`
- [x] STROKE_MAP 条目数 ≥ 3000
- [x] `STROKE_MAP['龙'] === 16`（简体5→康熙龍16）
- [x] `STROKE_MAP['马'] === 10`
- [x] `STROKE_MAP['刘'] === 15`
- [x] `STROKE_MAP['陈'] === 11`
- [x] 偏旁部首规则：扌→4, 氵→4, 忄→4, 王→5, 礻→5, 衤→6
- [x] `index.html` 按序加载 `gua-data.js → stroke-data.js → ... → app.js`

## Task 2: 姓名解析 + 笔画计算

- [x] `COMPOUND_SURNAMES` 含 ≥50 个常见复姓
- [x] `parseName('王明')` → `{ type:'single-single', surname:['王'], given:['明'] }`
- [x] `parseName('诸葛亮')` → `{ type:'single-double', surname:['诸'], given:['葛','亮'] }`
- [x] `parseName('欧阳修')` → `{ type:'compound-single', surname:['欧','阳'], given:['修'] }`
- [x] `parseName('司马相如')` → `{ type:'compound-double', surname:['司','马'], given:['相','如'] }`
- [x] `calcNameStrokes` 对已收录字正确返回，未收录字返回 0 + 标记
- [x] `nameCast('诸葛亮')` → 本卦=山风蛊䷑

## Task 3: 姓名卦渲染

- [x] 笔画明细展示"诸→諸(15画) / 葛→葛(12画) / 亮→亮(9画)"格式
- [x] 命名评价卡片复用 FATE_LEVEL 五级文案
- [x] level=5 → "大吉·旺命名 ✅"
- [x] level=1 → "凶·阻命名 ❌"
- [x] 未收录字显示"未收录"标签
- [x] 本卦/互卦/变卦/体用生克卡片正常渲染（复用 v0.3 逻辑）

## Task 4: 第三标签 + 输入界面

- [x] `#mode-tabs` 含三个标签：[铜钱掷爻][梅花易数][姓名起卦]
- [x] 默认铜钱标签 active
- [x] 点击"姓名起卦"→切换 name 模式 → 显示姓名输入区
- [x] `#name-controls` 含 `<input type="text">` + "起卦"按钮
- [x] 姓名起卦按钮点击 → nameCast → renderNameResult → 结果区显示
- [x] 铜钱/梅花/姓名三标签自由切换，各自保留状态

## Task 5: 样式

- [x] 姓名输入框深色主题 + 居中 + 大字号
- [x] 笔画明细 `.stroke-detail` 金色标签（诸→诸(15画)）
- [x] `.name-eval-card` 与 `.fate-card` 风格统一
- [x] 480px 下不溢出

## 跨模块 / 回归红线

- [x] 铜钱模式 v0.2 功能正常
- [x] 梅花三数模式 v0.3 功能正常
- [x] 梅花生辰模式正常
- [x] 三标签切换 5 次无 JS error
- [x] 姓名起卦 3 次 → Console 0 error
- [x] 不引入 CDN/库/npm 依赖
- [x] Chrome / Firefox / Edge 笔画数据显示正常

## 总览

| 分类 | 项数 |
|------|:---:|
| Task 1 | 8 |
| Task 2 | 7 |
| Task 3 | 6 |
| Task 4 | 6 |
| Task 5 | 4 |
| 跨模块 | 7 |
| **合计** | **38 ✓** |
