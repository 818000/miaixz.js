import "@miaixz/icons/styles.css";
import "@miaixz/ui/styles.css";
import "./styles.css";

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Field,
  FormActions,
  Grid,
  Input,
  Metric,
  Metrics,
  MiaixzLocaleProvider,
  Panel,
  Progress,
  Select,
  Stack,
  Status,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Theme,
  useTheme,
  type SelectEntry,
} from "@miaixz/ui";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

const appearance = createMiaixzAppearanceManager({ appId: "ui-example" });
const i18n = createMiaixzI18n({ locale: "zh-CN", fallbackLocale: "en-US" });

const modeItems: readonly SelectEntry[] = [
  { kind: "option", id: "system", value: "system", label: "跟随系统", textValue: "跟随系统" },
  { kind: "option", id: "light", value: "light", label: "浅色", textValue: "浅色" },
  { kind: "option", id: "dark", value: "dark", label: "深色", textValue: "深色" },
];

const densityItems: readonly SelectEntry[] = [
  { kind: "option", id: "compact", value: "compact", label: "紧凑", textValue: "紧凑" },
  { kind: "option", id: "standard", value: "standard", label: "标准", textValue: "标准" },
  {
    kind: "option",
    id: "comfortable",
    value: "comfortable",
    label: "舒适",
    textValue: "舒适",
  },
];

const roleItems: readonly SelectEntry[] = [
  { kind: "option", id: "designer", value: "designer", label: "设计师", textValue: "设计师" },
  { kind: "option", id: "engineer", value: "engineer", label: "工程师", textValue: "工程师" },
  {
    kind: "option",
    id: "maintainer",
    value: "maintainer",
    label: "维护者",
    textValue: "维护者",
  },
];

function AppearanceControls() {
  const { colorMode, density, resolvedColorMode, setColorMode, setDensity, status } = useTheme();

  return (
    <div className="appearance-controls" aria-label="界面外观设置">
      <div className="appearance-status">
        <span>Theme</span>
        <strong>{resolvedColorMode}</strong>
        <Badge tone={status === "error" ? "danger" : "success"}>
          {status === "loading" ? "加载中" : "已应用"}
        </Badge>
      </div>
      <label>
        颜色模式
        <Select
          aria-label="颜色模式"
          items={modeItems}
          value={colorMode}
          widthPreset="compact"
          onValueChange={(value) => void setColorMode(value as typeof colorMode)}
        />
      </label>
      <label>
        界面密度
        <Select
          aria-label="界面密度"
          items={densityItems}
          value={density}
          widthPreset="compact"
          onValueChange={(value) => void setDensity(value as typeof density)}
        />
      </label>
    </div>
  );
}

function ComponentPlayground() {
  const [role, setRole] = useState("designer");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [locale, setLocale] = useState(i18n.locale);

  const toggleLocale = (): void => {
    const next = locale === "zh-CN" ? "en-US" : "zh-CN";
    void i18n.changeLocale(next).then(() => setLocale(next));
  };

  return (
    <main className="example-shell">
      <header className="page-header">
        <div>
          <p className="package-name">@miaixz/ui</p>
          <h1>真实主题，真实组件，真实状态。</h1>
          <p>这页直接运行公开组件 API，用同一套主题令牌连接表单、反馈、数据和内容结构。</p>
        </div>
        <ButtonGroup aria-label="页面操作">
          <Button onClick={toggleLocale}>{locale === "zh-CN" ? "English" : "简体中文"}</Button>
          <Button tone="brand" variant="solid" onClick={() => setSaved(true)}>
            保存示例
          </Button>
        </ButtonGroup>
      </header>

      <AppearanceControls />

      {saved && (
        <Alert
          dismissLabel="关闭通知"
          title="设置已保存"
          tone="success"
          onDismiss={() => setSaved(false)}
        >
          本地示例已完成一次成功反馈循环。
        </Alert>
      )}

      <Metrics aria-label="工作区指标" columns={4} layout="grid">
        <Metric hint="本周新增 3 个" label="组件" tone="brand" value="112" />
        <Metric hint="核心与扩展字形" label="图标" tone="info" value="1024" />
        <Metric hint="当前构建全部通过" label="检查" tone="success" value="8 / 8" />
        <Metric hint="公共 npm workspace" label="包" tone="neutral" value="8" />
      </Metrics>

      <div className="primary-grid">
        <Panel
          description="Field 负责标签和帮助信息，控件只管理自己的输入状态。"
          footer={
            <FormActions
              cancel={{
                id: "reset-member",
                label: "重置",
                onAction: () => document.querySelector<HTMLFormElement>("#member-form")?.reset(),
              }}
              submit={{
                id: "create-member",
                label: "创建成员",
                buttonProps: { form: "member-form" },
              }}
            />
          }
          title="表单组合"
        >
          <form
            id="member-form"
            onReset={() => {
              setRole("designer");
              setNotifications(true);
            }}
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(true);
            }}
          >
            <Stack gap="default">
              <Grid columns="two" minItemWidth="standard">
                <Field helperText="用于成员列表和活动记录。" label="显示名称" required>
                  <Input defaultValue="林默" name="displayName" />
                </Field>
                <Field helperText="邀请会发送到这个地址。" label="邮箱" required>
                  <Input defaultValue="lin@example.com" name="email" type="email" />
                </Field>
              </Grid>
              <Field label="角色">
                <Select
                  aria-label="角色"
                  items={roleItems}
                  name="role"
                  value={role}
                  onValueChange={setRole}
                />
              </Field>
              <Switch
                checked={notifications}
                description="成员加入空间后接收一封确认邮件。"
                label="发送通知"
                name="notifications"
                onChange={(event) => setNotifications(event.currentTarget.checked)}
              />
            </Stack>
          </form>
        </Panel>

        <Stack gap="default">
          <Panel description="语义状态使用同一套颜色与可访问性规则。" title="状态与反馈">
            <Stack gap="compact">
              <div className="status-row">
                <Status label="已同步" tone="success" />
                <Status label="等待审核" tone="warning" />
                <Status label="需要处理" tone="danger" />
              </div>
              <Progress label="发布进度" showValue tone="brand" value={72} />
              <Alert title="权限已更新" tone="info">
                新权限将在下一次请求中生效。
              </Alert>
            </Stack>
          </Panel>

          <Panel description="按钮层级由动作意图决定。" title="动作层级">
            <div className="button-showcase">
              <Button tone="brand" variant="solid">
                主要动作
              </Button>
              <Button variant="outlined">次要动作</Button>
              <Button variant="plain">文本动作</Button>
              <Button loading loadingLabel="正在处理">
                等待状态
              </Button>
              <Button disabled>不可用</Button>
              <Button tone="danger">危险动作</Button>
            </div>
          </Panel>
        </Stack>
      </div>

      <Panel description="Tabs 负责键盘导航，Table 保留原生表格语义。" title="内容与数据">
        <Tabs
          defaultValue="members"
          label="项目内容"
          items={[
            {
              value: "members",
              label: "成员",
              count: 3,
              content: (
                <TableContainer>
                  <Table>
                    <TableCaption>当前项目成员</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>成员</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow selected>
                        <TableCell>林默</TableCell>
                        <TableCell>维护者</TableCell>
                        <TableCell>
                          <Badge tone="success">在线</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>周岑</TableCell>
                        <TableCell>设计师</TableCell>
                        <TableCell>
                          <Badge tone="neutral">离线</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>许研</TableCell>
                        <TableCell>工程师</TableCell>
                        <TableCell>
                          <Badge tone="warning">待确认</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ),
            },
            {
              value: "notes",
              label: "说明",
              content: (
                <div className="notes-panel">
                  <h3>组合原则</h3>
                  <p>业务页面组合公开组件，不覆盖内部类名。品牌调整通过主题令牌完成。</p>
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </main>
  );
}

function App() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance}>
        <ComponentPlayground />
      </Theme>
    </MiaixzLocaleProvider>
  );
}

const root = document.querySelector<HTMLDivElement>("#root");
if (root === null) throw new Error("App root is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
