# @miaixz/ui

## Theme ownership and local delivery

Theme definitions, types, generated CSS and runtime logic live together in `src/theme/`.
There is no runtime subdirectory. Internal modules import concrete files, never the public barrel.
Maintain TypeScript definitions, not generated CSS.
Design token types, field lists and shared defaults live in `src/design/`.
Directory names do not change public symbols or CSS custom property names.
Cross-component implementation helpers live in `src/shared/` (formerly `src/internal/`).
This directory is package-private; consumers use existing public exports, not shared deep imports.
`npm run build` compiles TypeScript, automatically runs
`.github/scripts/codegen/theme-css.mjs` from the repository root, then copies both
CSS trees to `dist`. The CSS package test detects generated-file drift; the generator also accepts
`--runtime-dir` and `--output-dir` for isolated reproduction.

Public theme entries are `@miaixz/ui/theme`, `@miaixz/ui/themes`, the optional
`@miaixz/ui/themes/*` catalogs, `@miaixz/ui/styles.css`, `@miaixz/ui/theme.css`,
`@miaixz/ui/neutral.css`, and `@miaixz/ui/contrast.css`.
`styles.css` is the complete default theme. Foundation, component, core, and reset
entries retain their responsibilities. CSS auditing uses
`.github/scripts/quality/audit-ui-contracts.mjs` from the repository root.
Every public module that renders DOM also exposes one selective stylesheet at
`@miaixz/ui/<subpath>/styles.css`; `Graph` uses
`@miaixz/ui/diagram/graph/styles.css`. Selective consumers load a theme/foundation
entry first, then only the component module styles they use.

For this remediation, build and pack locally, unpack under the application's controlled
`node_modules/.miaixz-local` directory and link the installed package to that output.
Do not publish to npm or link application dependencies directly to source.

`@miaixz/ui` is the shared Miaixz React design system. It provides independently deployed frontend services, such as Home, Spaces, and Settings, with a consistent set of design tokens, themes, density modes, Lucide icons, and reusable components.

The package is ESM-only and does not provide a CommonJS `require` entry point. JavaScript entry points do not load global CSS automatically; consumers must import the required stylesheet explicitly.

## Platform identity

Use the public `Brand` component for the configured platform name beside a logo.
It aligns the text baseline with the logo bottom edge and shares spacing, theme typography
and single-line ellipsis globally. Logo images and SVGs use a fixed 32px height;
their width follows the intrinsic aspect ratio.
The complete theme stylesheet or `@miaixz/ui/components.css` includes these styles.
The application owns the name configuration and navigation; `Brand` also works inside
framework links and accepts framework image components in its `logo` slot.

```tsx
import { Brand } from "@miaixz/ui";

<a href="/workbench" aria-label={platformName}>
  <Brand name={platformName} logo={<img src="/logo.png" alt="" />} />
</a>;
```

## Drawer widths

`DRAWER_WIDTHS` exports the frozen preset list: **350, 360, 380, 400, 450, 480,
500, 550, 580, 600, 800, 1000** CSS pixels. `DrawerWidthPreset` is the corresponding
numeric union for configuration fields and width pickers. Both are exported from
`@miaixz/ui` and `@miaixz/ui/drawer`.

```tsx
import { Drawer, DRAWER_WIDTHS, type DrawerWidthPreset } from "@miaixz/ui";

const width: DrawerWidthPreset = 480;
const widthOptions = DRAWER_WIDTHS.map((value) => ({ label: `${value}px`, value }));

<Drawer open={open} onOpenChange={setOpen} title="Settings" width={width}>
  {children}
</Drawer>;
```

`width` accepts the named presets `small`, `medium`, `large`, `xlarge`, `wide`, and `content`,
or a custom positive finite number such as `435`; its default is `medium` for side
drawers. Bottom drawers do not accept `width`. Width does not change density, fonts,
spacing or editor structure; use `density` separately.

Left and right drawers clamp the requested width to the available viewport or
explicit `boundary`, accounting for `inset`. Bottom drawers remain full width.
For viewport drawers, width is applied through the shared CSS variable without
requiring a JavaScript positioning observer. Responsive content should use the
actual container width; sidebar editors need sufficient space for both columns.

The Appearance panel uses **360px**, while the two-column user editor uses
**1000px**. Other drawers retain their existing sizes until explicitly configured.

## Installation

```bash
npm install @miaixz/ui @miaixz/sdk react react-dom
```

`@miaixz/sdk`, `react`, and `react-dom` are peer dependencies. The icon provider dependency is owned by the component package. The exact supported SDK range is declared by the installed package metadata.

## Public entries

This table is checked directly against the package export map.

| Entry                           | Kind       |
| ------------------------------- | ---------- |
| `.`                             | JavaScript |
| `./styles.css`                  | CSS        |
| `./foundation.css`              | CSS        |
| `./components.css`              | CSS        |
| `./appearance`                  | JavaScript |
| `./icons`                       | JavaScript |
| `./i18n`                        | JavaScript |
| `./errors`                      | JavaScript |
| `./bar`                         | JavaScript |
| `./brand`                       | JavaScript |
| `./cluster`                     | JavaScript |
| `./columns`                     | JavaScript |
| `./editor`                      | JavaScript |
| `./grid`                        | JavaScript |
| `./sections`                    | JavaScript |
| `./header`                      | JavaScript |
| `./heatmap`                     | JavaScript |
| `./locale`                      | JavaScript |
| `./metrics`                     | JavaScript |
| `./view`                        | JavaScript |
| `./pressable`                   | JavaScript |
| `./range`                       | JavaScript |
| `./diagram/graph`               | JavaScript |
| `./scroll`                      | JavaScript |
| `./shell`                       | JavaScript |
| `./sidebar`                     | JavaScript |
| `./sparkline`                   | JavaScript |
| `./split`                       | JavaScript |
| `./stack`                       | JavaScript |
| `./timeline`                    | JavaScript |
| `./toaster`                     | JavaScript |
| `./visualization-motion`        | JavaScript |
| `./alert`                       | JavaScript |
| `./action`                      | JavaScript |
| `./intents`                     | JavaScript |
| `./avatar`                      | JavaScript |
| `./button`                      | JavaScript |
| `./combobox`                    | JavaScript |
| `./breadcrumb`                  | JavaScript |
| `./input`                       | JavaScript |
| `./textarea`                    | JavaScript |
| `./select`                      | JavaScript |
| `./checkbox`                    | JavaScript |
| `./radio`                       | JavaScript |
| `./switch`                      | JavaScript |
| `./navigation`                  | JavaScript |
| `./panel`                       | JavaScript |
| `./badge`                       | JavaScript |
| `./list`                        | JavaScript |
| `./table`                       | JavaScript |
| `./tabs`                        | JavaScript |
| `./pagination`                  | JavaScript |
| `./popover`                     | JavaScript |
| `./progress`                    | JavaScript |
| `./dialog`                      | JavaScript |
| `./divider`                     | JavaScript |
| `./drawer`                      | JavaScript |
| `./descriptions`                | JavaScript |
| `./dropdown`                    | JavaScript |
| `./donut`                       | JavaScript |
| `./dropzone`                    | JavaScript |
| `./toast`                       | JavaScript |
| `./toolbar`                     | JavaScript |
| `./transfer-list`               | JavaScript |
| `./tooltip`                     | JavaScript |
| `./skeleton`                    | JavaScript |
| `./spinner`                     | JavaScript |
| `./confirm`                     | JavaScript |
| `./notice`                      | JavaScript |
| `./field`                       | JavaScript |
| `./search`                      | JavaScript |
| `./overlay`                     | JavaScript |
| `./picker`                      | JavaScript |
| `./datagrid`                    | JavaScript |
| `./page`                        | JavaScript |
| `./upload`                      | JavaScript |
| `./tree`                        | JavaScript |
| `./status`                      | JavaScript |
| `./steps`                       | JavaScript |
| `./empty`                       | JavaScript |
| `./entry`                       | JavaScript |
| `./hidden`                      | JavaScript |
| `./theme`                       | JavaScript |
| `./themes`                      | JavaScript |
| `./themes/deepparser`           | JavaScript |
| `./themes/recommended`          | JavaScript |
| `./themes/traditional`          | JavaScript |
| `./themes/traditional-elegance` | JavaScript |
| `./themes/traditional-imperial` | JavaScript |
| `./themes/traditional-nature`   | JavaScript |
| `./appearance/styles.css`       | CSS        |
| `./icons/styles.css`            | CSS        |
| `./bar/styles.css`              | CSS        |
| `./brand/styles.css`            | CSS        |
| `./cluster/styles.css`          | CSS        |
| `./columns/styles.css`          | CSS        |
| `./editor/styles.css`           | CSS        |
| `./grid/styles.css`             | CSS        |
| `./sections/styles.css`         | CSS        |
| `./header/styles.css`           | CSS        |
| `./heatmap/styles.css`          | CSS        |
| `./locale/styles.css`           | CSS        |
| `./metrics/styles.css`          | CSS        |
| `./view/styles.css`             | CSS        |
| `./pressable/styles.css`        | CSS        |
| `./range/styles.css`            | CSS        |
| `./diagram/graph/styles.css`    | CSS        |
| `./scroll/styles.css`           | CSS        |
| `./shell/styles.css`            | CSS        |
| `./sidebar/styles.css`          | CSS        |
| `./sparkline/styles.css`        | CSS        |
| `./split/styles.css`            | CSS        |
| `./stack/styles.css`            | CSS        |
| `./timeline/styles.css`         | CSS        |
| `./toaster/styles.css`          | CSS        |
| `./alert/styles.css`            | CSS        |
| `./action/styles.css`           | CSS        |
| `./avatar/styles.css`           | CSS        |
| `./button/styles.css`           | CSS        |
| `./combobox/styles.css`         | CSS        |
| `./breadcrumb/styles.css`       | CSS        |
| `./input/styles.css`            | CSS        |
| `./textarea/styles.css`         | CSS        |
| `./select/styles.css`           | CSS        |
| `./checkbox/styles.css`         | CSS        |
| `./radio/styles.css`            | CSS        |
| `./switch/styles.css`           | CSS        |
| `./navigation/styles.css`       | CSS        |
| `./panel/styles.css`            | CSS        |
| `./badge/styles.css`            | CSS        |
| `./list/styles.css`             | CSS        |
| `./table/styles.css`            | CSS        |
| `./tabs/styles.css`             | CSS        |
| `./pagination/styles.css`       | CSS        |
| `./popover/styles.css`          | CSS        |
| `./progress/styles.css`         | CSS        |
| `./dialog/styles.css`           | CSS        |
| `./divider/styles.css`          | CSS        |
| `./drawer/styles.css`           | CSS        |
| `./descriptions/styles.css`     | CSS        |
| `./dropdown/styles.css`         | CSS        |
| `./donut/styles.css`            | CSS        |
| `./dropzone/styles.css`         | CSS        |
| `./toast/styles.css`            | CSS        |
| `./toolbar/styles.css`          | CSS        |
| `./transfer-list/styles.css`    | CSS        |
| `./tooltip/styles.css`          | CSS        |
| `./skeleton/styles.css`         | CSS        |
| `./spinner/styles.css`          | CSS        |
| `./confirm/styles.css`          | CSS        |
| `./notice/styles.css`           | CSS        |
| `./field/styles.css`            | CSS        |
| `./search/styles.css`           | CSS        |
| `./overlay/styles.css`          | CSS        |
| `./picker/styles.css`           | CSS        |
| `./datagrid/styles.css`         | CSS        |
| `./page/styles.css`             | CSS        |
| `./upload/styles.css`           | CSS        |
| `./tree/styles.css`             | CSS        |
| `./status/styles.css`           | CSS        |
| `./steps/styles.css`            | CSS        |
| `./empty/styles.css`            | CSS        |
| `./entry/styles.css`            | CSS        |
| `./hidden/styles.css`           | CSS        |
| `./neutral.css`                 | CSS        |
| `./contrast.css`                | CSS        |
| `./theme.css`                   | CSS        |
| `./core.css`                    | CSS        |
| `./reset.css`                   | CSS        |

## Basic usage

Load the complete stylesheet once at the application entry point and provide the SDK internationalization runtime above the component tree:

```tsx
import "@miaixz/ui/styles.css";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, Field, Input, MiaixzLocaleProvider } from "@miaixz/ui";

const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function Example() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Field label="Space name" required>
        <Input placeholder="Enter a space name" />
      </Field>
      <Button type="button">Save</Button>
    </MiaixzLocaleProvider>
  );
}
```

Components can be imported from the package root or from stable subpaths:

```tsx
import { Button } from "@miaixz/ui/button";
import { Graph } from "@miaixz/ui/diagram/graph";
import { Icon, type MiaixzIconName } from "@miaixz/ui/icons";
import "@miaixz/ui/button/styles.css";
import "@miaixz/ui/diagram/graph/styles.css";

const tenantIcon: MiaixzIconName = "Blocks";

<Icon name={tenantIcon} size="navigation" />;
```

`Icon` accepts every Lucide catalog name in PascalCase through the stable Miaixz `name` contract.
Frequently used icons render synchronously and the rest load on demand. Business code must not
import Lucide components directly or pass icon components into `Icon`; this keeps call sites stable
if the underlying icon provider changes. Do not import from `dist` or from internal source paths.

Product intent definitions are available only from their dedicated subpath:

```ts
import {
  getIntentDefinition,
  intentDefinitions,
  type Intent,
  type IntentDefinition,
} from "@miaixz/ui/intents";

const intent: Intent = "delete";
const definition: IntentDefinition = getIntentDefinition(intent);

definition === intentDefinitions[intent];
```

Each definition supplies the stable message key, icon name, and semantic tone for one product
intent. The intents API is intentionally absent from the package root and does not execute actions.

## Height-aware application navigation

Use structured `groups` when a shell rail must remain scrollbar-free at every viewport height.
The rail first reduces row density, then collects lower-priority destinations under the localized
overflow disclosure. Active destinations and items marked `overflow: "never"` remain visible while
a usable row is available. The overflow menu preserves destinations as links.

```tsx
import { NavigationRail, Shell, type NavigationRailGroupModel } from "@miaixz/ui";

const groups: NavigationRailGroupModel[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "workbench",
        href: "/workbench",
        label: "Workbench",
        textValue: "Workbench",
        current: "page",
      },
      { id: "spaces", href: "/spaces", label: "Spaces", textValue: "Spaces" },
    ],
  },
  {
    id: "context",
    label: "Context",
    placement: "end",
    items: [
      {
        id: "infra",
        href: "/infra/overview",
        label: "Multi-tenant",
        textValue: "Multi-tenant",
        overflow: "never",
      },
    ],
  },
];

<Shell
  header={header}
  sidebar={
    <NavigationRail
      brand={brand}
      toggle={toggle}
      groups={groups}
      overflowLabel="More"
      utility={accountMenu}
    />
  }
  sidebarOverflow="contained"
>
  {content}
</Shell>;
```

## Style layers

- `@miaixz/ui/foundation.css`: design tokens and foundational theme, typography, spacing, radius, shadow, motion, and density capabilities.
- `@miaixz/ui/components.css`: component styles. When both layers define the same selector, the component layer is authoritative.
- `@miaixz/ui/styles.css`: the recommended complete entry point, combining the foundation and component layers in a stable order.
- `@miaixz/ui/<subpath>/styles.css`: the sole selective CSS entry for each public DOM module; nested Graph uses `@miaixz/ui/diagram/graph/styles.css`.

Business applications should not override internal component selectors. Apply brand customization through public CSS variables and runtime appearance settings.

## Themes, colors, and density

The SDK stores and synchronizes appearance state. `Theme` is the only runtime owner that validates
and applies those settings to the DOM:

```tsx
import { createMiaixzSdk } from "@miaixz/sdk";
import { Theme } from "@miaixz/ui";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.example",
    environment: "production",
  },
});

sdk.appearance.patch({
  colorMode: "system",
  density: "comfortable",
  overrides: { light: { brand: "#55b52d" } },
});

export function Root() {
  return (
    <Theme appearance={sdk.appearance} fallback="miaixz">
      <App />
    </Theme>
  );
}
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
3. Ensuring that React, ReactDOM, and the SDK have only compatible instances within one runtime.

Modules in the same runtime use `createMiaixzDirectHostBridge()`. Cross-origin iframes use `createMiaixzPostMessageHost()` and `createMiaixzPostMessageChildBridge()` with exact origins. A bridge writes each received snapshot to the module's `MiaixzAppearanceManager`; the mounted `Theme` applies it. A module must not create theme style nodes or read and modify the host DOM directly.

## Components

The public component collection includes:

- Foundations and forms: Icon, Button, Input, Search, Textarea, Select, Combobox, Picker, Field, Checkbox, Radio, Switch, Dropzone, and Upload.
- Navigation and layout: Navigation, Breadcrumb, Tabs, Toolbar, Shell, Page, View, Header, Grid, Cluster, Split, Stack, Sidebar, Scroll, and Entry.
- Data display: Panel, List, Table, Datagrid, Tree, Badge, Pagination, Avatar, AvatarGroup, Divider, and Status.
- Feedback and overlays: Alert, Notice, Progress, Spinner, Overlay, Tooltip, Popover, Dropdown, Dialog, Confirm, Drawer, Toast, Skeleton, Empty, and Hidden.

Interactive components preserve native semantics, keyboard behavior, and visible focus. Icon-only buttons must provide an accessible name.

### Avatar capability

`Avatar` uses Miaixz tokens and slots while supporting image and responsive image sources, explicit text or icon content, semantic or custom CSS sizes, circular/rounded/square shapes, status or count indicators, and deterministic image fallbacks. Its fallback order is explicit `children`, the existing `name` graphemes, the first `alt` grapheme, then the package `UserRound` icon.

`AvatarGroup` stacks avatars with Miaixz spacing and surface tokens. It supports a visible maximum, a server-provided total, custom surplus content, preset or numeric overlap spacing, inherited shape, root/surplus slots, refs, and Theme defaults/variants.

Avatar interaction remains compositional. Use `Pressable` around an Avatar for commands or menu triggers, and use `Dropzone accept="image/*"` around an Avatar for local image selection. The Avatar itself never changes into a button or performs an upload. This preserves native interaction semantics without duplicating an avatar-specific button or uploader.

## Local development

```bash
npm install
npm run check
```

Run `npm run check:package` from the repository root to validate both packed packages.

The package builds independently with npm and does not rely on implicit tools outside the repository.

Publishing is coordinated by the repository release workflow. `@miaixz/ui` and `@miaixz/sdk` must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security and notices

- See the repository [security policy](../SECURITY.md) for vulnerability reporting instructions and supported release information.
- See [NOTICE](./NOTICE) for package attribution notices.

## License

Apache-2.0

### Optional theme catalogs

The shared Miaixz theme definitions live in `@miaixz/ui/themes`. Consumers can import
`customThemes` from that entry or select a smaller catalog from one of its documented subpaths,
then register those definitions with `Theme themes={themes}`. Use `createThemeStyles(themes)` from
`@miaixz/ui/theme` to render their light/dark CSS in a nonce-bound `<style>` in the document head
before `createThemeScript`, and include their identifiers in the script's `themes` option. The
application owns persistence and user selection, but it must not copy or redefine a catalog theme.
