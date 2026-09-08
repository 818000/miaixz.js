import type {} from "vite/client";

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { createRoot } from "react-dom/client";
import { useState } from "react";

import {
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
  Input,
  getButtonClassName,
  Metric,
  MetricGroup,
  MiaixzLocaleProvider,
  Panel,
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
          <Panel
            actions={
              <a className={getButtonClassName({ variant: "link" })} href="#tables">
                查看表格
              </a>
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
            <Button aria-label="刷新" iconOnly>
              ↻
            </Button>
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
