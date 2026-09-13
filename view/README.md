# @miaixz/view

`@miaixz/view` provides reusable React components for previewing images, PDF files, and Office documents.

The package is deliberately presentation-only. Authentication, authorization, storage, signed URLs, ONLYOFFICE JWT generation, document conversion, and audit logging belong to the application or preview service that supplies the component props.

Node.js 20.19 or later is required for the PDF.js runtime.

## Install

```bash
npm install @miaixz/view @miaixz/ui react react-dom
```

## Public entries

This table is checked directly against the package export map.

| Entry | Kind |
| ----- | ---- |
| `.` | JavaScript |
| `./image` | JavaScript |
| `./pdf` | JavaScript |
| `./office` | JavaScript |
| `./errors` | JavaScript |
| `./styles.css` | CSS |

Import the Miaixz UI theme before the preview styles. A preview tree is supported only inside the
UI `Theme` scope; it also uses the shared locale provider for surrounding application copy:

```tsx compile
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { FileView } from "@miaixz/view";

const appearance = createMiaixzAppearanceManager({ appId: "preview-example" });
const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function PreviewExample() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance} scope="local">
        <FileView alt="Architecture diagram" kind="image" src="/diagram.png" />
      </Theme>
    </MiaixzLocaleProvider>
  );
}
```

The design-system `View` for page layout comes from `@miaixz/ui/view`. This package is only for
file previews and deliberately has no bare `View` export.

## Components

- `ImageView` renders an image with optional zoom and rotation controls.
- `PdfView` renders one PDF page at a time with PDF.js and loads the PDF runtime only when mounted.
- `OfficeView` embeds an existing ONLYOFFICE Docs deployment using a caller-supplied, already-signed editor configuration.
- `FileView` routes a discriminated source object to one of the three viewers.

## Image and PDF

```tsx
import { FileView } from "@miaixz/view";

export function Preview({ url }: { url: string }) {
  return <FileView kind="pdf" src={url} />;
}
```

Use `kind="image"` for browser-supported images. The caller should pass a URL whose lifetime and access scope were decided by the backend.

## Office and diagrams

`OfficeView` loads the browser API from an existing ONLYOFFICE Docs deployment. Its `config` property follows the ONLYOFFICE editor configuration and may include callbacks and customization fields beyond the required typed fields.

```tsx
import { OfficeView, type OnlyOfficeEditorConfig } from "@miaixz/view/office";

export function DiagramPreview({ config }: { config: OnlyOfficeEditorConfig }) {
  return (
    <OfficeView
      config={{
        ...config,
        documentType: "diagram",
      }}
      documentServerUrl="https://office.example.com"
    />
  );
}
```

Use `documentType: "diagram"` with a supported Visio diagram format such as `vsdx`. The deployed ONLYOFFICE Docs version must provide diagram support. The document URL must be reachable by the document server, not only by the end user's browser.

## Security boundary

UI controls are not a security boundary. The backend must decide whether a user may view, download, print, or edit a document and must enforce that decision when issuing URLs and ONLYOFFICE configurations. Never send an ONLYOFFICE signing secret to this package or to the browser.
