# 问卦 · WenGua

> 🎋 一枚精致的小算卦玩具 — 心存疑问，掷爻问卦。

![版本](https://img.shields.io/badge/version-A%200.1-aa8844)
![状态](https://img.shields.io/badge/status-规划中-lightgrey)

---

## ✨ 功能

- **铜钱掷爻** — 模拟三枚铜钱掷六次，生成本卦 + 变卦，朱熹变占法解读
- **梅花易数** — 三数起卦，互卦推演，体用生克定吉凶
- **六十四卦全解** — 涵盖《易经》全部六十四卦，含卦辞、爻辞
- **精美动画** — 铜钱抛掷、逐爻绘制等流畅动画
- **本地运行** — 纯前端应用，双击 `index.html` 即用，零依赖

---

## 📁 项目结构

```
问卦/
├── index.html              # 应用入口
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 主逻辑
│   ├── gua-data.js         # 六十四卦数据
│   └── animation.js        # 动画控制
├── docs/                   # 文档
│   └── PRD-问卦-v0.3.md
├── research/               # 研究资料
│   ├── 00-研究总报告.md
│   ├── 01-八卦基础.md
│   ├── 02-六十四卦总览.md
│   ├── 03-起卦方法.md
│   ├── 04-解卦规则.md
│   ├── 05-分宫卦象.md
│   └── 06-梅花易数.md
├── reports/                # 验收报告
├── .trae/specs/            # 开发规划
│   ├── wengua-core-casting/
│   └── wengua-meihua/
├── LICENSE                 # AGPL v3
├── .gitignore
└── README.md
```

---

## 🗺️ 路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| **A 0.1** | 项目初始化 · 资料研究 · 架构设计 | ✅ 完成 |
| **A 0.2** | 铜钱掷爻 MVP（起卦 + 查表 + 逐爻动画） | 📋 规划中 |
| **A 0.3** | 梅花易数 MVP（三数起卦 + 互卦 + 体用生克） | 📋 规划中 |
| **A 0.4** | 变卦解读（朱熹变占法 + 爻辞） | 📋 规划中 |
| **A 0.5** | 体验打磨（铜钱动画 + 音效 + 分享） | 📋 规划中 |

---

## 🚀 快速开始

```bash
# 方式一：直接打开
双击 index.html 即可在浏览器中使用

# 方式二：本地服务器
python -m http.server 8080
# 打开 http://localhost:8080
```

---

## 📜 许可证

GNU Affero General Public License v3.0
