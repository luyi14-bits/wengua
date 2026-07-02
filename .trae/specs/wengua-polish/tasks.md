# Tasks — 体验打磨

> **Spec**: `spec.md` | **PRD**: `docs/PRD-问卦-v0.5.md`

---

- [x] Task 1: 分享卡片 (`js/app.js`)
  - [x] SubTask 1.1: `#result` 区追加 `<button id="btn-share" class="btn-aux">📤 分享卦象</button>`
  - [x] SubTask 1.2: `generateShareCard(result, mode)` — Canvas 600×800 暗金卡片绘制
  - [x] SubTask 1.3: Canvas → `toBlob()` → `URL.createObjectURL()` → `<a download>` 触发下载
  - [x] SubTask 1.4: 适配铜钱/梅花/生辰/姓名四种模式的结果数据

- [x] Task 2: 掷爻音效 (`js/app.js`)
  - [x] SubTask 2.1: `ensureAudio()` — AudioContext 懒初始化
  - [x] SubTask 2.2: `playCastSound()` — 800Hz 短促正弦波（0.1s）
  - [x] SubTask 2.3: `playChangingSound()` — 1200Hz 动爻提醒（0.2s）
  - [x] SubTask 2.4: 铜钱掷爻循环中插入音效调用
  - [x] SubTask 2.5: try/catch 包裹，静默降级

- [x] Task 3: 铜钱 3D 动画 (`animation.js` + `css/style.css`)
  - [x] SubTask 3.1: CSS `@keyframes coinFlip` — rotateY 0→720 + scale bounce
  - [x] SubTask 3.2: CSS `@keyframes coinPulse` — 金色光晕 pulse
  - [x] SubTask 3.3: `animation.js` 实现 `animateCoinFlip(container, yao)` — 铜钱图标 + 爻线文字
  - [x] SubTask 3.4: 动爻 `.coin-changing` class 触发 pulse

- [x] Task 4: 样式与适配 (`css/style.css`)
  - [x] SubTask 4.1: `.btn-aux` 分享按钮复用已有样式
  - [x] SubTask 4.2: `.coin-flip` / `.coin-visible` / `.coin-changing` 样式
  - [x] SubTask 4.3: 移动端 480px 适配

# Dependencies

```
Task 1 ──独立──
Task 2 ──独立──
Task 3 ──独立──
Task 4 ──→ 与 Task 2/3 可并行
```

三项完全独立，可并行开发。

# 工时估算

| Task | 子任务数 | 估算人天 |
|------|---------|---------|
| Task 1 | 4 | 0.8 |
| Task 2 | 5 | 0.5 |
| Task 3 | 4 | 0.5 |
| Task 4 | 3 | 0.2 |
| **合计** | **16** | **2.0** |
