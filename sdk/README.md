# @miaixz/sdk

`@miaixz/sdk` is an ESM-only npm package. It does not provide a CommonJS `require` entry point, so consumers must use standard ESM `import` statements.

This is the official Miaixz browser SDK. It gives independently deployed frontend services, such as Home, Spaces, and Settings, a shared API protocol and common authentication, runtime context, configuration, permissions, events, files, appearance, and internationalization capabilities.

The SDK has no third-party runtime dependencies and can be built and published independently with npm.

The current `0.5.x` development line uses Host Bridge protocol `1.0.0`.

## Installation

```bash
npm install @miaixz/sdk
```

## One-time setup

```ts
import { createMiaixzSdk } from "@miaixz/sdk";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.example",
    environment: "production",
    services: { space: "https://space-api.miaixz.example" },
  },
  csrfTokenProvider: () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content,
  locale: "en-US",
});

await sdk.ready;
sdk.context.set({
  tenantId: "tenant-1",
  spaceId: "space-1",
  locale: "en-US",
});
```

A tenant is the data and security isolation boundary. The SDK sends `tenantId` in the `X-Miaixz-Tenant-Id` request header. Other runtime context, including the active space, is also sent through headers and does not require path parameters such as `/spaces/:spaceId`.

`organizationId` identifies the selected organization entity inside the current tenant. It must never replace `tenantId` as the tenant isolation boundary. Departments, positions, job titles, and related structures remain part of the organization domain.

`context.set()` replaces the entire context. Use `context.patch()` for partial updates. Even when a full replacement omits `locale`, the composed SDK writes the active internationalization locale to request headers.

Authentication uses Cookie/BFF mode by default. Requests send `credentials: "include"`; the SDK does not read HttpOnly cookies, create token sessions, or attach an `Authorization` header. `POST`, `PUT`, `PATCH`, and `DELETE` requests also require a non-empty token from `csrfTokenProvider`. The SDK ignores same-named values supplied by consumers or request interceptors and writes only the provider result to `X-CSRF-Token`. `GET`, `HEAD`, and `OPTIONS` requests do not invoke the provider or attach that header.

Bearer mode must be enabled explicitly with `authMode: "bearer"`. Authentication sessions are stored only in the current SDK instance by default and do not survive a page reload:

```ts
const sdk = createMiaixzSdk({
  appId: "portal",
  authMode: "bearer",
  config,
});

sdk.auth.setSession({
  accessToken: "token",
  tokenType: "DP-Token",
});
```

Enable persistent storage through the dedicated factory only when you explicitly accept the risk that injected scripts could steal credentials from Web Storage. Prefer the default in-memory mode or HttpOnly Cookie/BFF mode:

```ts
import { createMiaixzPersistentAuthStorage, createMiaixzSdk } from "@miaixz/sdk";

const authPersistence = createMiaixzPersistentAuthStorage(window.sessionStorage, {
  acknowledgeWebStorageRisk: true,
});

const sdk = createMiaixzSdk({
  appId: "portal",
  authMode: "bearer",
  authPersistence,
  config,
});
```

## API response envelope

All JSON APIs use the following response envelope by default:

```json
{
  "errcode": "0",
  "errmsg": "success",
  "data": {}
}
```

- `String(errcode) === "0"`: the request succeeded, and the SDK returns the inner `data` value automatically.
- `errcode !== "0"`: the SDK throws `MiaixzApiError`, even when the HTTP status is `200`.
- A JSON response without `errcode`, `errmsg`, or `data`: the SDK throws an error with code `API_ENVELOPE_INVALID`.
- Text, Blob, ArrayBuffer, and empty responses do not require this envelope.

```ts
interface Space {
  id: string;
  name: string;
}

const response = await sdk.api.get<Space>("/space/current");

// The response already contains data; response.data.data is unnecessary.
console.log(response.data.name);
```

Exceptional endpoints can set `envelope: "optional"` to accept JSON with or without an envelope. Set `envelope: "none"` to preserve the raw JSON value. Business APIs should keep the default `required` mode.

## Project locale catalogs

The SDK contains only foundational error messages. Each project or microservice can extend and override messages through its own locale catalogs, which may be loaded lazily per locale.

```ts
// src/locales/en-US.ts
import type { MiaixzMessages } from "@miaixz/sdk/i18n";

export default {
  "space.error.notFound": "Space not found",
  "sdk.error.network": "The network is unavailable. Try again later.",
} satisfies MiaixzMessages;
```

```ts
import { createMiaixzMessageLoader, createMiaixzSdk } from "@miaixz/sdk";

const loadMessages = createMiaixzMessageLoader({
  space: {
    "en-US": () => import("./locales/en-US.js"),
    "fr-FR": () => import("./locales/fr-FR.js"),
  },
});

const sdk = createMiaixzSdk({
  appId: "portal",
  config,
  locale: "en-US",
  fallbackLocale: "en-US",
  loadMessages,
  onI18nLoadError(error) {
    // Delegate reporting to the project logger or error interface.
    reportError(error);
  },
});

await sdk.ready;
console.log(sdk.i18n.t("space.error.notFound"));

// The target project catalog is loaded and cached before the locale changes.
await sdk.i18n.changeLocale("fr-FR");
```

Statically imported catalogs can also be passed through `messages` during initialization. Project messages take precedence over built-in SDK messages. Missing messages fall back to `fallbackLocale`; if no fallback is available, the message key is returned.

Backend business errors can use `api.error.<errcode>` as a project message key, for example `api.error.SPACE_FORBIDDEN`. The SDK uses the project translation when the key exists and otherwise falls back to the `errmsg` returned by the API.

## Appearance, themes, and density

The SDK is the source of truth for appearance state across services. It validates settings, persists them per application and tenant, and publishes changes. `@miaixz/ui` is responsible for applying those settings to the DOM:

```ts
import { createMiaixzSdk } from "@miaixz/sdk";
import { applyMiaixzAppearance } from "@miaixz/ui/appearance";

const sdk = createMiaixzSdk({ appId: "portal", config });

applyMiaixzAppearance(sdk.appearance.getSnapshot());
const stopAppearance = sdk.appearance.subscribe((appearance) => {
  applyMiaixzAppearance(appearance);
});

sdk.appearance.patch({
  colorMode: "dark",
  density: "compact",
  colors: { brand: "#55b52d" },
});

stopAppearance();
sdk.destroy();
```

Supported color preferences are `light`, `dark`, and `system`. Supported density levels are `compact`, `standard`, and `comfortable`. Every custom semantic color is validated for format and contrast before the update is committed; invalid settings are never written partially.

## Service-specific APIs

```ts
const spaceApi = sdk.createServiceClient("space");
const spaces = await spaceApi.get<readonly Space[]>("/spaces");
```

Service endpoints come from centralized configuration, so frontend services do not need to hard-code deployment addresses.

Primary and service endpoints must be absolute URLs. Production and staging environments accept HTTPS only. Development and test environments additionally accept HTTP endpoints on `localhost`, `127.0.0.1`, and `[::1]`. Endpoints cannot contain user information, query parameters, or fragments.

Individual requests accept only relative paths or same-origin paths beginning with `/`. Absolute URLs and `//host` values are rejected. Cross-service calls must use the corresponding service client. Authentication, cookies, CSRF, and runtime context requests always use `redirect: "error"`; request interceptors cannot weaken this security policy or forward requests to another origin.

```ts
import { createApiClient } from "@miaixz/sdk/api";

const publicApi = createApiClient({
  baseUrl: "https://public-api.miaixz.example",
  environment: "production",
});

await publicApi.get("/health", {
  authenticate: false,
  includeContext: false,
});
```

After `sdk.config.set(nextConfig)`, the primary API client and file client switch automatically to the new address and timeout configuration. Service clients created afterward also use the latest configuration.

## Error handling

The SDK never throws bare strings. Request failures preserve a stable type, machine-readable code, and safe diagnostic fields. Consumers should handle recoverable branches first and then pass message keys to the internationalization runtime:

```ts
import {
  isMiaixzApiError,
  MiaixzAbortError,
  MiaixzNetworkError,
  MiaixzTimeoutError,
} from "@miaixz/sdk/errors";

try {
  await sdk.api.get("/spaces");
} catch (error) {
  if (error instanceof MiaixzAbortError) return;
  if (error instanceof MiaixzTimeoutError || error instanceof MiaixzNetworkError) {
    showRetryMessage(error.message);
    return;
  }
  if (isMiaixzApiError(error)) {
    showApiMessage({ code: error.code, message: error.message, retryable: error.retryable });
    return;
  }
  throw error;
}
```

Never record tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or file contents in logs or telemetry. Frontend errors support interaction only; the server must still perform authorization and input validation.

## Permissions

```ts
sdk.setPermissions({
  allowed: ["space:*", "organization:read"],
  denied: ["space:delete"],
  roles: ["member"],
});

sdk.permissions.can("space:read");
sdk.permissions.canAll(["space:read", "organization:read"]);
```

Frontend permissions control presentation and interaction only. They do not replace server-side authorization.

## Local and cross-tab events

SDK events are dispatched synchronously within the current instance by default and do not create a `BroadcastChannel`. To enable same-origin cross-tab synchronization, the composed entry point derives a unique versioned channel name from `appId`:

```ts
const sdk = createMiaixzSdk({
  appId: "portal",
  config,
  eventChannel: true,
});

const stop = sdk.events.on("locale:changed", ({ locale }) => {
  console.log(locale);
});

stop();
```

Built-in authentication, context, appearance, locale, and configuration events have mandatory runtime validators. Authentication events carry only the `authenticated` or `anonymous` state and never expose sessions, tokens, cookies, or authorization headers.

Application-defined events can also be used within the current instance. A matching runtime validator is required before an event can cross tabs. When creating an event bus directly, use a channel name in the form `miaixz:v1:<appId>:events`:

```ts
import { createMiaixzEventBus } from "@miaixz/sdk/events";

interface PortalEvents {
  "portal:ready": Readonly<{ ready: boolean }>;
}

const events = createMiaixzEventBus<PortalEvents>({
  channelName: "miaixz:v1:portal:events",
  validators: {
    "portal:ready": (payload) =>
      typeof payload === "object" &&
      payload !== null &&
      "ready" in payload &&
      typeof payload.ready === "boolean",
  },
});
```

## Stable subpaths

```ts
import { createApiClient } from "@miaixz/sdk/api";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import type { MiaixzSpace } from "@miaixz/sdk/types";
import { formatMiaixzBytes } from "@miaixz/sdk/formatters";
```

Published subpaths include `api`, `auth`, `context`, `config`, `contracts`, `permissions`, `events`, `storage`, `appearance`, `files`, `i18n`, `sdk`, `consts`, `errors`, `formatters`, `models`, `types`, `utils`, and `validators`.

## Microfrontend module manifests

Independently deployed modules need only `@miaixz/sdk` to declare and validate pure JSON manifests:

```ts
import {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  parseMiaixzModuleManifest,
  type MiaixzIntegratedModule,
  type MiaixzModuleManifest,
} from "@miaixz/sdk/contracts";

const manifest = {
  protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
  id: "spaces-console",
  version: "1.2.0",
  hostVersion: "^1.0.0",
  kind: "integrated",
  basePath: "/spaces",
  entry: "@miaixz/spaces",
  routes: [
    {
      id: "spaces-home",
      path: "/",
      titleKey: "spaces.route.home",
      requiredPermissions: ["spaces:workspace:read"],
    },
  ],
  navigation: [
    {
      id: "spaces-navigation",
      routeId: "spaces-home",
      labelKey: "spaces.navigation.home",
      order: 10,
    },
  ],
  requiredPermissions: ["spaces:workspace:read"],
  requiredCapabilities: ["context", "navigation", "permissions"],
} satisfies MiaixzModuleManifest;

const verifiedManifest = parseMiaixzModuleManifest(manifest, {
  environment: "production",
  hostVersion: "1.3.0",
});

export const module: MiaixzIntegratedModule = {
  mount({ container }) {
    container.textContent = verifiedManifest.id;
    return {
      unmount() {
        container.replaceChildren();
      },
    };
  },
};
```

Modules in the same runtime use `createMiaixzDirectHostBridge()`. Cross-origin iframes must use exact origins on both sides and create separate host and child bridges. Never use `"*"`:

```ts
import { createMiaixzDirectHostBridge } from "@miaixz/sdk/runtime";

const bridge = createMiaixzDirectHostBridge({
  moduleId: "spaces-console",
  adapter: {
    getContext: async () => sdk.context.getSnapshot(),
    hasPermissions: async (permissions) => sdk.permissions.canAll(permissions),
  },
});

const context = await bridge.getContext();
bridge.dispose();
```

Modules must not obtain context through shared globals or direct access to the host DOM. See the [repository examples](https://github.com/818000/miaixz.js/tree/main/sdk/tests/examples) for complete compilable examples.

## Local development

```bash
npm install
npm run check
npm run pack:check
```

Publishing is coordinated by the repository release workflow. Both npm packages must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security

See the repository [security policy](../SECURITY.md) for vulnerability reporting instructions and supported release information.

## License

Apache-2.0
