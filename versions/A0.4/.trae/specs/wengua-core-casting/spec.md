# 问卦核心掷爻闭环 Spec

> **PRD**: `docs/PRD-问卦-v0.2.md`  
> **版本**: v0.2 MVP  
> **管线工程师**: spec-pipeline  
> **日期**: 2026-07-02

## Why

当前 `app.js` 掷爻逻辑全部为 TODO，`animation.js` 三个方法均为空壳，`style.css` 缺失结果展示和爻的样式。点击按钮后仅移除 `hidden` class，无任何实际功能。数据层已补全（`gua-data.js` 64 卦全部就绪），但逻辑层和展示层为零。

具体缺陷：
1. `app.js` 第 9-12 行：`btnCast` 事件监听器只做了 `resultDiv.classList.remove("hidden")`，无掷爻逻辑、无查表、无渲染
2. `animation.js` 三个方法（`castCoin`、`drawGua`、`highlightChangingLines`）均为 TODO 注释
3. `gua-display` 区始终显示 placeholder 文字"静心凝神，掷爻起卦"
4. `#result` 区 `gua-name` / `gua-symbol` / `gua-interpretation` 三个 slot 从未被写入内容
5. `style.css` 无爻图、动爻高亮、变卦卡片等样式

## Meta

- **优先级**: P0
- **估算工时**: 2.5 人天
- **影响 Spec**: 无（新项目首个功能性 Spec）
- **依赖**: `gua-data.js` 64 卦数据（✅ 已就绪）

## What Changes

- **app.js** — 实现完整掷爻→编码→查表→变卦→朱熹变占法→渲染流程
- **animation.js** — 实现逐爻绘制动画 + 铜钱旋转动画 + 动爻高亮
- **style.css** — 新增爻线样式、卦符大字号、动爻金色高亮、变卦卡片、逐爻容器
- **index.html** — 结果区结构扩展（无需大改，现有 DOM 结构已够用）

## Impact

- Affected specs: 无
- Affected code:
  - `js/app.js`（全部重写逻辑部分）
  - `js/animation.js`（三个方法从 TODO 到实现）
  - `css/style.css`（新增 ~80 行样式）
  - `index.html`（可能微调 DOM id）

---

## ADDED Requirements

### Requirement: R1 — 铜钱掷爻六次循环
The system SHALL simulate six coin tosses, each generating a Yao (爻) with type and changing flag.

```javascript
// 单次掷爻
function castOnce() {
    const coins = [Math.random(), Math.random(), Math.random()];
    const heads = coins.filter(c => c >= 0.5).length; // >=0.5 为正面
    // 2正面→少阳⚊(阳,不变), 1正面→少阴⚋(阴,不变)
    // 3正面→老阴⚋→⚊(阴,会变), 0正面→老阳⚊→⚋(阳,会变)
    const type = (heads === 2 || heads === 0) ? 'yang' : 'yin';
    const changing = (heads === 3 || heads === 0);
    return { type, changing, value: (type === 'yang' ? 1 : 0) };
}
```

#### Scenario: 用户点击掷爻起卦 — 六次掷爻依次执行
- **WHEN** 用户点击"掷爻起卦"按钮
- **THEN** 系统依次执行 6 次 `castOnce()`，间隔 0.5s/次
- **AND** 每次掷爻结果追加到六爻数组（index 0=初爻）
- **AND** 掷爻期间按钮 disabled，防止重复点击

#### Scenario: 掷爻结果正确映射到爻类型
- **WHEN** 三枚铜钱正面数为 2
- **THEN** 生成少阳爻（阳，`changing=false`）
- **WHEN** 三枚铜钱正面数为 1
- **THEN** 生成少阴爻（阴，`changing=false`）
- **WHEN** 三枚铜钱正面数为 3
- **THEN** 生成老阴爻（阴，`changing=true`）
- **WHEN** 三枚铜钱正面数为 0
- **THEN** 生成老阳爻（阳，`changing=true`）

---

### Requirement: R2 — 二进制编码 + 查表获得本卦
The system SHALL encode six Yao lines into a 6-bit binary string and look up the corresponding Gua.

```javascript
function findGua(yaoLines) {
    // bit0(LSB)=初爻, bit5(MSB)=上爻
    const binary = yaoLines.map(y => y.value).join('');
    return GUA_BY_BINARY[binary] || null;
}
```

#### Scenario: 六爻全阳 → 乾为天
- **WHEN** 六爻均为阳爻（111111）
- **THEN** `findGua()` 返回 `{ id:1, name:"乾为天", symbol:"䷀" }`

#### Scenario: 六爻全阴 → 坤为地
- **WHEN** 六爻均为阴爻（000000）
- **THEN** `findGua()` 返回 `{ id:2, name:"坤为地", symbol:"䷁" }`

#### Scenario: 任意组合均能查表
- **WHEN** 任意 6 位 binary 字符串
- **THEN** `GUA_BY_BINARY[binary]` 返回非 null 的唯一 Gua 对象

---

### Requirement: R3 — 变卦生成（动爻翻转）
The system SHALL flip the bits at changing Yao positions and look up the resulting Gua.

```javascript
function getBianGua(benGua, yaoLines) {
    const changingIndices = [];
    const newBinary = yaoLines.map((y, i) => {
        if (y.changing) { changingIndices.push(i); return 1 - y.value; }
        return y.value;
    }).join('');
    if (changingIndices.length === 0) return { gua: null, indices: [] };
    return { gua: GUA_BY_BINARY[newBinary], indices: changingIndices };
}
```

#### Scenario: 有动爻时生成变卦
- **WHEN** 本卦为乾（111111），第四爻为老阴（变为阳）
- **THEN** 变卦 binary 为 111011 → 天风姤 ䷫
- **AND** `changingIndices = [3]`（index 3 = 第四爻）

#### Scenario: 无动爻时不生成变卦
- **WHEN** 六爻全静（changing 全 false）
- **THEN** `bianGua` 为 null

---

### Requirement: R4 — 朱熹变占法解读焦点
The system SHALL determine the interpretation focus based on the number of changing lines per Zhu Xi's method.

| 动爻数 | 解读焦点 | 主来源 | 次来源 |
|--------|----------|--------|--------|
| 0 | 本卦卦辞 | `benGua.judgement` | — |
| 1 | 该动爻爻辞 | `benGua.lines[changingIndices[0]]` | — |
| 2 | 两爻爻辞（以上爻为主） | `benGua.lines[maxIdx]` | `benGua.lines[minIdx]` |
| 3 | 本卦卦辞 + 变卦卦辞 | `benGua.judgement` | `bianGua.judgement` |
| 4 | 变卦不变爻爻辞（以下爻为主） | `bianGua.lines[unchangedMinIdx]` | `bianGua.lines[unchangedMaxIdx]` |
| 5 | 变卦唯一不变爻爻辞 | `bianGua.lines[unchangedIdx]` | — |
| 6 | 变卦卦辞 / 用九用六 | `bianGua.judgement` / `yong` | — |

#### Scenario: 1 动爻 → 显示该爻爻辞
- **WHEN** 动爻数 = 1，位置为 index 2（九三）
- **THEN** 焦点为主显示 `benGua.lines[2]`，次显示为空

#### Scenario: 6 动爻 + 乾卦 → 用九
- **WHEN** 动爻数 = 6 且本卦为乾
- **THEN** 焦点为 `yong: "用九：见群龙无首，吉。"`

#### Scenario: 6 动爻 + 坤卦 → 用六
- **WHEN** 动爻数 = 6 且本卦为坤
- **THEN** 焦点为 `yong: "用六：利永贞。"`

---

### Requirement: R5 — 结果区 DOM 渲染
The system SHALL populate `#result` with gua name, symbol, judgement, six line texts, and focus interpretation.

#### Scenario: 本卦结果展示
- **WHEN** 掷爻完成且本卦已查得
- **THEN** `#gua-name` 显示卦名（如"乾为天 ䷀"）
- **AND** `#gua-symbol` 显示卦符（如"䷀"）
- **AND** `#gua-interpretation` 显示：卦辞 + 六爻爻辞列表（自下而上）+ 焦点解读
- **AND** 动爻条目以 `.changing` class 高亮

#### Scenario: 有变卦时额外展示变卦卡片
- **WHEN** 变卦不为 null
- **THEN** 展示变卦卦名、卦符、卦辞
- **AND** 动爻标注从本卦→变卦的变化箭头

#### Scenario: 再次点击清除旧结果
- **WHEN** 用户第二次点击"掷爻起卦"
- **THEN** 旧结果清除，`#gua-display` 恢复 placeholder 状态
- **AND** 新掷爻流程启动

---

### Requirement: R6 — 逐爻绘制动画
The system SHALL animate each Yao line drawing bottom-up with 0.5s interval.

#### Scenario: 逐爻动画从下往上绘制
- **WHEN** 每次 `castOnce()` 完成
- **THEN** 对应爻在 `#gua-display` 中以动画方式出现（从低到高排列）
- **AND** 阳爻显示为实线 "━━━"，阴爻显示为断线 "╌ ╌"
- **AND** 动爻额外显示变化标记（●/×）
- **AND** 间隔 0.5s

---

### Requirement: R7 — 按钮状态管理
The system SHALL disable the cast button during casting and re-enable it after rendering.

#### Scenario: 掷爻进行中按钮禁用
- **WHEN** 用户点击"掷爻起卦"后，6 次掷爻未完成
- **THEN** 按钮 disabled + 文字变为"起卦中…"
- **AND** 不可再次点击

#### Scenario: 掷爻完成后按钮恢复
- **WHEN** 6 次掷爻 + 渲染全部完成
- **THEN** 按钮恢复 enabled + 文字变为"再掷一卦"

---

## MODIFIED Requirements

无（新功能，无修改项）

## REMOVED Requirements

无
