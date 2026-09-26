# @miaixz/ui example

这个示例使用公开入口构建一页可交互的组件展示，覆盖：

- SDK Appearance 与 UI Theme 的连接
- 浅色、深色和系统颜色模式
- 紧凑、标准和舒适密度
- Button、Badge、Status、Alert 和 Progress
- Field、Input、Select 和 Switch
- Metrics、Tabs、Panel 和 Table
- 中英文界面消息切换

## 运行

先在仓库根目录构建依赖包，然后启动示例：

```bash
npm run build --workspace @miaixz/sdk
npm run build --workspace @miaixz/icons
npm run build --workspace @miaixz/ui
npm run dev --prefix examples/ui
```

构建示例：

```bash
npm run build --prefix examples/ui
```

示例只通过公开包入口导入组件和样式，可作为业务应用接入时的最小参考。
