import { Icon, type IconName } from "@miaixz/icons";
import Link from "next/link";

import styles from "./page.module.css";

const modules: readonly {
  href: string;
  name: string;
  packageName: string;
  description: string;
  icon: IconName;
  detail: string;
}[] = [
  {
    href: "/ui",
    name: "界面系统",
    packageName: "@miaixz/ui",
    description: "从运行时主题到表单、反馈、数据展示与浮层组件。",
    icon: "layout-dashboard",
    detail: "118 个公开组件与 Provider",
  },
  {
    href: "/icons",
    name: "图标系统",
    packageName: "@miaixz/icons",
    description: "搜索完整目录，并直接调整填充轴、光学尺寸与阅读方向。",
    icon: "component",
    detail: "可变字体与 React API",
  },
  {
    href: "/sdk",
    name: "应用运行时",
    packageName: "@miaixz/sdk",
    description: "在无后端依赖的沙盒中验证上下文、权限、请求与事件流。",
    icon: "code",
    detail: "本地确定性模拟接口",
  },
  {
    href: "/view",
    name: "文件预览",
    packageName: "@miaixz/view",
    description: "比较自动识别、图片、Office 与本地文件预览的接入方式。",
    icon: "file",
    detail: "浏览器内解析与资源预算",
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Miaixz package guides</p>
          <h1>一处运行，四处深入。</h1>
        </div>
        <p className={styles.lede}>
          这是仓库中唯一的示例应用。每个模块保留自己的源码边界，共享同一套导航、主题和本地包依赖。
        </p>
      </section>

      <section aria-label="指南列表" className={styles.moduleGrid}>
        {modules.map((module) => (
          <Link className={styles.module} href={module.href} key={module.href}>
            <div className={styles.moduleTopline}>
              <Icon name={module.icon} size="feature" />
              <Icon name="arrow-right" size="inline" />
            </div>
            <div>
              <code>{module.packageName}</code>
              <h2>{module.name}</h2>
              <p>{module.description}</p>
            </div>
            <span className={styles.detail}>{module.detail}</span>
          </Link>
        ))}
      </section>

      <section className={styles.structure}>
        <div>
          <h2>目录就是边界</h2>
          <p>路由只负责装配。组件、状态和演示数据全部留在各自模块内。</p>
        </div>
        <pre aria-label="示例目录结构">
          <code>{`examples/src/
├── app/
├── module/
│   ├── ui/
│   ├── icons/
│   ├── sdk/
│   └── view/
└── shared/`}</code>
        </pre>
      </section>
    </div>
  );
}
