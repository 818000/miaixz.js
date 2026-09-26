import "./styles.css";

import {
  createMiaixzSdk,
  formatMiaixzBytes,
  formatMiaixzDate,
  formatMiaixzNumber,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzRuntimeContext,
} from "@miaixz/sdk";

interface SpaceSummary {
  readonly id: string;
  readonly name: string;
  readonly members: number;
}

const spaces: readonly SpaceSummary[] = [
  { id: "space-design", name: "Design Systems", members: 18 },
  { id: "space-platform", name: "Platform", members: 12 },
  { id: "space-research", name: "Research", members: 7 },
];

let lastRequest = "尚未发送请求";

const mockFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const headers = Object.fromEntries(request.headers.entries());
  lastRequest = JSON.stringify(
    {
      method: request.method,
      url: request.url,
      headers,
    },
    null,
    2,
  );

  await new Promise((resolve) => window.setTimeout(resolve, 360));

  return new Response(
    JSON.stringify({
      errcode: "0",
      errmsg: "success",
      data: spaces,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};

const sdk = createMiaixzSdk({
  appId: "sdk-example",
  config: {
    apiBaseUrl: "https://api.example.test",
    environment: "development",
    release: "example",
    features: { filePreview: true, compactNavigation: false },
  },
  initialContext: {
    userId: "user-demo",
    tenantId: "tenant-north",
    spaceId: "space-design",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
  },
  locale: "zh-CN",
  fallbackLocale: "en-US",
  eventChannel: false,
  fetch: mockFetch,
  grants: {
    allowed: ["space.read", "space.member:*", "file.preview"],
    denied: ["space.member:delete"],
    roles: ["maintainer"],
  },
});

await sdk.ready;

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) throw new Error("App root is missing.");

root.innerHTML = `
  <main>
    <header class="hero">
      <div>
        <p class="kicker">@miaixz/sdk</p>
        <h1>浏览器能力，一处编排。</h1>
        <p class="lede">上下文、权限、事件、外观和 API 客户端共享同一套类型安全运行时。</p>
      </div>
      <div class="runtime-state" aria-label="SDK 状态">
        <span class="status-marker" aria-hidden="true"></span>
        <div>
          <strong>Runtime ready</strong>
          <small>Cookie / BFF mode</small>
        </div>
      </div>
    </header>

    <section class="summary" aria-label="运行时摘要">
      <div><span>环境</span><strong>development</strong></div>
      <div><span>租户</span><strong id="tenant-summary"></strong></div>
      <div><span>当前空间</span><strong id="space-summary"></strong></div>
      <div><span>语言</span><strong id="locale-summary"></strong></div>
    </section>

    <div class="workspace">
      <section class="panel context-panel" aria-labelledby="context-title">
        <div class="panel-heading">
          <div>
            <p class="section-label">Runtime context</p>
            <h2 id="context-title">请求上下文</h2>
          </div>
          <code>sdk.context.patch()</code>
        </div>
        <div class="form-grid">
          <label>
            租户
            <select id="tenant-select">
              <option value="tenant-north">tenant-north</option>
              <option value="tenant-labs">tenant-labs</option>
            </select>
          </label>
          <label>
            空间
            <select id="space-select">
              ${spaces.map((space) => `<option value="${space.id}">${space.name}</option>`).join("")}
            </select>
          </label>
          <label>
            语言
            <select id="locale-select">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
        </div>
        <pre id="context-output" class="code-output"></pre>
      </section>

      <section class="panel permissions-panel" aria-labelledby="permissions-title">
        <div class="panel-heading">
          <div>
            <p class="section-label">Resolved grants</p>
            <h2 id="permissions-title">权限快照</h2>
          </div>
          <span class="role">maintainer</span>
        </div>
        <div class="permission-list">
          <div><code>space.read</code><span data-permission="space.read"></span></div>
          <div><code>space.member:invite</code><span data-permission="space.member:invite"></span></div>
          <div><code>space.member:delete</code><span data-permission="space.member:delete"></span></div>
          <div><code>file.preview</code><span data-permission="file.preview"></span></div>
        </div>
      </section>

      <section class="panel appearance-panel" aria-labelledby="appearance-title">
        <div class="panel-heading">
          <div>
            <p class="section-label">Appearance state</p>
            <h2 id="appearance-title">界面偏好</h2>
          </div>
          <code>sdk.appearance</code>
        </div>
        <div class="segmented" role="group" aria-label="颜色模式">
          <button data-mode="light" type="button">浅色</button>
          <button data-mode="dark" type="button">深色</button>
          <button data-mode="system" type="button">跟随系统</button>
        </div>
        <label class="density-control">
          界面密度
          <select id="density-select">
            <option value="compact">紧凑</option>
            <option value="standard">标准</option>
            <option value="comfortable">舒适</option>
          </select>
        </label>
        <pre id="appearance-output" class="code-output"></pre>
      </section>

      <section class="panel api-panel" aria-labelledby="api-title">
        <div class="panel-heading">
          <div>
            <p class="section-label">Envelope aware</p>
            <h2 id="api-title">API 请求</h2>
          </div>
          <code>GET /spaces</code>
        </div>
        <p class="panel-copy">请求由本地 mock 返回，但仍经过真实客户端、上下文头和 envelope 解包流程。</p>
        <button class="primary-action" id="load-spaces" type="button">加载空间</button>
        <div id="spaces-output" class="space-results" aria-live="polite"></div>
        <details>
          <summary>查看最近请求</summary>
          <pre id="request-output" class="code-output"></pre>
        </details>
      </section>
    </div>

    <section class="panel formatter-panel" aria-labelledby="formatter-title">
      <div class="panel-heading">
        <div>
          <p class="section-label">Intl formatters</p>
          <h2 id="formatter-title">统一格式化</h2>
        </div>
        <span id="formatter-locale" class="role"></span>
      </div>
      <dl class="formatters">
        <div><dt>文件大小</dt><dd id="bytes-output"></dd></div>
        <div><dt>成员数量</dt><dd id="number-output"></dd></div>
        <div><dt>发布日期</dt><dd id="date-output"></dd></div>
      </dl>
    </section>

    <section class="event-section" aria-labelledby="events-title">
      <div>
        <p class="section-label">Typed event stream</p>
        <h2 id="events-title">运行时事件</h2>
        <p>修改上面的控件，观察同一 SDK 实例发布的状态变化。</p>
      </div>
      <ol id="event-log" aria-live="polite"></ol>
    </section>
  </main>
`;

const element = <T extends Element>(selector: string): T => {
  const match = document.querySelector<T>(selector);
  if (match === null) throw new Error(`Missing element: ${selector}`);
  return match;
};

const tenantSelect = element<HTMLSelectElement>("#tenant-select");
const spaceSelect = element<HTMLSelectElement>("#space-select");
const localeSelect = element<HTMLSelectElement>("#locale-select");
const densitySelect = element<HTMLSelectElement>("#density-select");
const eventLog = element<HTMLOListElement>("#event-log");
const events: string[] = [];

function appendEvent(label: string, value: string): void {
  events.unshift(
    `${new Date().toLocaleTimeString("zh-CN", { hour12: false })}  ${label}: ${value}`,
  );
  events.splice(5);
  eventLog.replaceChildren(
    ...events.map((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      return item;
    }),
  );
}

function renderContext(context: Readonly<MiaixzRuntimeContext>): void {
  element("#tenant-summary").textContent = context.tenantId ?? "未选择";
  element("#space-summary").textContent = context.spaceId ?? "未选择";
  element("#locale-summary").textContent = context.locale ?? sdk.i18n.locale;
  element("#context-output").textContent = JSON.stringify(context, null, 2);
}

function renderAppearance(): void {
  const appearance = sdk.appearance.getSnapshot();
  densitySelect.value = appearance.density;
  element("#appearance-output").textContent = JSON.stringify(appearance, null, 2);
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === appearance.colorMode));
  });
}

function renderFormatters(): void {
  const locale = sdk.i18n.locale;
  element("#formatter-locale").textContent = locale;
  element("#bytes-output").textContent = formatMiaixzBytes(18_458_624, { locale });
  element("#number-output").textContent = formatMiaixzNumber(12_480, { locale });
  element("#date-output").textContent = formatMiaixzDate("2026-09-26T08:30:00Z", {
    locale,
    dateStyle: "long",
  });
}

for (const node of document.querySelectorAll<HTMLElement>("[data-permission]")) {
  const permission = node.dataset.permission ?? "";
  const allowed = sdk.grants.can(permission);
  node.textContent = allowed ? "允许" : "拒绝";
  node.dataset.allowed = String(allowed);
}

tenantSelect.addEventListener("change", () => {
  sdk.context.patch({ tenantId: tenantSelect.value });
});

spaceSelect.addEventListener("change", () => {
  sdk.context.patch({ spaceId: spaceSelect.value });
});

localeSelect.addEventListener("change", () => {
  void sdk.i18n.changeLocale(localeSelect.value);
});

densitySelect.addEventListener("change", () => {
  sdk.appearance.setDensity(densitySelect.value as MiaixzDensity);
});

document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    sdk.appearance.setColorMode(button.dataset.mode as MiaixzColorMode);
  });
});

const loadSpacesButton = element<HTMLButtonElement>("#load-spaces");
loadSpacesButton.addEventListener("click", async () => {
  const button = loadSpacesButton;
  button.disabled = true;
  button.textContent = "加载中";
  element("#spaces-output").textContent = "正在请求空间数据";
  try {
    const response = await sdk.api.get<readonly SpaceSummary[]>("/spaces");
    const results = response.data.map((space) => {
      const item = document.createElement("article");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      name.textContent = space.name;
      meta.textContent = `${formatMiaixzNumber(space.members, { locale: sdk.i18n.locale })} 位成员`;
      item.append(name, meta);
      return item;
    });
    element("#spaces-output").replaceChildren(...results);
    element("#request-output").textContent = lastRequest;
    appendEvent("api", `收到 ${String(response.data.length)} 个空间`);
  } finally {
    button.disabled = false;
    button.textContent = "重新加载";
  }
});

sdk.context.subscribe((context) => {
  renderContext(context);
  appendEvent("context", `${context.tenantId ?? "none"} / ${context.spaceId ?? "none"}`);
});

sdk.appearance.subscribe((appearance) => {
  renderAppearance();
  appendEvent("appearance", `${appearance.colorMode} / ${appearance.density}`);
});

sdk.i18n.subscribe((snapshot) => {
  if (sdk.context.getSnapshot().locale !== snapshot.locale) {
    sdk.context.patch({ locale: snapshot.locale });
  }
  renderFormatters();
  appendEvent("locale", snapshot.locale);
});

renderContext(sdk.context.getSnapshot());
renderAppearance();
renderFormatters();
appendEvent("runtime", "ready");

window.addEventListener("pagehide", () => sdk.destroy(), { once: true });
