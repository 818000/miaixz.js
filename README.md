# miaixz.js

> Build with intelligence. Create without limits.

`miaixz.js` is the public JavaScript and TypeScript monorepo maintained by Miaixz. It contains the browser SDK, React design system, and file preview components used by independently deployed Miaixz frontend services.

The repository is organized as an npm workspace. All public packages use one synchronized version and are released together from the same Git tag.

## Packages

| Package                  | npm                                               | Description                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@miaixz/sdk`](./sdk)   | [npm](https://www.npmjs.com/package/@miaixz/sdk)  | Browser API client, authentication, runtime context, configuration, permissions, events, files, appearance, internationalization, public types, models, validators, formatters, and utilities. |
| [`@miaixz/ui`](./ui)     | [npm](https://www.npmjs.com/package/@miaixz/ui)   | React design system with components, design tokens, themes, density modes, icons, styles, accessibility foundations, and interaction primitives.                                               |
| [`@miaixz/view`](./view) | [npm](https://www.npmjs.com/package/@miaixz/view) | Presentation-only React components for image, PDF, and Office previews.                                                                                                                        |

### Package relationship

`@miaixz/sdk` owns application-independent runtime state and browser integration. `@miaixz/ui` consumes compatible SDK capabilities to apply appearance settings, provide localized component messages, and keep independently deployed interfaces consistent. `@miaixz/view` consumes the UI theme contract but never owns authorization, storage, signing secrets, or document conversion.

`@miaixz/ui` declares `@miaixz/sdk` as a peer dependency, and `@miaixz/view` declares `@miaixz/ui` as a peer dependency. The release tooling keeps these development dependencies, peer ranges, workspace manifests, and root version synchronized.

## Requirements

- Node.js 20 or later; `@miaixz/view` requires Node.js 20.19 or later.
- npm 10 or later.
- An ESM-compatible application and build tool.
- React and ReactDOM when using `@miaixz/ui` or `@miaixz/view`.

## Installation

Install the SDK by itself:

```bash
npm install @miaixz/sdk
```

Install the design system and its peers:

```bash
npm install @miaixz/ui @miaixz/sdk react react-dom
```

All packages are ESM-only and do not expose CommonJS `require` entry points.

## Quick start

Create a browser SDK instance:

```ts
import { createMiaixzSdk } from "@miaixz/sdk";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.org",
    environment: "production",
  },
  locale: "en-US",
});

await sdk.ready;

const response = await sdk.api.get<readonly { id: string; name: string }[]>("/spaces");
console.log(response.data);
```

Use the shared React components and styles:

```tsx
import "@miaixz/ui/styles.css";
import { Button, Field, Input, Theme } from "@miaixz/ui";

import { sdk } from "./sdk.js";

export function CreateSpaceForm() {
  return (
    <Theme appearance={sdk.appearance} fallback="miaixz">
      <form>
        <Field label="Space name" required>
          <Input placeholder="Enter a space name" />
        </Field>
        <Button type="submit">Create space</Button>
      </form>
    </Theme>
  );
}
```

Choose one public CSS entry at the application root:

- `@miaixz/ui/styles.css` for the default Miaixz theme with all foundation and component styles.
- `@miaixz/ui/theme.css` for all built-in themes.
- `@miaixz/ui/neutral.css` or `@miaixz/ui/contrast.css` for one alternative built-in theme.
- `@miaixz/ui/foundation.css`, `@miaixz/ui/components.css`, `@miaixz/ui/core.css`, and `@miaixz/ui/reset.css` for explicitly layered integrations.

For selective delivery, load the chosen theme/foundation entry and then each DOM module's sole
`@miaixz/ui/<subpath>/styles.css` entry. For example, Button uses
`@miaixz/ui/button/styles.css` and Graph uses `@miaixz/ui/diagram/graph/styles.css`.

The SDK persists `theme`, `colorMode`, `density`, and mode-specific color overrides. The UI
`Theme` component validates and applies them atomically. Applications own their page root background
through the public Page Surface variables; the library intentionally does not set a background on
`html` or `body`.

See the package documentation for authentication modes, API envelopes, service clients, permissions, cross-tab events, appearance synchronization, internationalization, component contracts, and microfrontend integration:

- [SDK documentation](./sdk/README.md)
- [UI documentation](./ui/README.md)
- [View documentation](./view/README.md)

## Repository layout

```text
.
├── .github/            Release workflows, composite actions, and version scripts
├── sdk/                @miaixz/sdk source and package configuration
├── ui/                 @miaixz/ui source and package configuration
├── view/               @miaixz/view source and package configuration
├── VERSION             Authoritative shared release version
└── package.json        Private npm workspace root
```

The workspace root is private and is never published. `@miaixz/sdk`, `@miaixz/ui`, and `@miaixz/view` are public npm packages.

The root `package.json` `workspaces` array is the repository's only package registry. Build,
source-policy, version, package validation, artifact, and publication tooling reads that array and
each workspace manifest dynamically. Add a package there once; only package-specific architecture
rules and contract tests require separate configuration.

## Development

Install dependencies and update the committed root lockfile:

```bash
npm install
```

Run the standard repository checks:

```bash
npm run check
```

Build every workspace:

```bash
npm run build
```

Run an individual package validation phase only while diagnosing a failure:

```bash
npm run check:package
```

Additional root commands:

| Command                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run build`         | Build every workspace in internal dependency order.    |
| `npm run typecheck`     | Type-check all workspaces without building.            |
| `npm run lint`          | Run workspace linters.                                 |
| `npm run lint:fix`      | Apply supported lint fixes.                            |
| `npm run format`        | Format workspace source files.                         |
| `npm run format:check`  | Verify formatting without modifying files.             |
| `npm run check`         | Run static, browser, package, and clean-tree checks.   |
| `npm run check:package` | Diagnose packed package and consumer fixture failures. |

## Version management

`VERSION` is the authoritative repository version. The version script updates all related values together:

```bash
npm run version:set -- 0.6.0
```

The script synchronizes:

- `VERSION`
- the root workspace version
- every workspace manifest version
- exact internal development, runtime, and optional dependency versions
- compatible internal peer dependency ranges and their development dependencies

All public packages must always have the same exact release version.

## Release process

Releases are driven by an unprefixed semantic-version Git tag. For example, version `0.6.0` uses tag `0.6.0`, never `v0.6.0`.

The expected release sequence is:

1. Complete and validate changes on `dev`.
2. Merge `dev` into `main` with an explicit merge commit.
3. Create the exact version tag on that merge commit.
4. Push `main` and the tag.
5. GitHub Actions builds and validates all workspaces.
6. The workflow publishes every public workspace with the same version.
7. The workflow waits for all package versions to become visible in the npm registry.
8. After npm publication succeeds, the workflow creates the matching GitHub Release and generates
   its notes from the commits and merged pull requests since the previous tag.

Stable versions use the npm `latest` dist-tag. Prerelease versions use `next`. The publication action is resumable: if one package version already exists, it publishes only the missing package and restores version parity.

The release workflow requires the `NPM_TOKEN` GitHub Actions secret when token-based npm authentication is used. The token must have read/write package access and permission to bypass 2FA for automated publishing. npm Trusted Publishing can replace the long-lived token after all packages have been configured as trusted publishers.

## Security

Report vulnerabilities according to [SECURITY.md](./SECURITY.md). Do not include tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or private file contents in public issues.

## License

Licensed under the [Apache License 2.0](./LICENSE).
