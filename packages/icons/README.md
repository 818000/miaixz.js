# @miaixz/icons

Miaixz 的独立 Web 图标系统，包含 1024 个原创可变字体图标、React `Icon`、语义尺寸、连续 FILL/opsz 动画和无障碍行为。版本固定为 0.6.5。

## 安装

```bash
npm install @miaixz/icons react react-dom
```

在应用入口显式加载一次样式：

```tsx
import "@miaixz/icons/styles.css";
import { Icon } from "@miaixz/icons";

export function Example() {
  return <Icon label="搜索" name="search" size="navigation" />;
}
```

未提供 `label` 的图标默认为装饰性内容并设置 `aria-hidden`；表达独立含义时必须提供非空 `label`。

## 字体加载

Core 字体固定包含 64 个首屏名称和 U+F0000–U+F003F；Extended 字体包含其余 960 个 canonical 名称和 U+F0040–U+F03FF。两个 `@font-face` 使用互斥 `unicode-range`，因此浏览器只在页面实际出现对应字符时请求文件。

首屏可以只预载 Core：

```html
<link rel="preload" href="/assets/miaixz-icons.woff2" as="font" type="font/woff2" crossorigin />
```

不要默认预载 Extended。打包器也可以通过 `@miaixz/icons/font.woff2` 和 `@miaixz/icons/font-extended.woff2` 取得稳定资源入口。跨源部署必须返回 `Access-Control-Allow-Origin`，两个字体建议返回 `Cache-Control: public, max-age=31536000, immutable`。

运行时预热只加载 Core：

```ts
import { preloadMiaixzIconFont } from "@miaixz/icons";

await preloadMiaixzIconFont();
```

## API

```tsx
import { Icon, type IconName } from "@miaixz/icons";

const name: IconName = "rocket";

<Icon fill={0.5} motion="auto" name={name} size={24} />;
```

- `variant="outline" | "filled"` 分别映射 FILL 0 与 1。
- `fill` 接受 0–1 连续值，并以 180ms 过渡。
- `size` 接受 `indicator`、`inline`、`control`、`navigation`、`feature`、`display` 或正数；数值同时驱动 12–40 的 opsz。
- `motion="none"` 与系统 `prefers-reduced-motion: reduce` 都会关闭过渡。
- `rtl="mirror"` 的名称只翻转内层字形，不改变根节点布局。
- `name` 只能使用公共目录中的 1024 个名称；未知名称不会进入字体私有区，而是显示固定尺寸的安全占位。

公共目录从 `@miaixz/icons/catalog` 提供。不要导入 `src`、`dist` 私有路径或直接书写 PUA 字符。

## 第三方图标

`@miaixz/icons` 不封装、不转发第三方图标库。需要第三方图标时，应用应直接安装并按其官方 API 使用；第三方许可证、升级节奏和包体积由应用独立管理，不会影响本包的发布与字体资产。

```bash
npm install lucide-react
```

## 故障策略与浏览器范围

字体加载失败时显示固定尺寸的安全占位，不会泄漏 PUA/tofu。Core 与 Extended 各自使用一个全局加载 Promise，任一子集失败不会污染另一子集。

支持 React 18.3–19，以及当前锁定 Playwright 版本对应的 Chromium、Firefox 和 WebKit。SSR 不访问 Font Loading API；Hydration 保持同一个 `span` 根节点和固定尺寸占位。

## Public entries

| Entry                   | Kind       |
| ----------------------- | ---------- |
| `.`                     | JavaScript |
| `./catalog`             | JavaScript |
| `./styles.css`          | CSS        |
| `./font.woff2`          | Asset      |
| `./font-extended.woff2` | Asset      |
