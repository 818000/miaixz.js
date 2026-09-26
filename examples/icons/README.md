# @miaixz/example-icons

`examples/icons` 是 `@miaixz/icons` 0.6.5 的 Web-only 可执行验收应用，不发布到 npm。

## 运行

在仓库根目录完成依赖安装和包构建后执行：

```bash
npm --prefix examples/icons run dev
```

生产构建使用：

```bash
npm --prefix examples/icons run build
```

## 覆盖范围

- 搜索 1024 个 canonical 图标，并展示 category 与 Core/Extended tier。
- 连续调节 `FILL` 0–1 和 `opsz` 12–40。
- 对照 `indicator`、`inline`、`control`、`navigation`、`feature`、`display` 六个语义尺寸。
- 可重复切换 RTL、reduced-motion 和受控字体失败回退。
- 目录中的每个公共名称都由 Miaixz 自有字体直接解析，不存在第三方 Provider 或 SVG 回退。

应用只预载 `@miaixz/icons/font.woff2` 对应的 64 个 Core 字形。Extended 字体由生产 CSS 的互斥 `unicode-range` 在首次显示 Extended 字形时自动请求。

生产构建必须能够从静态目录离线运行。部署字体到不同源时，服务器必须返回允许字体源的 CORS 响应头，并对带内容 hash 的字体使用长期不可变缓存。
