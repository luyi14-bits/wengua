# Changelog

All notable changes to AskTheOracle will be documented in this file.

---

## [A 0.8.5] — 2026-07-03

### Added
- 交叉起卦 mode — 姓名 + 生辰八字合参终身卦 (`crossCast` function)
- 掐指小六壬 mode — 月日时三推掌诀六神断吉凶 (大安/留连/速喜/赤口/小吉/空亡)
- 五格姓名学 — 天格/人格/地格/总格/外格 81 数理 + 三才五行配置
- 交叉命运等级 — 综合体用生克 × 五格数理 × 三才配置的 5 级评分
- `wengua-v08` spec & acceptance report

### Fixed
- 梅花易数结果不显示解读 BUG
- 交叉起卦命运等级偏高 — 删 auto-boost + 降低 badCount 降级阈值

### Archived
- `versions/A0.8.5` snapshot (78 files)

---

## [A 0.7] — 2026-07-03

### Added
- 掷筊问杯 mode — traditional jiaobei (moon block) divination, 6 throws → hexagram
- 白话解卦 — plain-language interpretation for all 64 hexagrams (`plain-data.js`)
- 64 hexagram plain-text summaries (~100 chars each)
- `wengua-v07` spec & acceptance report

### Research
- 圣杯起卦 research document (history, three-outcome system, hexagram bridge)
- 白话解卦 research document (writing rules, rendering design)

### Archived
- `versions/A0.7` snapshot (63 files)

---

## [A 0.6] — 2026-07-03

### Added
- PWA support (`manifest.json` + `sw.js` + Service Worker offline caching)
- Installable on Android/iOS home screen with offline capability
- PWA icon (`icon.svg`)
- `wengua-pwa` spec & acceptance report

### Changed
- Project officially renamed to 天问 (AskTheOracle)
- GitHub repo renamed from `wengua` to `AskTheOracle`

### Archived
- `versions/A0.6` snapshot (54 files)

---

## [A 0.5] — 2026-07-03

### Added
- Animation polish & UX refinements
- Share functionality
- `wengua-polish` spec & acceptance report

### Archived
- `versions/A0.5` snapshot (38 files)

---

## [A 0.4] — 2026-07-03

### Added
- Name divination mode (stroke-count + Kangxi radical mapping)
- `stroke-data.js` (3000+ Chinese character stroke database)
- `wengua-name-divination` spec & acceptance report

### Archived
- `versions/A0.4` snapshot (32 files)

---

## [A 0.3] — 2026-07-02

### Added
- Meihua Yishu mode (three-number divination + mutual hexagram + Ti-Yong Sheng-Ke)
- Copper coin casting MVP (six-coin toss + changing lines + Zhu Xi interpretation)

### Fixed
- `calcHuGua` binary index mapping bug (line overlap formula corrected)

### Archived
- `versions/A0.3` snapshot (26 files)

---

## [A 0.2] — 2026-07-02

### Added
- Project scaffold (`index.html`, `css/style.css`, `js/`)
- 64 hexagram dataset (`gua-data.js`)
- Research documents (6 papers on bagua, hexagrams, casting methods)
- AGPL v3 license

### Archived
- `versions/A0.2` snapshot (25 files)
