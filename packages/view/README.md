# @miaixz/view

`@miaixz/view` is a self-hosted React file viewer with automatic format detection. It does not use PDF.js, ONLYOFFICE, remote conversion services, CDN scripts, or third-party runtime parsers.

## Install

```bash
npm install @miaixz/view @miaixz/icons react react-dom
```

Import the icon and viewer styles once, then pass a `File`, `Blob`, URL, `ArrayBuffer`, or `Uint8Array` directly to `FileView`. The viewer has local style fallbacks and does not require `@miaixz/ui` or `@miaixz/sdk`:

```tsx compile
import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { FileView } from "@miaixz/view";

const appearance = createMiaixzAppearanceManager({ appId: "file-preview" });
const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function Preview({ file }: { file: File }) {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance}>
        <FileView source={file} />
      </Theme>
    </MiaixzLocaleProvider>
  );
}
```

For signed remote URLs, metadata and authorized request options can be supplied without selecting a viewer manually:

```tsx compile
import { FileView } from "@miaixz/view";

<FileView
  source={{
    url: "/files/opaque-id",
    name: "quarterly-flow.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    headers: { Authorization: "Bearer …" },
  }}
/>;
```

Applications with private storage or companion files can provide one policy boundary for both the primary source and related-resource requests:

```tsx compile
import {
  FileView,
  type FileResourceProvider,
  type FileViewSource,
  type FileViewSourceDescriptor,
  type RandomAccessResource,
} from "@miaixz/view";

declare const fileReference: FileViewSource;
declare const myStorage: {
  open(
    source: FileViewSource | FileViewSourceDescriptor,
    signal: AbortSignal,
  ): Promise<RandomAccessResource>;
  openRelated(path: string, signal: AbortSignal): Promise<RandomAccessResource | undefined>;
};

const resourceProvider: FileResourceProvider = {
  async open(source, signal) {
    return myStorage.open(source, signal);
  },
  async resolveRelated(request, signal) {
    return myStorage.openRelated(request.path, signal);
  },
};

<FileView resourceProvider={resourceProvider} source={fileReference} />;
```

`FileViewHandle` exposes stable `zoomIn`, `zoomOut`, `resetZoom`, `retry`, `dispose`, `getState`, and `getElement` commands. The legacy `src` alias remains for the 0.x migration window; new code should use `source`.

## Current built-in pipeline

- The generated manifest covers all 274 extensions and 17 driver families in the audited reference baseline.
- Filename, MIME, signature, and container evidence are scored together; callers no longer pass `kind`.
- The current installable modules are PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, EPUB, XPS/OXPS, OFD, ZIP, RAR, JPEG, PNG, GIF, SVG, MP3, MP4, Draw.io, XMind, GeoJSON/TopoJSON, DXF, OBJ, and WASM.
- Every module owns a `format.json`, a driver boundary, and a generated lazy-loader entry. Deleting a module directory and regenerating removes that format without editing runtime code.
- XLSX parsing includes sparse cells, cached formula values, all DrawingML anchor modes, recursive groups, affine transforms, theme colors, text styles, arrowheads, embedded pictures, preset/custom geometry, connector endpoints, semantic graph data, materialized SmartArt drawings, and legacy VML drawings.
- Unsupported subformats return a stable rejected or partial result; metadata output is never presented as full preview support.

The generated format matrix and the tests under `tests/` are the executable support contract. An extension being recognized does not imply that every vendor-specific feature is rendered.

## Custom formats

Applications can extend the default registry without modifying `@miaixz/view`. A custom format declares its identity, extensions, MIME types, and lazy driver, then passes that registry to `FileView`:

```tsx compile
import { createDefaultRegistry, FileView, type ViewerDriver } from "@miaixz/view";

const registry = createDefaultRegistry();
const file = new File([], "drawing.amap", { type: "application/vnd.acme.map" });
declare const loadAcmeMapDriver: () => Promise<ViewerDriver>;

registry.registerFormat(
  {
    schemaVersion: 1,
    id: "acme-map",
    label: "Acme map",
    category: "geospatial",
    extensions: ["amap"],
    mimeTypes: ["application/vnd.acme.map"],
    implementation: "ready",
  },
  loadAcmeMapDriver,
);

<FileView registry={registry} source={file} />;
```

Custom identifiers are ordinary stable strings. Extension and MIME matching join the same detector used by built-in modules; custom drivers receive the same bounded resources, cancellation signal, progress channel, and document-model contract.

## Specialized entries

`PdfView`, `OfficeView`, and `ImageView` remain available for applications that prefer explicit component names. `PdfView` and `OfficeView` are thin adapters over the same local `FileView` pipeline and never activate a remote viewer.

```tsx compile
import { OfficeView, PdfView } from "@miaixz/view";

const pdfBytes = new Uint8Array();
const workbookFile = new File([], "workflow.xlsx");

<PdfView source={pdfBytes} />;
<OfficeView name="workflow.xlsx" source={workbookFile} />;
```

## Public entries

| Entry          | Kind       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./image`      | JavaScript |
| `./pdf`        | JavaScript |
| `./office`     | JavaScript |
| `./errors`     | JavaScript |
| `./shared`     | JavaScript |
| `./runtime`    | JavaScript |
| `./styles.css` | CSS        |

The package exports file-preview components only and deliberately has no page-layout `View` export.

## Security boundary

All parsing is treated as untrusted input. Sources are size-bounded, XML entities are rejected, archive paths and expansion are checked, remote requests use only caller-supplied authorization, embedded scripts and macros are not executed, and public errors do not retain source bytes, credentials, local paths, or internal stack traces.

Toolbar visibility is not an authorization boundary. Applications must still enforce permissions when issuing URLs or enabling download and print actions.
