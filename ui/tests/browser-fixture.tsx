import type {} from "vite/client";

/* eslint-disable jsdoc/require-jsdoc -- Browser fixtures use compact deterministic callbacks.
 */

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { createRoot } from "react-dom/client";
import { useState } from "react";

import {
  ActionBar,
  ActionText,
  Alert,
  Appearance,
  Avatar,
  Button,
  Combobox,
  Datagrid,
  Descriptions,
  defineTheme,
  Dialog,
  Donut,
  Dropdown,
  Drawer,
  DRAWER_WIDTHS,
  EditorLayout,
  EditorSection,
  EditorSummary,
  Field,
  FormActions,
  Graph,
  Input,
  IconButton,
  Metric,
  Metrics,
  MiaixzLocaleProvider,
  Panel,
  RowActions,
  Select,
  Sparkline,
  Status,
  Steps,
  Switch,
  Tabs,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Theme,
  Timeline,
  Toolbar,
  Tree,
  Upload,
  type CommandAction,
  type MiaixzIconName,
} from "../src/index.js";
import "../src/theme/miaixz.css";

const parameters = new URLSearchParams(window.location.search);
const theme = parameters.get("theme") ?? "miaixz";
const colorMode = parameters.get("colorMode") === "dark" ? "dark" : "light";
const densityParameter = parameters.get("density");
const density =
  densityParameter === "compact" || densityParameter === "comfortable"
    ? densityParameter
    : "standard";
const appearance = createMiaixzAppearanceManager({
  appId: "miaixz-ui-browser-fixture",
  ...(parameters.size > 0 ? { initialAppearance: { theme, colorMode, density } } : {}),
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    removeItem: (key) => window.localStorage.removeItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
});
const i18n = createMiaixzI18n();
const legacyTheme = defineTheme({
  schemaVersion: 1,
  name: "legacy-custom",
  label: "Legacy custom",
  version: "1.0.0",
  extends: "miaixz",
  tokens: { typography: { bodySize: 15 } },
  modes: { light: {}, dark: {} },
});

/**
 * Creates the final command-action shape used by browser fixtures.
 *
 * @param id - Stable action identifier.
 * @param label - Visible and accessible label.
 * @param icon - Public icon name.
 * @param options - Optional command state and presentation.
 * @returns A complete command action.
 */
function commandAction(
  id: string,
  label: string,
  icon: MiaixzIconName,
  options: Pick<CommandAction, "buttonProps" | "disabled" | "loading" | "tone"> = {},
): CommandAction {
  return { id, kind: "command", label, icon, onAction: () => undefined, ...options };
}

/**
 * Renders the six frozen action-system visual baselines with real components.
 *
 * @returns The interactive action showcase.
 */
function ActionShowcase() {
  return (
    <section aria-label="操作体系基线" data-testid="action-showcase">
      <Panel
        data-testid="action-baseline-page-header"
        actions={
          <ActionBar
            primary={commandAction("showcase-create", "新建资源", "Plus", { tone: "brand" })}
            actions={[
              commandAction("showcase-import", "导入", "Upload"),
              commandAction("showcase-refresh", "刷新", "RefreshCw"),
            ]}
          />
        }
        description="一个实体主操作和两个低权重普通操作"
        title="01 页面头部"
      >
        内容标题与摘要保持第一视觉层级。
      </Panel>

      <Panel
        data-testid="action-baseline-card-header"
        actions={
          <ActionBar
            actions={[
              commandAction("showcase-edit-card", "编辑", "Pencil"),
              commandAction("showcase-configure-card", "配置", "Settings"),
            ]}
          />
        }
        description="普通操作只显示图标和文字，不占据内容焦点"
        title="02 卡片头部"
      >
        卡片正文用于承载核心信息。
      </Panel>

      <Panel
        data-testid="action-baseline-table-row"
        description="危险操作固定收进更多菜单"
        title="03 表格行"
      >
        <TableContainer>
          <Table>
            <TableCaption>操作密度基线</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>示例资源</TableCell>
                <TableCell>正常</TableCell>
                <TableCell>
                  <RowActions
                    actions={[
                      commandAction("showcase-view-row", "查看", "Eye"),
                      commandAction("showcase-edit-row", "编辑", "Pencil"),
                      commandAction("showcase-export-row", "导出", "Download"),
                      commandAction("showcase-delete-row", "删除", "Trash2", {
                        tone: "danger",
                      }),
                    ]}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>

      <Panel
        data-testid="action-baseline-icon-actions"
        actions={
          <div aria-label="图标操作" className="miaixz-action-bar" role="toolbar">
            <IconButton icon="ArrowLeft" label="返回" onClick={() => undefined} />
            <IconButton icon="Star" label="收藏" pressed onClick={() => undefined} />
            <IconButton icon="X" label="关闭" onClick={() => undefined} />
            <IconButton icon="Ellipsis" label="更多操作" onClick={() => undefined} />
          </div>
        }
        description="仅用于空间受限且图标含义明确的操作"
        title="04 图标操作"
      >
        聚焦或悬停 300ms 后显示说明。
      </Panel>

      <Panel
        data-testid="action-baseline-form-actions"
        description="取消在左、唯一提交操作在右"
        title="05 表单底部"
      >
        <FormActions
          cancel={{
            id: "showcase-cancel",
            label: "取消",
            icon: "CircleX",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save",
            label: "保存",
            icon: "Save",
            tone: "brand",
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-loading",
            label: "取消",
            icon: "CircleX",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save-loading",
            label: "保存",
            icon: "Save",
            tone: "brand",
            loading: true,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-disabled",
            label: "取消",
            icon: "CircleX",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save-disabled",
            label: "保存",
            icon: "Save",
            tone: "brand",
            disabled: true,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-danger",
            label: "取消",
            icon: "CircleX",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-delete-confirm",
            label: "确认删除",
            icon: "Trash2",
            tone: "danger",
          }}
        />
      </Panel>

      <Panel
        data-testid="action-baseline-state-matrix"
        description="主题、密度及所有关键状态共用固定配方"
        title="06 状态矩阵"
      >
        <div aria-label="操作状态矩阵" className="miaixz-action-bar" role="group">
          <ActionText
            action={commandAction("showcase-default", "默认", "Pencil", {
              buttonProps: { "data-testid": "action-default" },
            })}
          />
          <ActionText
            action={commandAction("showcase-brand", "品牌", "ShieldCheck", {
              tone: "brand",
              buttonProps: { "data-testid": "action-brand" },
            })}
          />
          <ActionText
            action={commandAction("showcase-danger", "危险", "Trash2", {
              tone: "danger",
              buttonProps: { "data-testid": "action-danger" },
            })}
          />
          <ActionText
            action={commandAction("showcase-disabled", "禁用", "Pencil", {
              disabled: true,
            })}
          />
          <ActionText
            action={commandAction("showcase-loading", "加载", "RefreshCw", {
              loading: true,
            })}
          />
          <Button tone="brand" variant="solid">
            主按钮
          </Button>
          <Button variant="outlined">次按钮</Button>
          <Button tone="danger" variant="solid">
            危险按钮
          </Button>
        </div>
      </Panel>
    </section>
  );
}

export type AccessibilityFixtureName =
  | "alert"
  | "avatar"
  | "dialog"
  | "drawer"
  | "select"
  | "combobox"
  | "dropdown"
  | "tabs"
  | "tree"
  | "datagrid"
  | "upload"
  | "timeline"
  | "sparkline"
  | "donut"
  | "graph";

/**
 * Renders one isolated public component for attributed accessibility checks.
 *
 * @param props - Selected fixture name.
 * @param props.name - Public component fixture to render.
 * @returns One independently scannable component.
 */
export function AccessibilityFixture({ name }: { readonly name: AccessibilityFixtureName }) {
  const [open, setOpen] = useState(true);
  const testId = `a11y-${name}`;

  switch (name) {
    case "alert":
      return (
        <Alert data-testid={testId} title="同步完成" tone="success">
          所有记录均已保存。
        </Alert>
      );
    case "avatar":
      return <Avatar alt="用户 Kimi" data-testid={testId} name="Kimi Leaves" />;
    case "dialog":
      return (
        <Dialog
          data-testid={testId}
          description="检查当前发布配置。"
          open={open}
          title="发布确认"
          onOpenChange={setOpen}
        >
          <Button>确认发布</Button>
        </Dialog>
      );
    case "drawer":
      return (
        <Drawer
          data-testid={testId}
          description="编辑资源的基础信息。"
          open={open}
          title="资源详情"
          onOpenChange={setOpen}
        >
          <Button>保存资源</Button>
        </Drawer>
      );
    case "select":
      return (
        <Field label="运行环境">
          <Select
            defaultValue="production"
            items={[
              {
                id: "environment-production",
                kind: "option",
                label: "生产环境",
                textValue: "生产环境",
                value: "production",
              },
            ]}
            slotProps={{ root: { "data-testid": testId } }}
          />
        </Field>
      );
    case "combobox":
      return (
        <Combobox
          data-testid={testId}
          label="负责人"
          options={[{ label: "Kimi", textValue: "Kimi", value: "kimi" }]}
        />
      );
    case "dropdown":
      return (
        <div data-testid={testId}>
          <Dropdown
            items={[
              {
                id: "refresh",
                kind: "action",
                label: "刷新",
                textValue: "刷新",
                onAction: () => undefined,
              },
            ]}
            label="资源操作"
            trigger={<button type="button">更多操作</button>}
          />
        </div>
      );
    case "tabs":
      return (
        <Tabs
          data-testid={testId}
          defaultValue="overview"
          items={[
            { content: "概览内容", label: "概览", value: "overview" },
            { content: "审计内容", label: "审计", value: "audit" },
          ]}
          label="资源视图"
        />
      );
    case "tree":
      return (
        <Tree
          data-testid={testId}
          defaultExpandedIds={["platform"]}
          label="资源目录"
          nodes={[
            {
              children: [{ id: "service", label: "服务", textValue: "服务" }],
              id: "platform",
              label: "平台",
              textValue: "平台",
            },
          ]}
        />
      );
    case "datagrid":
      return (
        <Datagrid
          caption="成员列表"
          columns={[{ cell: (row) => row.name, header: "姓名", id: "name" }]}
          data-testid={testId}
          getRowId={(row) => row.id}
          rows={[{ id: "kimi", name: "Kimi" }]}
        />
      );
    case "upload":
      return (
        <Upload
          browseLabel="选择文件"
          data-testid={testId}
          dropLabel="拖放文件到此处"
          label="上传附件"
          removePolicy="immediate"
          upload={async () => undefined}
          onComplete={() => undefined}
          onError={() => undefined}
        />
      );
    case "timeline":
      return (
        <Timeline
          aria-label="发布记录"
          data-testid={testId}
          items={[
            {
              id: "published",
              status: "已完成",
              title: "发布生产版本",
              tone: "positive",
            },
          ]}
        />
      );
    case "sparkline":
      return (
        <Sparkline aria-label="最近五次请求量" data-testid={testId} values={[12, 18, 15, 24, 21]} />
      );
    case "donut":
      return (
        <Donut
          aria-label="资源状态分布"
          data-testid={testId}
          segments={[
            { id: "healthy", label: "正常", tone: "data-1", value: 8 },
            { id: "warning", label: "警告", tone: "data-2", value: 2 },
          ]}
        />
      );
    case "graph":
      return (
        <Graph
          aria-label="服务关系"
          data-testid={testId}
          edges={[{ directed: true, id: "api-db", sourceId: "api", targetId: "db" }]}
          nodes={[
            { id: "api", label: "API", tone: "brand", x: 25, y: 50 },
            { id: "db", label: "Database", tone: "data-1", x: 75, y: 50 },
          ]}
          tableCaption="服务连接"
        />
      );
  }
}

/**
 * Renders the interactive public-package browser contract fixture.
 *
 * @returns Theme, component, persistence, table, and drawer consumers.
 */
export function BrowserFixture() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const [drawer, setDrawer] = useState<"closed" | "outer" | "nested">("closed");
  const [drawerWidth, setDrawerWidth] = useState(Number(parameters.get("drawerWidth") ?? 490));
  const [enabled, setEnabled] = useState(true);
  const [formStatus, setFormStatus] = useState("尚未提交");
  const metricItems = Array.from({ length: 5 }, (_, index) => (
    <Metric
      hint={`固定数据 ${index + 1}`}
      key={index}
      label={`指标 ${index + 1}`}
      tone={index === 1 ? "warning" : "brand"}
      value={(index + 1) * 10}
    />
  ));
  const accessibilityFixture = parameters.get("a11y") as AccessibilityFixtureName | null;

  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance} fallback="miaixz" themes={[legacyTheme]}>
        {accessibilityFixture === null ? (
          <Appearance scope="authenticated" />
        ) : (
          <AccessibilityFixture name={accessibilityFixture} />
        )}
        {accessibilityFixture === null && (
          <main aria-label="Miaixz UI 浏览器契约夹具">
            <ActionShowcase />
            <Panel
              actions={
                <ActionText
                  action={{
                    id: "view-table",
                    kind: "navigation",
                    label: "查看表格",
                    icon: "Eye",
                    tone: "neutral",
                    href: "#tables",
                  }}
                />
              }
              description="真实公共出口和固定数据"
              headingLevel={2}
              title="组件状态"
            >
              <Button tone="brand" variant="solid">
                默认按钮
              </Button>
              <Button disabled>禁用按钮</Button>
              <Button loading loadingLabel="正在保存">
                保存
              </Button>
              <IconButton icon="RefreshCw" label="刷新" onClick={() => undefined} />
              <Button
                onClick={() =>
                  appearance.setDensity(
                    appearance.getSnapshot().density === "compact" ? "standard" : "compact",
                  )
                }
              >
                切换密度偏好
              </Button>
              <Status label="品牌状态" tone="brand" />
              <Status label="失败状态" tone="danger" />
              <Switch
                aria-label="启用同步"
                checked={enabled}
                size="small"
                onChange={() => setEnabled((value) => !value)}
              />
            </Panel>

            <Metrics aria-label="四项指标" role="group">
              {metricItems.slice(0, 4)}
            </Metrics>
            <Metrics aria-label="五项紧凑指标" columns={5} density="compact" surface="plain">
              {metricItems}
            </Metrics>

            <Panel surface="plain" title="流程与详情">
              <Steps
                items={[
                  { id: "draft", label: "草稿", status: "complete" },
                  { id: "review", label: "审核", status: "current" },
                  { id: "publish", label: "发布" },
                ]}
                label="发布流程"
              />
              <Descriptions
                columns={3}
                density="compact"
                items={[
                  { id: "owner", label: "负责人", value: "Kimi" },
                  { id: "scope", label: "范围", value: "生产" },
                  { id: "version", label: "版本", value: "v1" },
                ]}
              />
            </Panel>

            <section aria-label="原生表单契约" data-testid="native-form-contract">
              <form
                aria-label="原生提交表单"
                onSubmit={(event) => {
                  event.preventDefault();
                  setFormStatus("已提交");
                }}
              >
                <Field label="必填名称" required>
                  <Input name="name" required />
                </Field>
                <FormActions submit={{ id: "native-submit", label: "提交原生表单" }} />
                <output aria-live="polite">{formStatus}</output>
              </form>
            </section>

            <section aria-label="键盘组件契约" data-testid="keyboard-contracts">
              <Tabs
                activationMode="automatic"
                defaultValue="overview"
                items={[
                  { value: "overview", label: "概览", content: "概览内容" },
                  { value: "details", label: "详情", content: "详情内容" },
                ]}
                label="浏览器标签页"
              />
              <Toolbar aria-label="编辑工具" behavior="toolbar">
                <Button>第一个工具</Button>
                <Button>第二个工具</Button>
              </Toolbar>
              <Tree
                defaultExpandedIds={[]}
                label="浏览器目录"
                nodes={[
                  {
                    id: "platform",
                    label: "平台",
                    textValue: "平台",
                    children: [{ id: "services", label: "服务", textValue: "服务" }],
                  },
                  { id: "audit", label: "审计", textValue: "审计" },
                ]}
              />
              <Graph
                aria-label="服务关系"
                edges={[{ directed: true, id: "api-db", sourceId: "api", targetId: "db" }]}
                nodes={[
                  { id: "api", label: "API", tone: "brand", x: 25, y: 50 },
                  { id: "db", label: "Database", tone: "data-1", x: 75, y: 50 },
                ]}
                tableCaption="服务连接"
              />
            </section>

            <EditorLayout
              summary={
                <EditorSummary
                  avatar={<span>KL</span>}
                  items={[{ id: "status", label: "状态", value: "启用" }]}
                  subtitle="@kimi"
                  title="编辑摘要"
                />
              }
            >
              <EditorSection description="公共字段布局" layout="two-column" title="基础信息">
                <Field label="名称">
                  <Input defaultValue="固定名称" />
                </Field>
                <Field label="标识">
                  <Input defaultValue="fixture" />
                </Field>
              </EditorSection>
            </EditorLayout>

            <TableContainer id="tables">
              <Table>
                <TableCaption>固定成员数据</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow selected>
                    <TableCell>Kimi</TableCell>
                    <TableCell>启用</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <div ref={setBoundary} data-testid="drawer-boundary">
              <Button onClick={() => setDrawer("outer")}>打开长内容抽屉</Button>
              <Drawer
                boundary={parameters.has("drawerWidth") ? undefined : boundary}
                description="边界、长内容与嵌套场景"
                footer={<Button onClick={() => setDrawer("closed")}>完成</Button>}
                onOpenChange={(open) => setDrawer(open ? "outer" : "closed")}
                open={drawer !== "closed"}
                title="外层抽屉"
                width={drawerWidth}
              >
                {parameters.has("drawerWidth") && (
                  <select
                    aria-label="抽屉宽度"
                    value={drawerWidth}
                    onChange={(event) => setDrawerWidth(Number(event.currentTarget.value))}
                  >
                    {[...DRAWER_WIDTHS, 435.5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
                <Button onClick={() => setDrawer("nested")}>打开内层抽屉</Button>
                {Array.from({ length: 24 }, (_, index) => (
                  <p key={index}>长内容行 {index + 1}：用于固定抽屉滚动和容器几何。</p>
                ))}
                <Drawer
                  onOpenChange={(open) => setDrawer(open ? "nested" : "outer")}
                  open={drawer === "nested"}
                  title="内层抽屉"
                >
                  <Button>内层操作</Button>
                </Drawer>
              </Drawer>
            </div>
          </main>
        )}
      </Theme>
    </MiaixzLocaleProvider>
  );
}

const root = document.getElementById("root");
if (root !== null) createRoot(root).render(<BrowserFixture />);
