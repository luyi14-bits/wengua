# 天问 · AskTheOracle

> 🎋 心存疑问，掷爻问天 — 一枚精致的开源算卦小玩具。

🌐 **在线体验**：[luyi14-bits.github.io/AskTheOracle](https://luyi14-bits.github.io/AskTheOracle/)（手机浏览器打开可安装到桌面）

![版本](https://img.shields.io/badge/version-A%200.8.5-aa8844)
![协议](https://img.shields.io/badge/license-AGPL%20v3-blue)
![状态](https://img.shields.io/badge/status-八模式+8Skill就绪-success)

> ⚠️ **免责声明**：天问 (AskTheOracle) 仅供娱乐，所有卦象解读不构成任何人生决策依据。

---

## ✨ 功能

- **铜钱掷爻** — 模拟三枚铜钱掷六次，生成本卦 + 变卦，朱熹变占法解读
- **梅花易数** — 三数起卦，互卦推演，体用生克定吉凶
- **生辰起卦** — 公历/农历双输入，年月日时法起终身卦
- **姓名起卦** — 姓名笔画数起卦，繁体康熙字典笔画标准，终身卦解读
- **六十四卦全解** — 涵盖《易经》全部六十四卦，含卦辞、爻辞
- **精美动画** — 铜钱抛掷、逐爻绘制等流畅动画
- **掷筊问杯** — 传统筊杯掷六次，圣杯/笑杯/阴杯判定，得六十四卦
- **掐指小六壬** — 左手掌诀月日时推算，六神断吉凶，3 秒出结果
- **交叉起卦** — 姓名 + 生辰八字合参，看名字与命格是否契合
- **五格姓名学** — 天格/人格/地格/总格/外格 81 数理 + 三才配置
- **白话解读** — 每卦一句白话总结，普通人也能看懂卦象含义
- **PWA 离线版** — 手机端一键安装到桌面，断网也能占卜
- **本地运行** — 纯前端应用，双击 `index.html` 即用，零依赖

---

## 📁 项目结构

```
天问/
├── index.html              # 应用入口
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker（离线缓存）
├── icon.svg                # PWA 图标
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 主逻辑（含交叉起卦+五格+小六壬）
│   ├── gua-data.js         # 六十四卦数据
│   ├── plain-data.js       # 白话解卦数据
│   ├── stroke-data.js      # 姓名笔画数据库
│   └── animation.js        # 动画控制
├── docs/                   # 文档
│   ├── PRD-问卦-v0.2.md
│   ├── PRD-问卦-v0.3.md
│   ├── PRD-问卦-v0.4.md
│   ├── PRD-问卦-v0.5.md
│   ├── PRD-天问-v0.6-PWA.md
│   ├── PRD-天问-v0.7.md
│   ├── PRD-问卦-v0.8.md
│   └── 天问-v0.8+-扩展方向建议.md
├── research/               # 研究资料 (9 份)
├── reports/                # 验收报告
├── .trae/specs/            # 开发规划
│   ├── wengua-core-casting/
│   ├── wengua-meihua/
│   ├── wengua-name-divination/
│   ├── wengua-polish/
│   ├── wengua-pwa/
│   ├── wengua-v07/
│   └── wengua-v08/
├── versions/               # 版本归档
│   ├── A0.2/               # 项目初始化
│   ├── A0.3/               # 铜钱+梅花双模式
│   ├── A0.4/               # 姓名起卦
│   ├── A0.5/               # 体验打磨
│   ├── A0.6/               # PWA 移动端
│   ├── A0.7/               # 掷筊+白话
│   ├── A0.8/               # 交叉+小六壬+五格
│   └── A0.8.5/             # Skill泛化+Luyi14前缀（当前）
├── skills/                 # 项目 Skill（8 个，全部 Luyi14- 前缀）

...（后续省略）
├── .github/                # 社区规范
├── LICENSE                 # AGPL v3
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── .gitignore
└── README.md
```

---

## 🗺️ 路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| **A 0.2** | 项目初始化 · 资料研究 · 架构设计 | ✅ 已冻结 |
| **A 0.3** | 铜钱掷爻 + 梅花易数双模式 | ✅ 已冻结 |
| **A 0.4** | 姓名起卦 + 笔画数据库 | ✅ 已冻结 |
| **A 0.5** | 动画音效 + 分享功能 + 体验打磨 | ✅ 已冻结 |
| **A 0.6** | PWA 移动端 — 一键安装到桌面，离线可用 | ✅ 已冻结 |
| **A 0.7** | 掷筊问杯 + 白话解卦 — 第六种起卦模式，64 卦白话 | ✅ 已冻结 |
| **A 0.8** | 交叉起卦 + 掐指小六壬 + 五格姓名学 — 八模式就绪 | ✅ 已冻结 |
| **A 0.8.5** | 8 Skill 泛化 + Luyi14- 前缀统一命名 + 通用规则 | ✅ 已发布 |

---

## 🚀 快速开始

```bash
# 方式一：直接打开（桌面端）
双击 index.html 即可在浏览器中使用

# 方式二：PWA 安装到手机
# 1. 部署到任意静态服务器（Vercel / GitHub Pages / Netlify）
# 2. 手机浏览器打开 URL
# 3. Chrome → "添加到主屏幕" / Safari → "添加到主屏幕"
# 4. 桌面出现天问图标，之后断网也能用

# 方式三：本地离线开发
python -m http.server 8080
# 打开 http://localhost:8080
```

---

## 📜 许可证

GNU Affero General Public License v3.0
