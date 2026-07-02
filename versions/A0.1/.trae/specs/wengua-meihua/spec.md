# 梅花易数双模式 Spec

> **PRD**: `docs/PRD-问卦-v0.3.md`  
> **版本**: v0.3 梅花易数  
> **管线工程师**: spec-pipeline  
> **日期**: 2026-07-02

## Why

当前问卦只有铜钱掷爻一种模式。用户无法快速起卦（必须等 6 次掷爻动画），也无法获得互卦、体用生克等梅花易数特有的多维度解读。产品定位为"双模式算卦工具"，梅花易数是 research 阶段就规划好的差异化核心功能。

具体差距：
1. 无模式切换 UI — 用户没得选，只有一条路
2. 无法数字起卦 — 铜钱模式必须随机掷爻，用户不能自选数字
3. 缺互卦计算 — 铜钱模式不生成互卦
4. 缺体用生克 — 无五行吉凶分析
5. 无三数输入交互（随机/时间） — 梅花起卦的标准入口缺失

## Meta

- **优先级**: P0
- **估算工时**: 3.0 人天
- **影响 Spec**: 无（新功能 Spec，依赖 wengua-core-casting ✅）
- **依赖**: `GUA_BY_BINARY`, `getInterpretationFocus()`, `findGua()` (v0.2 已就绪)

## What Changes

- **index.html** — 新增 `#mode-tabs` 模式切换标签 + `#meihua-controls` 梅花输入区（三输入框+辅助按钮+起卦按钮）
- **app.js** — 新增梅花算法函数簇 + 模式路由逻辑 + 铜钱逻辑包装（不破坏 v0.2）
- **style.css** — 新增标签样式、梅花输入区样式、梅花结果卡片样式（本卦/互卦/变卦/体用生克）
- **animation.js** — 无需改动（铜钱动画仅铜钱模式触发）

## Impact

- Affected specs: 无
- Affected code:
  - `index.html`（+~30 行：标签栏 + 输入区）
  - `js/app.js`（+~100 行：算法 + 模式路由 + 梅花渲染）
  - `css/style.css`（+~80 行：标签/输入/梅花卡片样式）
- **铜钱回归约束**: v0.2 所有代码逻辑不变，仅外层加 `currentMode` 路由

---

## ADDED Requirements

### Requirement: R1 — 模式切换标签栏
The system SHALL display a mode switch tab bar allowing users to toggle between two divination modes.

```html
<!-- 结构示意 -->
<div id="mode-tabs">
  <button id="tab-tongqian" class="mode-tab active">铜钱掷爻</button>
  <button id="tab-meihua" class="mode-tab">梅花易数</button>
</div>
```

```javascript
let currentMode = 'tongqian'; // 'tongqian' | 'meihua'

function switchMode(mode) {
    currentMode = mode;
    // 更新标签 active 状态
    // 切换控件区: #controls vs #meihua-controls
    // 保留另一模式的结果 DOM（不丢失状态）
}
```

#### Scenario: 默认进入铜钱模式
- **WHEN** 页面首次加载
- **THEN** `currentMode = 'tongqian'`，铜钱标签高亮
- **AND** 显示铜钱控件（`#btn-cast`），隐藏梅花控件

#### Scenario: 点击梅花标签切换
- **WHEN** 用户点击"梅花易数"标签
- **THEN** `currentMode = 'meihua'`，梅花标签高亮
- **AND** 隐藏铜钱按钮，显示梅花输入区
- **AND** 卦象展示区清空（`#gua-display` 恢复 placeholder）
- **AND** 结果区隐藏

#### Scenario: 模式切换保留对方结果
- **WHEN** 铜钱模式已掷出一卦结果
- **AND** 用户切换到梅花模式再切回铜钱
- **THEN** 铜钱模式结果重新显示（不丢失）

---

### Requirement: R2 — 梅花三数起卦算法
The system SHALL compute a Meihua Yishu divination from three user-supplied numbers using the Xiantian Bagua mapping.

```javascript
// 先天八卦数: 乾1兑2离3震4巽5坎6艮7坤8
const XIANTIAN_TRIGRAM = [null, '☰','☱','☲','☳','☴','☵','☶','☷'];

function numberToTrigram(n) {
    let num = n % 8;
    if (num === 0) num = 8; // 余0 → 坤
    return { symbol: XIANTIAN_TRIGRAM[num], xiantianNum: num };
}

function meihuaCast(num1, num2, num3) {
    const upper = numberToTrigram(num1);       // 上卦
    const lower = numberToTrigram(num2);       // 下卦
    const dongYao = num3 % 6 === 0 ? 6 : num3 % 6; // 动爻 1-6

    // 上卦 binary + 下卦 binary → 6位 key → GUA_BY_BINARY
    const binary = TRIGRAM_TO_BINARY[upper.symbol] + TRIGRAM_TO_BINARY[lower.symbol];
    const benGua = GUA_BY_BINARY[binary];

    return { upper, lower, dongYao, benGua };
}
```

#### Scenario: PRD 标准用例验证
- **WHEN** 用户输入 15, 9, 20
- **THEN** 上卦 = 15%8=7 → 艮☶，下卦 = 9%8=1 → 乾☰，动爻 = 20%6=2
- **AND** binary = "001111" → 山天大畜䷙ (id=26)

#### Scenario: 余 0 边界
- **WHEN** num1=8, num2=16, num3=6
- **THEN** 上卦 = 8%8=0 → 坤☷(8)，下卦 = 16%8=0 → 坤☷(8)，动爻 = 6%6=0 → 上爻(6)
- **AND** binary = "000000" → 坤为地䷁ (id=2)

#### Scenario: 所有 384 种组合 (1-8)×(1-8)×(1-6) 均可正确查表
- **WHEN** 遍历上卦 1-8 × 下卦 1-8 × 动爻 1-6
- **THEN** 所有 384 种组合的 `benGua` 均非 null
- **AND** `dongYao` 范围均为 1-6

---

### Requirement: R3 — 互卦计算
The system SHALL derive the mutual gua (互卦) from the original gua's middle four lines using the overlapping line method.

```javascript
function calcHuGua(benGua) {
    // binary 格式: "bit5_bit4_bit3_bit2_bit1_bit0" (初爻=bit0=LSB)
    // 外互(上卦): bit4 + bit3 + bit2 → binary[1]+binary[2]+binary[3]
    // 内互(下卦): bit3 + bit2 + bit1 → binary[2]+binary[3]+binary[4]
    const b = benGua.binary;
    const outerBinary = b[1] + b[2] + b[3]; // 五爻+四爻+三爻
    const innerBinary = b[2] + b[3] + b[4]; // 四爻+三爻+二爻
    return GUA_BY_BINARY[outerBinary + innerBinary];
}
```

#### Scenario: 山天大畜䷙ 的互卦
- **WHEN** 本卦为山天大畜䷙ (binary="001111")
- **THEN** 外互 = bit4+bit3+bit2 = "011" → 011=二进制3(但需查八卦符号☴)，内互 = bit3+bit2+bit1 = "110" → 110=二进制6(☱)
- **AND** 互卦 binary = "011110" → 风泽中孚䷼ (id=61)

#### Scenario: 任何本卦都有互卦
- **WHEN** 遍历所有 64 卦
- **THEN** `calcHuGua(g)` 对每一卦均返回非 null 的有效 Gua

---

### Requirement: R4 — 体用判定与五行生克
The system SHALL determine the subject gua (体卦) and object gua (用卦) from the moving line position, then apply Five Elements (五行) generation-overcoming logic.

```javascript
const TRIGRAM_WUXING = {
    '☰':'金','☱':'金','☲':'火','☳':'木',
    '☴':'木','☵':'水','☶':'土','☷':'土'
};

// 五行生克表
const WUXING_SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
const WUXING_KE   = { '木':'土','土':'水','水':'火','火':'金','金':'木' };

function calcTiYong(upper, lower, dongYao) {
    if (dongYao >= 1 && dongYao <= 3) {
        return { tiGua: upper, yongGua: lower };   // 下卦为动
    } else {
        return { tiGua: lower, yongGua: upper };    // 上卦为动
    }
}

function judgeShengKe(tiWuxing, yongWuxing) {
    if (WUXING_SHENG[yongWuxing] === tiWuxing) return { relation:'用生体', judgment:'大吉', level:5 };
    if (tiWuxing === yongWuxing)               return { relation:'体用比和', judgment:'吉', level:4 };
    if (WUXING_KE[tiWuxing] === yongWuxing)    return { relation:'体克用', judgment:'小吉', level:3 };
    if (WUXING_SHENG[tiWuxing] === yongWuxing) return { relation:'体生用', judgment:'泄气', level:2 };
    if (WUXING_KE[yongWuxing] === tiWuxing)    return { relation:'用克体', judgment:'凶', level:1 };
}
```

#### Scenario: 动爻在下卦 → 体卦=上卦
- **WHEN** 动爻 = 2（下卦区域）
- **THEN** `tiGua = upper`, `yongGua = lower`

#### Scenario: 动爻在上卦 → 体卦=下卦
- **WHEN** 动爻 = 5（上卦区域）
- **THEN** `tiGua = lower`, `yongGua = upper`

#### Scenario: 用生体 → 大吉
- **WHEN** 体卦=震☳(木)，用卦=坎☵(水)
- **THEN** 水生木 → 用生体 → `judgment='大吉', level=5`

#### Scenario: 体生用 → 泄气
- **WHEN** 体卦=震☳(木)，用卦=离☲(火)
- **THEN** 木生火 → 体生用 → `judgment='泄气', level=2`

#### Scenario: 用克体 → 凶
- **WHEN** 体卦=震☳(木)，用卦=乾☰(金)
- **THEN** 金克木 → 用克体 → `judgment='凶', level=1`

---

### Requirement: R5 — 梅花结果区四卡片渲染
The system SHALL render four result cards vertically: original gua, mutual gua, changed gua, and Ti-Yong Sheng-Ke.

#### Scenario: 完整结果结构
- **WHEN** 梅花起卦完成（`meihuaCast()` + `calcHuGua()` + `getBianGua()` + `calcTiYong()` + `judgeShengKe()`）
- **THEN** `#gua-display` 显示本卦八卦符号组合
- **AND** `#result` 依次渲染:
  1. **本卦卡片** — 卦名+卦符+卦辞+数理来源（上卦×→下卦×）
  2. **互卦卡片** — 卦名+卦符+"揭示发展过程中的中间状态"
  3. **变卦卡片** — 卦名+卦符+卦辞+动爻标注（复用 v0.2 变卦卡片样式）
  4. **体用生克卡片** — 体卦名/用卦名/五行/生克关系/吉凶等级/解读
  5. **焦点解读** — 复用 `getInterpretationFocus()`（动爻固定=1）

#### Scenario: 体用生克卡片按等级着色
- **WHEN** `level=5`（大吉）
- **THEN** 卡片背景绿色调、显示 ✅
- **WHEN** `level=1`（凶）
- **THEN** 卡片背景红色调、显示 ❌
- **WHEN** `level=2`（泄气）
- **THEN** 卡片背景黄色调、显示 ⚠️

---

### Requirement: R6 — 数字输入交互
The system SHALL provide three number inputs with random and time-based auto-fill, plus input validation.

#### Scenario: 手动输入起卦
- **WHEN** 用户在三个输入框分别输入合法正整数
- **AND** 点击"起卦"按钮
- **THEN** 执行 `meihuaCast()` → 完整梅花起卦流程

#### Scenario: 输入验证拦截
- **WHEN** 任一输入框为空/负数/小数/非数字/>9999
- **THEN** 对应输入框红色边框提示
- **AND** 点击"起卦"时弹出提示而不执行

#### Scenario: 🎲 随机数字
- **WHEN** 用户点击"🎲 随机数字"
- **THEN** 三个输入框分别填入 [1,999] 随机整数
- **AND** 自动触发起卦

#### Scenario: 🕐 用当前时间
- **WHEN** 用户点击"🕐 用当前时间"
- **THEN** 按公历年月日时法: num1=(年+月+日)%8, num2=(年+月+日+时)%8, num3=(年+月+日+时)%6
- **AND** 自动填入并触发起卦

---

### Requirement: R7 — 铜钱模式回归保护
The system SHALL NOT break any v0.2 copper coin mode functionality.

#### Scenario: 铜钱模式完整回归
- **WHEN** 用户在铜钱模式下点击"掷爻起卦"
- **THEN** v0.2 全部流程正常运行（6次掷爻→动画→查表→变卦→朱熹焦点→结果渲染）
- **AND** 按钮 disabled/恢复正常
- **AND** Console 无 error

---

## MODIFIED Requirements

无（新功能 Spec，不对 v0.2 做修改）

## REMOVED Requirements

无
