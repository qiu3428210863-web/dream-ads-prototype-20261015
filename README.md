# Dream Ads — 第一版

当前版本：v1.5.0。采用 OpenArt Arena 实际色值的白灰基底与粉色强调，作品区改为完整卡片切换，消除侧边半张卡片的硬裁切。更新说明见 `docs/v1.5-changes.md`；历史标签均保留。

基于用户提供的 HTML 活动内容，参考 [OpenArt Arena](https://openart.ai/arena#ranking-panel) 的白/灰/粉视觉、三维物件、分类卡片、细边框面板和工具交互，实现的响应式静态网页。

## 预览

在本目录执行：

```powershell
npm start
```

打开 http://localhost:4173 。仅需要 Node.js，不需要安装 npm 依赖。也可以直接打开 `dist/index.html` 查看页面；表单存储与分享能力以 HTTP 预览为准。

## 文件

- `dist/index.html`：内容、语义化结构和两组模态弹窗。
- `dist/styles.css`：设计变量值、响应式布局和动效。
- `dist/arena-theme.css`：官网实际配色映射与完整卡片布局。
- `dist/app.js`：轮播、键盘操作、分镜、分享下载、表单校验和草稿保存。
- `dist/assets/`：三个原创 SVG 产品插画、站点图标、参考网页静帧背景。
- `docs/reference-analysis.md`：参考站全组件分析、实测范围、复刻映射。
- `docs/verification.md`：验收记录与部署状态。
- `.openai/hosting.json`：已创建的 Sites 项目标识及静态目录。

## 已实现

桌面/平板/手机布局，320px 起无页面横向溢出；粘性导航和区块定位；完整卡片轮播及滚轮、拖动、键盘切换；三张概念卡与可暂停/继续/重播的 15 秒动态分镜；创意简报 TXT 下载；Web Share/复制链接；评审权重和说明；FAQ；报名表单必填、email 与 100 词限制；localStorage 草稿恢复及 JSON 导出；模态焦点管理、Esc、点击遮罩关闭；减少动态效果偏好支持。

## 版本回溯

这是独立的 Git 仓库，默认分支 `main`，发布点使用标签 `v1.0.0`。查看记录：

```powershell
git log --oneline --decorate
git show v1.0.0
```

可用独立 worktree 查看初版，同时保留当前目录：

```powershell
git worktree add ../dream-ads-v1 v1.0.0
```

交付目录外另提供 Git bundle 备份。恢复到一个新目录：

```powershell
git clone ../dream-ads-v1.bundle ../dream-ads-restored
```

`origin` 为本次创建的私有 GitHub 仓库：[dream-ads-prototype-20261015](https://github.com/qiu3428210863-web/dream-ads-prototype-20261015)。第一版代码和 `v1.0.0` 标签会推送到该仓库，可在 GitHub 中查看历史。

另保留 `sites` 远程用于 Sites 发布。Sites 凭据接口连续返回连接失败，因此线上页面部署尚未完成。不要把 `.openai/hosting.json` 中的项目存在误认为网站已经部署。后续继续使用同一个项目 ID，恢复连接后获取短期凭据并通过 Sites source helper 推送和发布；不得重新创建重复站点，也不要把 token 写入仓库。

## 内容边界与资源

本项目是原型明确要求的虚构活动/设计练习。报名只保存在当前浏览器，不会对外提交，概念预览不是最终广告视频。

香水、饮料、耳机均为本次创建的 SVG 插画。背景静帧来自用户指定的参考页公开资源 `https://openart.ai/arena/assets/arena-hero-still-2560.webp`，为本次风格复刻参考保留；正式商业发布前可替换为自有素材。OpenArt 是参考品牌；此项目不宣称是其官方活动。页面运行不依赖外部 CDN。
