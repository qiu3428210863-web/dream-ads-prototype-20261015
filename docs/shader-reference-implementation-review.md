# Shader 官网曲面渲染对照与旧代码检查

检查对象：[shader.se About Us](https://www.shader.se/#about-us)，公开页面及其当前公开的 Next.js/Turbopack 前端 bundle；本地对象为 `dist/index.html`、`dist/crt.js`、`dist/lens-model.js`、`dist/showcase-gpu.js` 和对应样式。官网 bundle 是压缩构建产物，没有可读的原始项目源码或 source map，因此下文只记录可由公开代码直接确认的行为。

## 官网可确认的渲染链路

- 页面由固定的 `#scroll-container` 管理滚动，主视觉落在自定义 Three.js WebGPU 渲染场景中。公开构建把 Three 的 `WebGLRenderer` 导出为会报错的 WebGPU-only 占位类；可见的渲染实现使用 Three WebGPU 节点材质、render target 和全屏合成材质。
- 全屏合成不是简单 CSS 暗角。渲染器先将当前场景/界面作为纹理，再用节点 shader 按每个片元的 UV 坐标做曲面反向映射。曲面公式由半径平方和半径三次项构成，并使用 `0.3655` 做中心补偿。
- 采样坐标越界时官网输出透明覆盖；边界另外使用基于屏幕距离的覆盖率处理。它不会像普通纹理 `CLAMP_TO_EDGE` 那样把最外侧颜色无限拉伸到边缘。
- 色差在曲面合成之后处理：按校正后的屏幕纵向坐标从红/蓝通道取相邻样本，中心绿色与 alpha 保持原样；About Us 强度为 0.8。它是受控的细微色散，不是模糊文字。
- 渲染器设置 `antialias: true`，按 DPR 更新实际尺寸，并以 sRGB 输出、ACES Filmic 色调映射组织画面；低内存模式下 render target 可退到 8 位格式，正常配置使用 HalfFloat。源码还可见独立的辉光 mip 链和后期合成。抗锯齿不是只靠一个“高 DPR”开关。
- About Us 区段的公开参数为：`lensDistortion: 0.16`、`lensDistortionBorders: 0`、`motionBlur: 0`、`chromaticAbberationStrength: 0.8`、`vignetteIntensity: 0`，并配置辉光、噪声、色调与滚动区段过渡。也就是说，明显曲面不等于滚动模糊或动态暗角。

## 与本地实现的差异

本地曲面几何本身已经对齐：`DreamLens.sample` 和 Showcase WebGL shader 都使用与官网相同的径向补偿公式，曲率设为 0.16。画质差异主要来自采样链路，而非公式漏项：

1. Showcase 把卡片文字和图片先画成高分辨率 Canvas 纹理。旧采样器只用单层 `LINEAR`，曲面造成缩小时没有 mip 级别可选，细字会闪动或显出台阶；本次已启用硬件 mipmap 过滤，并在每次源 Canvas 更新后生成 mip 链。
2. 旧 shader 在越界坐标仍执行采样，纹理的 `CLAMP_TO_EDGE` 会重复最外圈像素。本次增加基于 `fwidth` 的边界覆盖率，避免边缘拖色并平滑最后一像素的裁切。
3. Showcase 的 shader 现在也按官网 About Us 参数 0.8 分离红蓝通道，绿色与 alpha 保留中心样本。该细微色散会改变高对比边缘颜色，因此单看红/蓝轮廓时不应将它误判为几何锯齿。
4. 页面其他区块仍由 SVG `feDisplacementMap` 过滤真实 DOM，位移场使用 8 位 RGBA 数据与设备/性能档位；这条路径与 Showcase GPU 纹理路径不同。两者覆盖的可见内容不重叠：`crt.js` 曲面化主内容和页脚，`showcase-gpu.js` 在其上绘制 Showcase 卡片视觉，真实 DOM 卡片只保留交互与语义。因此当前没有双重曲面叠加，但跨区块采样与色彩处理并非官网那套统一 WebGPU 后期链路。
5. 官网拥有结构化场景与纹理合成；本地仍需支持双击 HTML、原生表单、可选文本、键盘和屏幕阅读器。将整页强行截图成一张 Canvas 会损害这些能力，也会让长页面每帧重绘，因此本次没有把真实 DOM 替换成页面截图。

## 本次补齐和旧代码冲突检查

- 为 Showcase GPU 纹理增加 mipmap minification、屏幕空间边缘覆盖率与 0.8 红蓝色散；曲率与色散参数对齐官网 About Us。
- 给 DOM SVG 曲面层与 Showcase GPU 层增加根节点单次初始化标记，防止脚本重复载入时创建两套滤镜、画布或玻璃覆盖层。
- 更正 `tests/check-shaders.mjs` 的过期说明。此前注释错误地声称当前渲染器只有 SVG；实际是两个按区域分工的渲染器。
- `dist/index.html` 当前只加载一次 `crt.js` 和一次 `showcase-gpu.js`，且有意按 defer 顺序初始化。曲面图层与 GPU 卡片图层不是同一元素的重复特效。

## 还不能承诺完全一致的部分

主内容/页脚仍是 SVG 位移滤镜，而非官网的 WebGPU 半浮点场景合成；WebGL 卡片文字仍由 Canvas2D 字体栅格器绘成纹理，不是官网的全链路渲染资源。因此本次减少了 GPU 卡片缩小时的纹理锯齿和边缘夹取，但不能据此承诺所有正文、系统缩放比例和浏览器下绝对无锯齿，也不能声称像素级复刻官网。要统一达到该链路，需要将页面视觉重建为受控 WebGPU 场景/纹理，并逐设备验证 DPR、颜色空间、纹理格式、采样与回退；该迁移超出本次安全保留原生 DOM 的改动范围。

## 验证边界

脚本检查覆盖曲率公式、mipmap 设置、边缘覆盖、重复初始化保护和本地资源唯一加载。它们不会编译浏览器 GLSL、测量 Windows/macOS/Linux/移动浏览器的真实像素，也不替代同设备截图对照。公开参考：[Shader Development Studio](https://www.shader.se/#about-us)。
