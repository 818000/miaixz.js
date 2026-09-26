# @miaixz/sdk example

这个示例展示浏览器 SDK 的核心能力，不依赖真实后端：

- 创建并等待 SDK 运行时就绪
- 更新租户、空间和语言上下文
- 检查权限与角色
- 订阅上下文、语言和外观事件
- 切换颜色模式与界面密度
- 使用本地模拟响应演示 API envelope 解包
- 使用统一格式化工具显示日期、数字与文件大小

## 运行

先在仓库根目录构建 SDK，然后启动示例：

```bash
npm run build --workspace @miaixz/sdk
npm run dev --prefix examples/sdk
```

构建示例：

```bash
npm run build --prefix examples/sdk
```

示例中的 `mockFetch` 只用于本地演示。接入真实服务时应删除它，并把
`apiBaseUrl`、CSRF 或 Bearer 配置替换为应用自己的安全配置。
