import type {} from "vite/client";

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { createRoot } from "react-dom/client";
import { useState } from "react";

import {
  ActionBar,
  ActionText,
  Appearance,
  Button,
  Descriptions,
  defineTheme,
  Drawer,
  DRAWER_WIDTHS,
  EditorLayout,
  EditorSection,
  EditorSummary,
  Field,
  FormActions,
  Input,
  IconButton,
  Metric,
  MetricGroup,
  MiaixzLocaleProvider,
  Panel,
  RowActions,
  Status,
  Steps,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Theme,
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
            primary={{
              id: "showcase-create",
              intent: "create",
              label: "新建资源",
              icon: "Plus",
              tone: "brand",
              confirm: "none",
              placement: "form-primary",
              onAction: () => undefined,
            }}
            actions={[
              {
                id: "showcase-import",
                intent: "import",
                label: "导入",
                icon: "Upload",
                tone: "neutral",
                confirm: "none",
                placement: "visible",
                onAction: () => undefined,
              },
              {
                id: "showcase-refresh",
                intent: "refresh",
                label: "刷新",
                icon: "RefreshCw",
                tone: "neutral",
                confirm: "none",
                placement: "visible",
                onAction: () => undefined,
              },
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
              {
                id: "showcase-edit-card",
                intent: "edit",
                label: "编辑",
                icon: "Pencil",
                tone: "neutral",
                confirm: "none",
                placement: "visible",
                onAction: () => undefined,
              },
              {
                id: "showcase-configure-card",
                intent: "configure",
                label: "配置",
                icon: "Settings",
                tone: "neutral",
                confirm: "none",
                placement: "visible",
                onAction: () => undefined,
              },
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
                      {
                        id: "showcase-view-row",
                        intent: "view",
                        label: "查看",
                        icon: "Eye",
                        tone: "neutral",
                        confirm: "none",
                        placement: "visible",
                        onAction: () => undefined,
                      },
                      {
                        id: "showcase-edit-row",
                        intent: "edit",
                        label: "编辑",
                        icon: "Pencil",
                        tone: "neutral",
                        confirm: "none",
                        placement: "visible",
                        onAction: () => undefined,
                      },
                      {
                        id: "showcase-export-row",
                        intent: "export",
                        label: "导出",
                        icon: "Download",
                        tone: "neutral",
                        confirm: "none",
                        placement: "overflow",
                        onAction: () => undefined,
                      },
                      {
                        id: "showcase-delete-row",
                        intent: "delete",
                        label: "删除",
                        icon: "Trash2",
                        tone: "danger",
                        confirm: "danger",
                        placement: "overflow",
                        onAction: () => undefined,
                      },
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
            <IconButton
              action={{
                id: "showcase-back",
                intent: "back",
                label: "返回",
                icon: "ArrowLeft",
                tone: "neutral",
                confirm: "none",
                placement: "icon",
                onAction: () => undefined,
              }}
            />
            <IconButton
              action={{
                id: "showcase-favorite",
                intent: "favorite",
                label: "收藏",
                icon: "Star",
                tone: "neutral",
                confirm: "none",
                placement: "icon",
                onAction: () => undefined,
              }}
              pressed
            />
            <IconButton
              action={{
                id: "showcase-close",
                intent: "close",
                label: "关闭",
                icon: "X",
                tone: "neutral",
                confirm: "none",
                placement: "icon",
                onAction: () => undefined,
              }}
            />
            <IconButton
              action={{
                id: "showcase-more",
                intent: "more",
                label: "更多操作",
                icon: "Ellipsis",
                tone: "neutral",
                confirm: "none",
                placement: "icon",
                onAction: () => undefined,
              }}
            />
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
            intent: "cancel",
            label: "取消",
            icon: "CircleX",
            tone: "neutral",
            confirm: "none",
            placement: "form-secondary",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save",
            intent: "save",
            label: "保存",
            icon: "Save",
            tone: "brand",
            confirm: "none",
            placement: "form-primary",
            onAction: () => undefined,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-loading",
            intent: "cancel",
            label: "取消",
            icon: "CircleX",
            tone: "neutral",
            confirm: "none",
            placement: "form-secondary",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save-loading",
            intent: "save",
            label: "保存",
            icon: "Save",
            tone: "brand",
            confirm: "none",
            placement: "form-primary",
            loading: true,
            onAction: () => undefined,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-disabled",
            intent: "cancel",
            label: "取消",
            icon: "CircleX",
            tone: "neutral",
            confirm: "none",
            placement: "form-secondary",
            onAction: () => undefined,
          }}
          dirty={false}
          submit={{
            id: "showcase-save-disabled",
            intent: "save",
            label: "保存",
            icon: "Save",
            tone: "brand",
            confirm: "none",
            placement: "form-primary",
            onAction: () => undefined,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-danger",
            intent: "cancel",
            label: "取消",
            icon: "CircleX",
            tone: "neutral",
            confirm: "none",
            placement: "form-secondary",
            onAction: () => undefined,
          }}
          danger
          submit={{
            id: "showcase-delete-confirm",
            intent: "submit",
            label: "确认删除",
            icon: "Trash2",
            tone: "brand",
            confirm: "danger",
            placement: "form-primary",
            onAction: () => undefined,
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
            action={{
              id: "showcase-default",
              intent: "edit",
              label: "默认",
              icon: "Pencil",
              tone: "neutral",
              confirm: "none",
              placement: "visible",
              onAction: () => undefined,
              "data-testid": "action-default",
            }}
          />
          <ActionText
            action={{
              id: "showcase-brand",
              intent: "validate",
              label: "品牌",
              icon: "ShieldCheck",
              tone: "brand",
              confirm: "none",
              placement: "visible",
              onAction: () => undefined,
              "data-testid": "action-brand",
            }}
          />
          <ActionText
            action={{
              id: "showcase-danger",
              intent: "delete",
              label: "危险",
              icon: "Trash2",
              tone: "danger",
              confirm: "danger",
              placement: "visible",
              onAction: () => undefined,
              "data-testid": "action-danger",
            }}
          />
          <ActionText
            action={{
              id: "showcase-disabled",
              intent: "edit",
              label: "禁用",
              icon: "Pencil",
              tone: "neutral",
              confirm: "none",
              placement: "visible",
              disabled: true,
              onAction: () => undefined,
            }}
          />
          <ActionText
            action={{
              id: "showcase-loading",
              intent: "refresh",
              label: "加载",
              icon: "RefreshCw",
              tone: "neutral",
              confirm: "none",
              placement: "visible",
              loading: true,
              onAction: () => undefined,
            }}
          />
          <Button variant="primary">主按钮</Button>
          <Button variant="secondary">次按钮</Button>
          <Button variant="danger">危险按钮</Button>
        </div>
      </Panel>
    </section>
  );
}

/**
 * Renders the interactive public-package browser contract fixture.
 *
 * @returns Theme, component, persistence, table, and drawer consumers.
 */
function BrowserFixture() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const [drawer, setDrawer] = useState<"closed" | "outer" | "nested">("closed");
  const [drawerWidth, setDrawerWidth] = useState(Number(parameters.get("drawerWidth") ?? 490));
  const [enabled, setEnabled] = useState(true);
  const metricItems = Array.from({ length: 5 }, (_, index) => (
    <Metric
      hint={`固定数据 ${index + 1}`}
      key={index}
      label={`指标 ${index + 1}`}
      tone={index === 1 ? "warning" : "brand"}
      value={(index + 1) * 10}
    />
  ));

  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance} fallback="miaixz" themes={[legacyTheme]}>
        <Appearance scope="authenticated" />
        <main aria-label="Miaixz UI 浏览器契约夹具">
          <ActionShowcase />
          <Panel
            actions={
              <ActionText
                action={{
                  id: "view-table",
                  intent: "view",
                  label: "查看表格",
                  icon: "Eye",
                  tone: "neutral",
                  confirm: "none",
                  placement: "visible",
                  href: "#tables",
                }}
              />
            }
            description="真实公共出口和固定数据"
            headingLevel={2}
            title="组件状态"
          >
            <Button variant="primary">默认按钮</Button>
            <Button disabled>禁用按钮</Button>
            <Button loading loadingLabel="正在保存">
              保存
            </Button>
            <IconButton
              action={{
                id: "refresh-fixture",
                intent: "refresh",
                label: "刷新",
                icon: "RefreshCw",
                tone: "neutral",
                confirm: "none",
                placement: "icon",
                onAction: () => undefined,
              }}
            />
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
              onChange={() => setEnabled((value) => !value)}
              variant="compact"
            />
          </Panel>

          <MetricGroup aria-label="四项指标" role="group">
            {metricItems.slice(0, 4)}
          </MetricGroup>
          <MetricGroup
            aria-label="五项紧凑指标"
            columns={5}
            density="compact"
            surface="transparent"
          >
            {metricItems}
          </MetricGroup>

          <Panel surface="transparent" title="流程与详情">
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

          <EditorLayout
            summary={
              <EditorSummary
                avatar={<span>KL</span>}
                items={[{ label: "状态", value: "启用" }]}
                subtitle="@kimi"
                title="编辑摘要"
              />
            }
          >
            <EditorSection description="公共字段布局" layout="two" title="基础信息">
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
              size={parameters.has("drawerWidth") ? "large" : "medium"}
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
      </Theme>
    </MiaixzLocaleProvider>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error("Browser fixture root is missing.");
createRoot(root).render(<BrowserFixture />);
