# Elseverse · 别境 v0.8 — Living Nebula Glass

手机优先的静态网页版本，部署到 GitHub Pages。

## 文件
- `index.html`
- `styles.css`
- `app.js`（唯一脚本引用；无外部 JS 库）

## 本次视觉改造
- 首页改为玻璃星云泡泡入口：每个世界与「我们的小宇宙」均为独立泡泡。
- 泡泡使用 WebGL fragment shader 绘制球面星云、动态流场、菲涅尔边缘与局部高光。
- 「我们的小宇宙」页面使用 WebGL Points 粒子球；粒子在基本稳定的球面上形成缓慢变化的柔亮丝带。
- WebGL 初始化失败时退回 Canvas 2D 简化绘制。
- 页面隐藏时暂停动画；限制 DPR 到 1.5；支持 `prefers-reduced-motion`。
- 使用 `visualViewport` 更新可视高度，并使用 `dvh` / `svh` 作为 CSS 后备。

## 数据兼容
没有更改以下既有存储名称或记录格式：
- `localStorage["myself-worlds"]`
- `localStorage["myself-language"]`
- IndexedDB：`elseverse-archive-v1`，object store：`records`

旧版世界详情、档案子页面、管理页和 JSON 备份导入导出代码均从 v0.7 保留。上线前仍建议先在旧站管理页导出一次 JSON 备份。

## 部署
将三个网页文件放在 GitHub Pages 发布目录的同一层级，然后提交并推送即可。不要把 `app.js` 改成远程 CDN 引用。

## 注意
这是基于你提供的 v0.7 源码和泡泡原型完成的 v0.8 改造稿。此环境未能成功启动浏览器自动化访问（本地预览被运行环境拦截），因此请先在手机浏览器或 GitHub Pages 预览实际性能，再替换线上版本。
