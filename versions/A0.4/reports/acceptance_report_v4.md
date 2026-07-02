# 🎯 问卦 · WenGua — 严格验收报告 v4

| 项目 | 内容 |
|------|------|
| **任务编号** | Spec: wengua-core-casting + wengua-meihua + 姓名起卦 |
| **任务名称** | 问卦 · WenGua v0.4 三模式（铜钱+梅花+姓名） |
| **验收日期** | 2026-07-02 |
| **自动化测试** | 57 项 E2E（含CSS可见性/单元算法/持久化/渲染） |
| **验收结论** | ❌ CONDITIONAL FAIL — 1个严重缺陷+1个修复的缺陷 |
| **验收人** | 严格验收 Agent（Kent Beck + Brian Okken + Simon Stewart） |

---

## 一、验收标准

> 来源：[spec.md](file:///d:/Desktop/卦象/.trae/specs/wengua-core-casting/spec.md)
> 来源：[spec.md](file:///d:/Desktop/卦象/.trae/specs/wengua-meihua/spec.md)
> 新增：姓名起卦模式

### 核心功能

| 模式 | 核心函数 | 用途 |
|------|---------|------|
| 铜钱掷爻 | `castOnce/findGua/getBianGua/getInterpretationFocus/renderResult` | 六爻掷爻→本卦→变卦→焦点 |
| 梅花易数 | `meihuaCast/calcHuGua/calcTiYong/judgeShengKe/renderMeihuaResult` | 三数→本卦+互卦+变卦+体用生克 |
| 姓名起卦 | `parseName/calcNameStrokes/nameCast/renderNameResult` | 姓名→康熙笔画→三数→卦象+命名评价 |

---

## 二、测试统计

| 类别 | 通过 | 失败 | 通过率 |
|------|:----:|:----:|:------:|
| CSS初始可见性 (B1核心验证) | 1 | 2 | 33% |
| 模式切换可见性 | 9 | 0 | 100% |
| 铜钱掷爻功能 | 10 | 0 | 100% |
| 梅花算法 | 9 | 0 | 100% |
| 姓名起卦 | 14 | 0 | 100% |
| 模式切换持久化 | 3 | 0 | 100% |
| 数据层+深层 | 5 | 0 | 100% |
| **总计** | **55** | **2** | **96.5%** |

---

## 三、问题清单

---

### 🔴 B1：CSS 特异性冲突——铜钱模式下梅花和姓名输入界面可见（用户报告）

| 项目 | 内容 |
|------|------|
| **严重程度** | 🔴 严重 |
| **问题类型** | CSS 缺陷 — 特异性覆盖 |
| **状态** | ⏳ 待修复 |
| **所在文件** | [style.css#L319](file:///d:/Desktop/卦象/css/style.css#L319) + [style.css#L505](file:///d:/Desktop/卦象/css/style.css#L505) |
| **影响范围** | 页面首次加载时铜钱模式下显示梅花输入区和姓名输入区 |

**问题描述**：
用户首次进入页面（铜钱模式默认激活）时，`#meihua-controls` 和 `#name-controls` 虽然都带有 `class="hidden"`，但 computed display 均为 `flex`。

**实证数据——Playwright 实测截图**：
```
meihua-controls   class="hidden"     computed: flex    ← 应该为 none
name-controls     class="hidden"     computed: flex    ← 应该为 none
controls          (无hidden)          computed: flex    ← 正确可见
```

**根因分析**：
```css
.hidden { display: none; }               /* 特异性 0,0,1,0 */
#meihua-controls { width:100%; display:flex; ... }  /* 特异性 0,1,0,0 → 胜出 */
#name-controls   { width:100%; display:flex; ... }  /* 特异性 0,1,0,0 → 胜出 */
```

ID 选择器(0,1,0,0) > class 选择器(0,0,1,0)。这是**上一次验收 B1 同一 Bug 复发**，因为新增 `#name-controls` 时复制了同样的模式。

**为什么切换后就好了？**
`switchMode('tongqian')` 使用**内联样式** `meihuaControls.style.display = 'none'`（特异性 1,0,0,0），内联style优先级最高，所以切换后规则生效。

**修复方案**（二选一）：

方案A — 最简单有效：在 `DOMContentLoaded` 末尾加一行调用 `switchMode`：
```javascript
// 在 app.js DOMContentLoaded 末尾
switchMode('tongqian');  // 强制JS管理初始状态
```

方案B — CSS-only（推荐）：重写 `.hidden` 为固特异性的组合选择器：
```css
#meihua-controls.hidden,
#name-controls.hidden,
.hidden {
    display: none !important;
}
```

**修复验证**：
- 方法：运行 `test_acceptance_v4.py` Phase 1
- 预期：meihua-controls 和 name-controls 的 computed display 应为 none

---

### ✅ B2（已修复）：梅花模式不恢复持久化结果

| 项目 | 内容 |
|------|------|
| **严重程度** | 🟠 中等（已修复） |
| **问题类型** | 功能缺失 — 持久化 |
| **状态** | ✅ 已修复（2026-07-02） |
| **所在文件** | [app.js#L380-L383](file:///d:/Desktop/卦象/js/app.js#L380-L383) |
| **影响范围** | 梅花易数模式下切换模式后返回时结果不显示 |

**问题描述**：
`switchMode('meihua')` 方法中缺少 `savedMeihuaResult` 的检查和恢复逻辑。铜钱模式和姓名模式均有对应的恢复逻辑（[app.js#L358-L363](file:///d:/Desktop/卦象/js/app.js#L358-L363) + [app.js#L395-L398](file:///d:/Desktop/卦象/js/app.js#L395-L398)），但梅花模式遗漏。

**复现步骤**：
1. 进入梅花模式 → 起卦 → 看到结果
2. 切换到铜钱/姓名模式
3. 切回梅花模式 → **结果消失**（应恢复显示）

**修复方案**：
```diff
+ if (savedMeihuaResult) {
+     resultDiv.classList.remove('hidden');
+     renderMeihuaResult(savedMeihuaResult);
+ }
```
已应用，`test_acceptance_v4.py` ✅ 验证通过。

---

### 🟡 B3：`COMPOUND_SURNAMES` 中有重复条目

| 项目 | 内容 |
|------|------|
| **严重程度** | 🟡 轻微 |
| **问题类型** | 代码质量 — 数据重复 |
| **状态** | ⏳ 待修复 |
| **所在文件** | [app.js#L23-L32](file:///d:/Desktop/卦象/js/app.js#L23-L32) |
| **影响范围** | 无功能影响，但代码冗余 |

`COMPOUND_SURNAMES` 中 `'司马':1`、`'宇文':1`、`'慕容':1`、`'诸葛':1`、`'欧阳':1`、`'梁丘':1` 各出现两次。这是数据录入时的拷贝粘贴重复。

---

### 🟡 B4：`doNameCast` 中 `input.style.borderColor` 直接修改内联样式

| 项目 | 内容 |
|------|------|
| **严重程度** | 🟡 轻微 |
| **问题类型** | 代码一致性 |
| **状态** | ⏳ 待修复 |
| **所在文件** | [app.js#L700-L708](file:///d:/Desktop/卦象/js/app.js#L700-L708) |

梅花模式的输入验证使用 `.error` class（[app.js#L411](file:///d:/Desktop/卦象/js/app.js#L411)），而姓名模式直接修改 `input.style.borderColor`。建议统一为 class 切换方式。

---

## 四、修复验证汇总

| # | ID | 严重度 | 简述 | 状态 | 修复日期 |
|---|-----|--------|------|------|----------|
| 1 | B1 | 🔴 | CSS特异性 → 梅花/姓名界面首次可见 | ⏳ 待修复 | — |
| 2 | B2 | 🟠 | 梅花模式不恢复持久化结果 | ✅ **已修复** | 2026-07-02 |
| 3 | B3 | 🟡 | COMPOUND_SURNAMES 重复条目 | ⏳ 待修复 | — |
| 4 | B4 | 🟡 | 输入验证机制不统一 (inline style vs class) | ⏳ 待修复 | — |

---

## 五、总体评价

### 亮点
1. **铜钱+梅花+姓名三模式完整实现**：所有核心函数就绪，算法正确性经过 384 种组合验证
2. **姓名起卦功能完整**：复姓识别(`parseName`)、康熙笔画(`STROKE_MAP 3000+汉字`)、五格评价(`renderNameResult`)—功能丰富度超出预期
3. **双标签切换正常**：3种模式切换流畅，无 console 报错，铜钱/梅花/姓名各自结果独立持久化
4. **姓名验证防御**：空名/短名拦截，笔画不存在时返回 null 防止崩溃
5. **代码架构清晰**：各模式逻辑分离，函数职责明确

### 缺陷汇总
1. 🔴 **B1 CSS 特异性** — 阻塞发布，修复只需一行
2. ✅ ~~B2 持久化缺失~~ — 已修复
3. 🟡 B3 姓氏重复 — 非阻塞
4. 🟡 B4 验证不统一 — 建议逐步优化

---

## 🎯 最终结论：❌ CONDITIONAL FAIL

```
╔══════════════════════════════════════════════════╗
║        问卦 · WenGua v0.4 — 验收结论              ║
║                                                  ║
║       ❌ CONDITIONAL FAIL                        ║
║                                                  ║
║  测试通过: 55/57 = 96.5%                         ║
║                                                  ║
║  唯一阻塞:                                       ║
║    🔴 B1: CSS 特异性 → 铜钱模式下               ║
║         梅花/姓名输入界面可见                     ║
║                                                  ║
║  本次已修:                                       ║
║    ✅ B2: 梅花模式持久化缺失                     ║
║                                                  ║
║  修复 B1 后可升级为 PASS                         ║
╚══════════════════════════════════════════════════╝
```

**修复 B1 的方法**（最简单——无需改 CSS 文件）：
在 [app.js#L829](file:///d:/Desktop/卦象/js/app.js#L829) `DOMContentLoaded` 末尾加一行：
```javascript
switchMode('tongqian');
```
这样初始状态由 JS 内联样式管理，完全绕过 CSS 特异性问题。
