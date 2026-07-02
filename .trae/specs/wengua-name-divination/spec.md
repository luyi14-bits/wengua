# 姓名起卦 Spec

> **PRD**: `docs/PRD-问卦-v0.4.md`
> **版本**: v0.4 姓名起卦
> **管线工程师**: spec-pipeline
> **日期**: 2026-07-02

## Why

当前问卦支持铜钱掷爻、梅花三数、时间起卦、生辰起卦四种方式，但缺少姓名起卦。姓名占是梅花易数经典应用（邵雍原书有载），用户输入姓名即可知道名字对命格的吉凶助损。research/07 已完整覆盖算法+笔画规则，但未实现。

具体差距：
1. 无康熙字典繁体笔画数据 — 姓名起卦必须用繁体笔画，简体字笔画差异巨大
2. 姓名结构识别缺失 — 单姓单名/单姓双名/复姓单名/复姓双名四种结构需要自动解析
3. 无姓名卦结果解读 — 命名评价"这名字旺你"/"这名字克你"是核心价值

## Meta

- **优先级**: P0
- **估算工时**: 2.5 人天
- **依赖**: v0.3 梅花引擎（meihuaCast/calcHuGua/getBianGua/calcTiYong/judgeShengKe）✅
- **新文件**: `js/stroke-data.js`

## What Changes

- **js/stroke-data.js** — 新增：STROKE_MAP 3000+汉字→繁体康熙笔画映射表 + 偏旁部首规则
- **index.html** — 新增第三顶层标签"姓名起卦" + 姓名输入区
- **js/app.js** — 姓名解析/笔画查表/起卦/渲染 + 标签路由
- **css/style.css** — 姓名输入+笔画明细+命名评价样式

## Impact

- Affected specs: 无
- Affected code:
  - `js/stroke-data.js`（新增 ~2000 行数据）
  - `index.html`（+~15行：第三标签 + 输入区）
  - `js/app.js`（+~80行：算法+渲染+路由）
  - `css/style.css`（+~30行：姓名区样式）

---

## ADDED Requirements

### Requirement: R1 — 康熙字典笔画数据
The system SHALL provide a 3000+ character Kangxi stroke count lookup table.

```javascript
// stroke-data.js
var STROKE_MAP = {
    '一':1,'丁':2,'七':2,'万':15,'三':3,'上':3,'下':3,'不':4,'丑':4,
    '王':4,'李':7,'张':11,'刘':15,'龙':16,'马':10,'陈':11,'杨':13,
    '黄':12,'赵':14,'周':8,'吴':7,'林':8,'孙':10,'郑':14,'钱':16,
    /* ... 3000+ entries */
};
```

#### Scenario: 简体字匹配繁体笔画
- **WHEN** `STROKE_MAP['龙']`
- **THEN** 返回 `16`（康熙字典笔画，简体5画→繁体龍16画）
- **WHEN** `STROKE_MAP['马']`
- **THEN** 返回 `10`

#### Scenario: 未收录字兜底
- **WHEN** 查表未命中
- **THEN** 提示用户"未收录，请手动输入笔画数"
- **AND** 显示可编辑的笔画数字输入框

---

### Requirement: R2 — 姓名结构解析与笔画计算
The system SHALL parse Chinese name structure and compute Kangxi stroke counts.

```javascript
// 常见复姓表
var COMPOUND_SURNAMES = {
    '欧阳':1,'司马':1,'上官':1,'诸葛':1,'夏侯':1,'慕容':1,'宇文':1,
    '端木':1,'皇甫':1,'令狐':1,'尉迟':1,'公孙':1,'长孙':1,'轩辕':1,
    '申屠':1,'独孤':1,/* ... */
};

function parseName(name) {
    if (name.length === 2) return { type:'single-single', surname:[name[0]], given:[name[1]] };
    if (name.length === 3) {
        if (COMPOUND_SURNAMES[name.substring(0,2)])
            return { type:'compound-single', surname:[name[0],name[1]], given:[name[2]] };
        return { type:'single-double', surname:[name[0]], given:[name[1],name[2]] };
    }
    if (name.length >= 4) {
        if (COMPOUND_SURNAMES[name.substring(0,2)])
            return { type:'compound-double', surname:[name[0],name[1]], given:name.substring(2).split('') };
        return { type:'compound-double', surname:[name[0],name[1]], given:name.substring(2).split('') };
    }
}
```

#### Scenario: 单姓双名
- **WHEN** `parseName('诸葛亮')`
- **THEN** `{ type:'single-double', surname:['诸'], given:['葛','亮'] }`

#### Scenario: 单姓单名
- **WHEN** `parseName('王明')`
- **THEN** `{ type:'single-single', surname:['王'], given:['明'] }`

#### Scenario: 复姓单名
- **WHEN** `parseName('欧阳修')`
- **THEN** `{ type:'compound-single', surname:['欧','阳'], given:['修'] }`

---

### Requirement: R3 — 姓名起卦算法
The system SHALL compute a name-based divination using surname/given stroke counts.

```javascript
function nameCast(name) {
    const parsed = parseName(name);
    const surnameStrokes = parsed.surname.reduce((s,c) => s + (STROKE_MAP[c] || 0), 0);
    const givenStrokes = parsed.given.reduce((s,c) => s + (STROKE_MAP[c] || 0), 0);
    const totalStrokes = surnameStrokes + givenStrokes;

    const num1 = surnameStrokes; // 上卦
    const num2 = givenStrokes;   // 下卦
    const num3 = totalStrokes;   // 动爻

    const { upper, lower, dongYao, benGua } = meihuaCast(num1, num2, num3);
    // ... 复用梅花引擎
}
```

#### Scenario: 诸葛亮验证
- **WHEN** `nameCast('诸葛亮')`
- **THEN** 诸15画/葛12画/亮9画 → 上卦15%8=7艮☶, 下卦21%8=5巽☴, 动爻36%6=0→6
- **AND** 本卦 = 山风蛊䷑

---

### Requirement: R4 — 命名评价渲染
The system SHALL render name evaluation with stroke details and fate judgment.

#### Scenario: 笔画明细展示
- **WHEN** 姓名起卦完成
- **THEN** 展示每字→繁体→康熙笔画数（如"诸→諸(15画) / 葛→葛(12画) / 亮→亮(9画)"）

#### Scenario: 命名评价
- **WHEN** 体用生克结果已得
- **THEN** 展示命名评价卡片：
  - level=5 → "大吉·旺命名 ✅ — 这名字旺你，对命主有强大助益"
  - level=1 → "凶·阻命名 ❌ — 这名字给命主带来阻力，建议改名"

---

### Requirement: R5 — 第三顶层标签
The system SHALL add a third top-level mode tab for name divination.

#### Scenario: 标签路由
- **WHEN** 页面加载
- **THEN** 显示三个标签: [铜钱掷爻] [梅花易数] [姓名起卦]
- **WHEN** 点击"姓名起卦"
- **THEN** 切换到姓名输入界面，隐藏铜钱和梅花控件

---

### Requirement: R6 — 回归保护
The system SHALL NOT break v0.2 copper coin or v0.3 Meihua modes.

#### Scenario: 铜钱+梅花完整保留
- **WHEN** 分别使用铜钱和梅花模式
- **THEN** 所有功能正常无退化

---

## MODIFIED Requirements

无

## REMOVED Requirements

无
