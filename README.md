# sk-chart

[![npm version](https://img.shields.io/npm/v/sk-chart.svg)](https://www.npmjs.com/package/sk-chart)
[![license](https://img.shields.io/npm/l/sk-chart.svg)](./LICENSE)

A lightweight, SVG-first chart library with handcrafted visual styles.

首版提供 **FoldBarChart**：折纸漏斗柱状图 —— 渐变柱体由"折面"相连，闲置列呈条纹纸感，高亮列浮起 wash 与 tooltip。源自 `payments-fold-chart.html` 效果 3 的组件化实现。

- **零依赖**，gzip ~8KB
- **SVG 渲染**，viewBox 设计空间，任意容器宽度自适应
- **G2Plot 风格 API**：`new FoldBarChart(el, config)` + `update` / `resize` / `destroy` / `on`
- **多实例安全**：defs id 与样式按实例隔离
- **TypeScript strict**，几何与比例尺全部纯函数 + 单测覆盖

## 安装

```bash
npm install sk-chart
```

或直接引入构建产物（`dist/index.js` ESM / `dist/index.cjs` CJS）。

## 快速上手

```ts
import { FoldBarChart } from 'sk-chart';

const chart = new FoldBarChart('#container', {
  data: [
    { label: '发起支付', value: 65.2 },
    { label: '授权支付', value: 54.8 },
    { label: '支付成功', value: 48.6 },
    { label: '商户打款', value: 38.3 },
    { label: '完成交易', value: 32.9 },
  ],
  scale: { exponent: 2 },        // 折纸漏斗轮廓；默认 1 = 线性
  state: { defaultActive: 2 },   // 闲置时高亮第 3 列
  title: { text: '支付' },
});

chart.on('column:click', ({ index, datum }) => console.log(index, datum));
chart.update({ data: nextData }); // 全量重绘
chart.resize(960, 430);           // 变更 viewBox 设计空间
chart.destroy();                  // 清理 DOM 与事件
```

本地 demo：

```bash
npm install
npm run dev      # Vite，打开 examples/
```

## API

### `FoldBarChartConfig`

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `data` | `FoldBarDatum[]` | 必填 | `{ label, value, ...extra }` |
| `xField` / `yField` | `string` | `label` / `value` | 数据字段映射 |
| `width` / `height` | `number` | `860` / `386` | viewBox 设计空间 |
| `valueFormat` | `(v) => string` | `v => v.toFixed(1)+'k'` | 柱头数值格式 |
| `padding` | `Partial<{top,right,bottom,left}>` | `64/29/26/73` | 绘图区留白；启用 `xAxis.bottomLabels` 时底部自动扩高 |
| `stair` | `{ bottomOffset?, topOffset? }` | `30` / `74` | 柱顶阶梯锚点（value=0 与 max 的柱顶位置） |
| `scale.exponent` | `number` | `1` | 高度映射幂次；`2` 还原折纸漏斗轮廓 |
| `fold.run` | `number` | `20` | 折面水平跨度 |
| `fold.creaseColor/Width` | — | 白 / `1.2` | 折痕高光 |
| `axis.ticks` | `number[]` | 自动（nice） | y 轴刻度值；位置按 `barTopOf` 真实映射 |
| `axis.tickFormat` | `(v) => string` | `v => v+'k'` | 刻度文案 |
| `xAxis.labelFormat` | `(d, i, data) => string` | xField 值 | 顶部类目行文案 |
| `xAxis.bottomLabels` | `(d, i, data) => string \| string[]` | 无 | 底部语义行（如阶段序号 + 环节转化率），渲染在渐隐遮罩之外 |
| `xAxis.title` | `{ text?, x?, y? }` | 无 | X 轴标题，位于底部语义行之后的下一行，默认水平居中；`x`/`y` 可覆盖 |
| `xAxis.showLine/showTick` | `boolean` | `false` | 柱底基线 / 列中心刻度线（均在渐隐带下方） |
| `xAxis.showGrid` | `boolean` | `true` | 竖直分列线 |
| `tooltip.enabled` | `boolean` | `true` | |
| `tooltip.formatter` | `(datum, i, data) => TooltipPart[]` | 类目 + 数值 | 自定义 tooltip 内容 |
| `tooltip.fixedWidth` | `number` | — | 跳过文字测量（SSR/测试逃生口） |
| `state.defaultActive` | `number` | 最后一列 | 闲置高亮列 |
| `title` | `{ text?, x?, y? }` | 无标题 | 左上标题 |
| `style` | `FoldBarStyleConfig` | 原稿配色 | 条纹/渐变/pill/阴影/渐隐等全部可换肤；`stripePattern.enabled`、`pill.enabled`、`washEnabled`、`fadeMask.enabled` 可逐项关闭装饰，得到干净的普通柱状图观感 |
| `theme` | `'light' \| 'dark' \| ThemePack \| DeepPartialTokens` | 原稿外观（等价 `'light'`） | 预设名 / 内联主题包 / 旧版字体 token 局部，三种形态均可 |

SVG 本身透明、不画背景，底色由宿主页面控制（白底卡片或深色背景均可）。

### 主题预设

```ts
import { registerTheme, FoldBarChart } from 'sk-chart';

registerTheme('brand', {
  style: { barGradient: { normal: myStops } }, // 视觉皮肤
  tokens: { title: { fill: '#0A0A0A' } },      // 字体/颜色/过渡 token
  formats: { valueFormat: (v) => `${v}k` },    // 默认数值/刻度格式化
});

new FoldBarChart(el, { data, theme: 'dark' });            // 内置预设
new FoldBarChart(el, { data, theme: 'brand' });           // 自定义预设
new FoldBarChart(el, { data, theme: { tokens: { ... } } }); // 内联主题包
```

- 内置 `light`（原稿折纸皮肤）与 `dark` 两个预设
- 解析顺序：内置默认 → 主题包 → config 显式字段（`style`、对象形态 `theme`、`valueFormat`、`axis.tickFormat`），后者优先
- 旧写法 `theme: { number: { fontSize: 22 } }`（直接传 token 局部）完全兼容
- 未知预设名回退默认并 `console.warn`

### 事件

`column:enter` / `column:leave` / `column:click`，payload 为 `{ index, datum }`。

### 方法

`update(partial)`、`resize(w, h)`、`destroy()`、`on/off`、`setActive(i)`、`activeIndex`。

导出：

- `toSVGString(): string` — 独立 SVG 文本（内嵌样式与 defs，含 xmlns/宽高），可直接存 `.svg` 或内联
- `getDataURL({ type?: 'png' | 'svg', scale?: number, background?: string }): Promise<string>` — 默认 PNG 2x；`background` 缺省透明
- `download({ filename?, type?, scale?, background? }): Promise<void>` — 触发浏览器下载，默认 `sk-chart.png`

### 交互与无障碍

悬停/触摸切换高亮列；SVG 聚焦后 `←` / `→` / `Home` / `End` 导航，`Enter` / `Space` 触发 `column:click`；移出回落到 `defaultActive`。列具备 `role="listitem"` 与同步的 `aria-selected`；`prefers-reduced-motion: reduce` 下自动关闭过渡动画。

## 开发

```bash
npm test          # vitest（jsdom）
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # tsup → ESM/CJS/d.ts
```

## 路线图

- **M1**（进行中）：ResizeObserver 真实像素自适应、数据更新过渡动画、主题包；已交付：nice ticks 真刻度 Y 轴、xAxis 配置（顶部类目行 + 底部语义行）、装饰开关 + 中性默认文案、主题包注册（`registerTheme` + 内置 light/dark）
- **M2**：更多图表类型、框架封装（React/Vue）
- **M3**：文档站、视觉回归 CI、npm 发布

## 发布（维护者）

本仓库已接入 npm Trusted Publishing（GitHub Actions + OIDC，免 token），完整流程见 [RELEASING.md](./RELEASING.md)。日常发版：

```bash
npm version patch        # 或 minor / major
git push --follow-tags   # 推 v* tag → CI 自动发布 npm + 创建 GitHub Release
```

或直接双击根目录 `release.bat`（本地校验 → 提交推送 → 打 tag 发版一条龙）。

## License

MIT
