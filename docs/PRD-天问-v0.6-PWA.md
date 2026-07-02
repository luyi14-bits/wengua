# 天问 v0.6 PRD — PWA 移动端适配

> 目标：不改一行业务代码，把天问装进手机桌面，类原生 App 体验。

---

## Why

当前仅支持桌面浏览器打开 `index.html`。手机端用户无法便捷使用，更无法离线占卜。

PWA 是代价最小的移动端方案：天问已经是纯前端、零依赖、AGPL 开源，天生适合。

## 不做的事

- ❌ 不重写 UI（现有桌面布局在手机端已够用）
- ❌ 不搞微信小程序（审核重、双线维护、0% 代码复用）
- ❌ 不上架应用商店

## 做什么（2 个新文件）

### 1. `manifest.json`（~20 行）

```json
{
  "name": "天问",
  "short_name": "天问",
  "description": "心存疑问，掷爻问天 — 开源六十四卦小工具",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#c9a94e",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192" },
            { "src": "icon-512.png", "sizes": "512x512" }]
}
```

### 2. `sw.js`（~30 行）

离线缓存策略：

```javascript
const CACHE = 'tiānwèn-v1';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/', 'css/style.css', 'js/gua-data.js',
                 'js/stroke-data.js', 'js/app.js', 'js/animation.js'])
    )
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

### 3. `index.html` 微调（+2 行）

- `<link rel="manifest" href="manifest.json">`
- 注册 Service Worker 的 `<script>` 标签

## 验收标准

| # | 场景 | 预期 |
|---|------|------|
| 1 | Chrome 手机端打开 → 弹出"添加到主屏幕" | 通过 |
| 2 | 断网后从桌面图标打开 → 页面加载，五模式均可起卦 | 通过 |
| 3 | iOS Safari → 手动"添加到主屏幕" → 独立窗口打开 | 通过 |
| 4 | 桌面版功能回归 — 所有现有模式无回归 | 通过 |

## 估时

| 项 | 时间 |
|------|------|
| manifest.json + sw.js + 图标 | 1h |
| index.html 微调 | 10min |
| 多机型验证 (Chrome/Firefox/Safari) | 1h |
| **合计** | **半天** |
