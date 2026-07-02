# Checklist — 体验打磨

> **Spec**: `spec.md` | **Tasks**: `tasks.md`

---

## Task 1: 分享卡片

- [x] "📤 分享卦象"按钮在铜钱模式下存在且可点击
- [x] 按钮在梅花/生辰/姓名模式同样存在
- [x] Canvas 尺寸 600×800
- [x] Canvas 背景 #0f0f0f + 金色描边
- [x] 卦名 + 卦符(64px) + 卦辞 正确绘制
- [x] 爻辞逐条绘制
- [x] 变卦信息绘制（如有）
- [x] "问卦 · WenGua" 水印
- [x] 下载文件名格式 `{卦名}_问卦.png`
- [x] 铜钱/梅花/生辰/姓名四种模式均正常生成

## Task 2: 掷爻音效

- [x] AudioContext 首次用户点击后创建
- [x] 每次掷爻播放短促音效（800Hz, 0.1s）
- [x] 动爻额外播放提醒音（1200Hz, 0.2s）
- [x] 浏览器静音时不影响主流程
- [x] 梅花/生辰/姓名模式不起播音效
- [x] 音效不阻塞 UI（<5ms 延迟）

## Task 3: 铜钱 3D 动画

- [x] `@keyframes coinFlip` CSS 定义
- [x] `@keyframes coinPulse` CSS 定义
- [x] `animateCoinFlip` 替代旧 `drawGua` 调用
- [x] 铜钱图标 rotateY 0→720 正常渲染
- [x] scale bounce 效果（0→1.2→1）
- [x] 动爻 `.coin-changing` pulse 光晕
- [x] Chrome/Firefox/Safari/Edge 兼容

## Task 4: 样式与适配

- [x] 分享按钮样式与暗金主题一致
- [x] `.coin-flip` 样式不破坏现有 `.yao` 样式
- [x] 480px 适配

## 跨模块 / 回归

- [x] 铜钱模式 v0.2 功能正常
- [x] 梅花三数模式正常
- [x] 生辰起卦模式正常
- [x] 姓名起卦模式正常
- [x] Console 0 error
- [x] 不引入外部依赖

## 总览

| 分类 | 项数 |
|------|:---:|
| Task 1 | 10 |
| Task 2 | 6 |
| Task 3 | 7 |
| Task 4 | 3 |
| 跨模块 | 6 |
| **合计** | **32 ✓** |
