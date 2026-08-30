# miaixz.js

> Build with intelligence. Create without limits.

`miaixz.js` is the public JavaScript and TypeScript monorepo maintained by Miaixz. It contains the browser SDK and React design system used by independently deployed Miaixz frontend services.

The repository is organized as an npm workspace. Both public packages use one synchronized version and are released together from the same Git tag.

## Packages

| Package                | npm                                              | Description                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@miaixz/sdk`](./sdk) | [npm](https://www.npmjs.com/package/@miaixz/sdk) | Browser API client, authentication, runtime context, configuration, permissions, events, files, appearance, internationalization, public types, models, validators, formatters, and utilities. |
| [`@miaixz/ui`](./ui)   | [npm](https://www.npmjs.com/package/@miaixz/ui)  | React design system with components, design tokens, themes, density modes, icons, styles, accessibility foundations, and interaction primitives.                                               |

### Package relationship

`@miaixz/sdk` owns application-independent runtime state and browser integration. `@miaixz/ui` consumes compatible SDK capabilities to apply appearance settings, provide localized component messages, and keep independently deployed interfaces consistent.

`@miaixz/ui` declares `@miaixz/sdk` as a peer dependency. The release tooling keeps the UI development dependency, peer range, workspace manifests, and root version synchronized.

## Requirements

- Node.js 20 or later.
- npm 10 or later.
- An ESM-compatible application and build tool.
- React and ReactDOM when using `@miaixz/ui`.

## Installation

Install the SDK by itself:

```bash
npm install @miaixz/sdk
```

Install the design system and its peers:

```bash
npm install @miaixz/ui @miaixz/sdk react react-dom lucide-react
```

Both packages are ESM-only and do not expose CommonJS `require` entry points.

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

const response =
  await sdk.api.get<readonly { id: string; name: string }[]>("/spaces");
console.log(response.data);
```

Use the shared React components and styles:

```tsx
import "@miaixz/ui/styles.css";
import { Button, FormField, Input } from "@miaixz/ui";

export function CreateSpaceForm() {
  return (
    <form>
      <FormField label="Space name" required>
        <Input placeholder="Enter a space name" />
      </FormField>
      <Button type="submit">Create space</Button>
    </form>
  );
}
```

See the package documentation for authentication modes, API envelopes, service clients, permissions, cross-tab events, appearance synchronization, internationalization, component contracts, and microfrontend integration:

- [SDK documentation](./sdk/README.md)
- [UI documentation](./ui/README.md)

## Repository layout

```text
.
├── .github/            Release workflows, composite actions, and version scripts
├── sdk/                @miaixz/sdk source and package configuration
├── ui/                 @miaixz/ui source and package configuration
├── VERSION             Authoritative shared release version
└── package.json        Private npm workspace root
```

The workspace root is private and is never published. Only `@miaixz/sdk` and `@miaixz/ui` are public npm packages.

## Development

Install dependencies without creating a lockfile:

```bash
npm install --no-package-lock
```

Run the standard repository checks:

```bash
npm run check
```

Build every workspace:

```bash
npm run build
```

Validate the exact package contents and public type surface before release:

```bash
npm run pack:check
```

Additional root commands:

| Command                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm run build:sdk`    | Build the SDK before dependent workspace operations. |
| `npm run typecheck`    | Build the SDK and type-check all workspaces.         |
| `npm run lint`         | Run workspace linters.                               |
| `npm run lint:fix`     | Apply supported lint fixes.                          |
| `npm run format`       | Format workspace source files.                       |
| `npm run format:check` | Verify formatting without modifying files.           |
| `npm run check`        | Run the complete workspace validation suite.         |
| `npm run pack:check`   | Build and inspect both publishable packages.         |

## Version management

`VERSION` is the authoritative repository version. The version script updates all related values together:

```bash
npm run version:set -- 0.6.0
```

The script synchronizes:

- `VERSION`
- the root workspace version
- `@miaixz/sdk`
- `@miaixz/ui`
- the UI development dependency on the SDK
- the compatible UI peer dependency range for the SDK

Both public packages must always have the same exact release version.

## Release process

Releases are driven by an unprefixed semantic-version Git tag. For example, version `0.6.0` uses tag `0.6.0`, never `v0.6.0`.

The expected release sequence is:

1. Complete and validate changes on `dev`.
2. Merge `dev` into `main` with an explicit merge commit.
3. Create the exact version tag on that merge commit.
4. Push `main` and the tag.
5. GitHub Actions builds and validates both workspaces.
6. The workflow publishes `@miaixz/sdk` and `@miaixz/ui` with the same version.
7. The workflow waits for both package versions to become visible in the npm registry.
8. After npm publication succeeds, the workflow creates the matching GitHub Release.

Stable versions use the npm `latest` dist-tag. Prerelease versions use `next`. The publication action is resumable: if one package version already exists, it publishes only the missing package and restores version parity.

The release workflow requires the `NPM_TOKEN` GitHub Actions secret when token-based npm authentication is used. The token must have read/write package access and permission to bypass 2FA for automated publishing. npm Trusted Publishing can replace the long-lived token after both packages have been configured as trusted publishers.

## Security

Report vulnerabilities according to [SECURITY.md](./SECURITY.md). Do not include tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or private file contents in public issues.

## License

Licensed under the [Apache License 2.0](./LICENSE).
