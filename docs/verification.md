# 第一版验收记录

日期：2026-10-15，Asia/Shanghai。

## 已通过

| 检查项 | 实际结果 |
|---|---|
| JavaScript 语法 | `npm run check` / `node --check dist/app.js` 通过 |
| HTTP 页面 | 本地 Node 服务 `http://localhost:4173/` 返回 200 |
| 桌面 | 1440×1000 和 1280px 宽度实测；Hero、摘要、三列作品和双列简报正常 |
| 平板 | 768×1024 实测；导航折叠、摘要两列、Hero 保留双列 |
| 手机 | 390×844 实测；Hero、作品、简报、步骤单列；分类可水平滑动 |
| 最窄宽度 | 320×740 实测，页面无横向溢出；窄屏装饰星形隐藏，避免标题多出一行 |
| 产品图片 | 页面上带 src 的三个 SVG 产品插画及分类缩略图均加载成功 |
| 分类筛选 | Tech 点击后仅显示耳机概念；All 恢复三张卡 |
| 键盘筛选 | ArrowRight 从 All 切到 Beauty，仅显示一张卡；Home 回 All |
| 分镜弹窗 | 打开 Tech 概念后呈现图片、三段概念文案、进度与 15 秒时长 |
| 暂停和关闭 | 在 00:08 暂停后按钮变为 Play；关闭按钮恢复页面 |
| 手机菜单 | 展开显示四个锚点；点击 The challenge 后菜单收起 |
| 评分说明 | Our criteria 点击后说明可见，`aria-expanded` 同步 |
| FAQ | “Can I use an imaginary product?” 展开后具有 open 状态 |
| 表单保存 | Demo Creator / demo@example.com 测试数据、英文概念和勾选声明成功保存，显示本地保存成功状态 |
| 草稿恢复 | 重新打开弹窗，姓名和英文概念恢复为先前保存内容 |
| 词数限制 | 输入 101 词，显示 `101 / 100 words` 和 over 样式，textarea 匹配 `:invalid` |
| 浏览器错误 | 检查时控制台 error 列表为空 |

截图：`desktop-preview.jpg`、`mobile-preview.jpg`、`showcase-preview.jpg`。

## 实现但未完整端到端验证

- Web Share / 剪贴板：代码包含支持检测、取消/失败处理，没有向外部联系人分享链接。
- TXT 简报下载与 JSON 草稿导出：Blob 和文件名逻辑已实现；未测试各浏览器的下载权限及保存位置。
- 手机尺寸为浏览器视口模拟，未使用实体 iOS/Android 设备。
- 仅在当前 Chromium 内核浏览器检查，未做 Safari/Firefox 矩阵验证。
- reduced-motion 媒体查询已实现，未模拟操作系统动态效果偏好做截图比对。

## 版本和部署

- 本地独立 Git 仓库：`outputs/dream-ads`。
- 分支：`main`；首版标签：`v1.0.0`。
- 私有 GitHub 仓库：https://github.com/qiu3428210863-web/dream-ads-prototype-20261015 。提交与标签以实际 `git ls-remote` 结果为最终依据。
- 已创建 Sites 项目：`appgprj_6ad0dbab9cd081918308fea3a2902d85`。
- Sites 的短期 Git 写凭据接口连续三次返回传输连接错误，因此未能进行该远程的 source push、save_version 和 deploy。无可确认的线上页面 URL。GitHub 源码托管与网站托管是两件事，前者不代表页面已经上线。
- 没有修改用户 Downloads 中的原型文件。所有源代码和可交付文档都在当前工作目录的 outputs 下。

## 后续接入点

把真实 MP4 视频接到作品卡/弹窗；用正式报名 API 替换 localStorage 演示；明确报名起止时间与隐私条款；恢复 Sites 连接后复用已有 project_id 发布。当前版本可以直接部署到任何静态托管服务，静态根目录是 `dist`。
