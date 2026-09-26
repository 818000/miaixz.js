# @miaixz/view example

这个示例展示文件预览包的公开组件和本地解析流程：

- `FileView` 根据文件名、MIME 和签名自动选择驱动
- `ImageView` 提供图片缩放与旋转控制
- `OfficeView` 在浏览器内解析仓库中的 XLSX 夹具
- 本地文件上传后直接交给 `FileView`
- 展示单调进度、完成状态和安全错误码

## 运行

先在仓库根目录构建依赖包，然后启动示例：

```bash
npm run build --workspace @miaixz/icons
npm run build --workspace @miaixz/view
npm run dev --prefix examples/view
```

构建示例：

```bash
npm run build --prefix examples/view
```

Office 示例复用 `packages/view/tests/fixtures/xlsx/system-flow.xlsx`，构建时 Vite 会把它作为静态资源输出。用户选择的本地文件不会上传到服务器。
