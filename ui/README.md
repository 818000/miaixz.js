# @miaixz/ui

`@miaixz/ui` is the shared Miaixz React design system. It provides independently deployed frontend services, such as Home, Spaces, and Settings, with a consistent set of design tokens, themes, density modes, Lucide icons, and reusable components.

The package is ESM-only and does not provide a CommonJS `require` entry point. JavaScript entry points do not load global CSS automatically; consumers must import the required stylesheet explicitly.

## Installation

```bash
npm install @miaixz/ui @miaixz/sdk react react-dom lucide-react
```

`@miaixz/sdk`, `react`, `react-dom`, and `lucide-react` are peer dependencies and are not bundled into the component package. The current `0.5.x` development line requires `@miaixz/sdk >=0.5.0 <1.0.0`.

## Basic usage

Load the complete stylesheet once at the application entry point and provide the SDK internationalization runtime above the component tree:

```tsx
import "@miaixz/ui/styles.css";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, FormField, Input, MiaixzLocaleProvider } from "@miaixz/ui";

const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function Example() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <FormField label="Space name" required>
        <Input placeholder="Enter a space name" />
      </FormField>
      <Button type="button">Save</Button>
    </MiaixzLocaleProvider>
  );
}
```

Components can be imported from the package root or from stable subpaths:

```tsx
import { Button } from "@miaixz/ui/button";
import { Icon } from "@miaixz/ui/icons";
```

Do not import from `dist` or from internal source paths.

## Style layers

- `@miaixz/ui/foundation.css`: design tokens and foundational theme, typography, spacing, radius, shadow, motion, and density capabilities.
- `@miaixz/ui/components.css`: component styles. When both layers define the same selector, the component layer is authoritative.
- `@miaixz/ui/styles.css`: the recommended complete entry point, combining the foundation and component layers in a stable order.

Business applications should not override internal component selectors. Apply brand customization through public CSS variables and runtime appearance settings.

## Themes, colors, and density

The SDK stores and synchronizes appearance state. The UI package applies validated settings to the DOM:

```ts
import { createMiaixzSdk } from "@miaixz/sdk";
import { applyMiaixzAppearance } from "@miaixz/ui/appearance";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.example",
    environment: "production",
  },
});

applyMiaixzAppearance(sdk.appearance.getSnapshot());
const stopAppearance = sdk.appearance.subscribe((appearance) => {
  applyMiaixzAppearance(appearance);
});

sdk.appearance.patch({
  colorMode: "system",
  density: "comfortable",
  colors: { brand: "#55b52d" },
});

// Call these when the service is unmounted.
stopAppearance();
sdk.destroy();
```

Supported color preferences are `light`, `dark`, and `system`. Supported density levels are `compact`, `standard`, and `comfortable`. The SDK persists appearance per application and tenant. Independently deployed services should synchronize the same settings through the Host Bridge or shared configuration.

## Project locale catalogs

The UI package registers only generic component messages. Business copy belongs in project-owned locale catalogs and is loaded through the single SDK internationalization instance:

```tsx
import { createMiaixzI18n, createMiaixzMessageLoader } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider } from "@miaixz/ui/i18n";

const loadMessages = createMiaixzMessageLoader({
  portal: {
    "en-US": () => import("./locales/en-US.js"),
    "fr-FR": () => import("./locales/fr-FR.js"),
  },
});

const i18n = createMiaixzI18n({
  locale: "en-US",
  fallbackLocale: "en-US",
  loadMessages,
});

await i18n.initialize(["portal"]);

export function Root() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <App />
    </MiaixzLocaleProvider>
  );
}
```

Locale modules export flat key-value objects by default. Project messages take precedence over built-in messages. Missing messages fall back to `fallbackLocale`; if no fallback is available, the message key is returned. `useMiaixzLocale()` exposes the current snapshot and translation function.

## Error handling

Component contract violations throw `MiaixzUiError`. Each error includes a stable `code`, a translatable `messageKey`, and optional sanitized `details`:

```ts
import { MiaixzUiError } from "@miaixz/ui/errors";

try {
  renderFeature();
} catch (error) {
  if (error instanceof MiaixzUiError) {
    reportUiFailure({ code: error.code, messageKey: error.messageKey });
  } else {
    throw error;
  }
}
```

Do not display `details` directly to users, and never include tokens, cookies, authorization headers, personal information, or file contents in error messages. Asynchronous request failures use the structured error model from `@miaixz/sdk`.

## Microfrontend integration

Every independently deployed service installs compatible UI and SDK versions instead of copying styles or compiled component assets. The host is responsible for:

1. Validating SDK module manifests and the Host Bridge protocol version.
2. Synchronizing non-sensitive context, locale, permissions, and appearance snapshots with modules.
3. Ensuring that React, ReactDOM, Lucide, and the SDK have only compatible instances within one runtime.

Modules in the same runtime use `createMiaixzDirectHostBridge()`. Cross-origin iframes use `createMiaixzPostMessageHost()` and `createMiaixzPostMessageChildBridge()` with exact origins. After receiving an appearance snapshot, a module calls `applyMiaixzAppearance()` and must not read or modify the host DOM directly.

## Components

The public component collection includes:

- Foundations and forms: Icon, Button, Input, SearchInput, Textarea, Select, Combobox, MultiSelect, FormField, Checkbox, Radio, Switch, Dropzone, and FileUpload.
- Navigation and layout: Navigation, Breadcrumb, Tabs, Toolbar, AppShell, Page, PageHeader, PageToolbar, Grid, SplitLayout, and SidebarLayout.
- Data display: Panel, List, Table, DataTable, TreeView, Badge, Pagination, Avatar, Divider, and StatusIndicator.
- Feedback and overlays: Alert, InlineMessage, Progress, Spinner, LoadingOverlay, Tooltip, Popover, Dropdown, Dialog, ConfirmDialog, Drawer, Toast, Skeleton, EmptyState, and VisuallyHidden.

Interactive components preserve native semantics, keyboard behavior, and visible focus. Icon-only buttons must provide an accessible name.

## Local development

```bash
npm install
npm run check
npm run pack:check
```

The package builds independently with npm and does not rely on implicit tools outside the repository.

Publishing is coordinated by the repository release workflow. `@miaixz/ui` and `@miaixz/sdk` must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security and notices

- See the repository [security policy](../SECURITY.md) for vulnerability reporting instructions and supported release information.
- See [NOTICE](./NOTICE) for package attribution notices.

## License

Apache-2.0
