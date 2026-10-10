"use client";

import {
  Alert,
  Badge,
  Button,
  Dialog,
  Donut,
  Drawer,
  Input,
  NumberInput,
  Pagination,
  RadioGroup,
  Sparkline,
  Status,
} from "@miaixz/ui";
import { useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import { CompleteCatalog, UI_COMPONENT_NAMES } from "./catalog";
import styles from "./ui-workbench.module.css";

const chartValues = [18, 22, 19, 27, 31, 29, 38, 42, 39, 48];
const donutSegments = [
  { id: "ready", label: "已就绪", value: 68, tone: "success" as const },
  { id: "review", label: "待复核", value: 22, tone: "warning" as const },
  { id: "blocked", label: "已阻塞", value: 10, tone: "danger" as const },
];

/**
 * Demonstrates the UI runtime and representative component families.
 */
export function UiWorkbench() {
  const [page, setPage] = useState(4);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/ui"
        title="把设计系统直接放进真实状态里。"
        description="共享 Theme 与 MiaixzLocaleProvider 运行时，观察基础输入、反馈、数据可视化和浮层组件如何协同。"
      />

      <GuideSection
        title="运行时已连接"
        description="页面外层由同一个 Appearance、Theme 和 MiaixzLocaleProvider 驱动，右下角入口可以切换主题与语言。"
      >
        <div className={styles.stats}>
          <Stat label="公开入口" value={UI_COMPONENT_NAMES.length} detail="组件与 Provider" />
          <Stat label="主题作用域" value="1" detail="整站共享 runtime" />
          <Stat label="当前语言" value="zh-CN" detail="支持运行时切换" />
        </div>
      </GuideSection>

      <GuideSection title="输入与反馈" description="先从高频表单状态开始，所有控件都是真实组件。">
        <div className={styles.formGrid}>
          <div className={styles.formDemo}>
            <label htmlFor="ui-project-name">项目名称</label>
            <Input defaultValue="Miaixz Console" id="ui-project-name" />
            <label htmlFor="ui-team-size">团队人数</label>
            <NumberInput defaultValue={12} id="ui-team-size" min={1} max={99} />
            <RadioGroup
              defaultValue="standard"
              items={[
                { id: "compact", value: "compact", label: "紧凑" },
                { id: "standard", value: "standard", label: "标准" },
                { id: "comfortable", value: "comfortable", label: "舒适" },
              ]}
              label="默认密度"
              name="ui-density"
              orientation="horizontal"
            />
          </div>
          <div className={styles.feedbackDemo}>
            <Alert title="配置已验证" tone="success">
              本地主题、图标字体与语言资源均已加载。
            </Alert>
            <div className={styles.statusRow}>
              <Status label="构建" tone="success">
                正常
              </Status>
              <Badge tone="brand">本地依赖</Badge>
              <Badge tone="info" variant="outlined">
                React 19
              </Badge>
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideSection
        title="数据展示"
        description="图形组件保留可访问名称，数值只是指南中的示例数据。"
      >
        <div className={styles.dataGrid}>
          <div className={styles.chartPanel}>
            <span>最近 10 次构建</span>
            <Sparkline
              aria-label="最近十次构建吞吐量示例"
              description="仅用于演示 Sparkline 组件的样例数据。"
              showGrid
              size="large"
              values={chartValues}
              variant="area"
            />
          </div>
          <div className={styles.chartPanel}>
            <span>任务分布</span>
            <Donut
              aria-label="任务状态分布示例"
              center="100"
              description="示例任务总数"
              legend="inline"
              segments={donutSegments}
            />
          </div>
        </div>
        <div className={styles.paginationDemo}>
          <Pagination
            label="组件目录分页"
            onPageChange={setPage}
            page={page}
            pageCount={12}
            summary={`第 ${page} 页，共 12 页`}
          />
        </div>
      </GuideSection>

      <GuideSection
        title="浮层行为"
        description="Dialog 与 Drawer 都保持受控状态，关闭原因由组件回传。"
      >
        <div className={styles.actionRow}>
          <Button onClick={() => setDialogOpen(true)}>打开 Dialog</Button>
          <Button onClick={() => setDrawerOpen(true)} tone="neutral" variant="outlined">
            打开 Drawer
          </Button>
        </div>
        <Dialog
          description="这是一个使用受控 open 状态的确认流程。"
          footer={<Button onClick={() => setDialogOpen(false)}>完成</Button>}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          title="确认发布"
        >
          所有指南模块将继续共享当前主题与语言设置。
        </Dialog>
        <Drawer
          description="适合承载不离开当前上下文的辅助设置。"
          footer={<Button onClick={() => setDrawerOpen(false)}>保存</Button>}
          onOpenChange={setDrawerOpen}
          open={drawerOpen}
          title="模块设置"
          width="medium"
        >
          Drawer 的焦点管理、Escape 关闭和背景交互都由组件处理。
        </Drawer>
        <CodeBlock label="Provider 组合">{`<MiaixzLocaleProvider i18n={i18n}>
  <Theme appearance={appearance}>
    <App />
  </Theme>
</MiaixzLocaleProvider>`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="完整公开目录"
        description="这里列出当前包导出的全部 React 组件与 Provider，便于核对覆盖范围。"
      >
        <CompleteCatalog />
      </GuideSection>
    </div>
  );
}
