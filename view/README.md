# @miaixz/view

`@miaixz/view` is a self-hosted React file viewer with automatic format detection. It does not use PDF.js, ONLYOFFICE, remote conversion services, CDN scripts, or third-party runtime parsers.

## Install

```bash
npm install @miaixz/view @miaixz/ui react react-dom
```

Import the UI theme and viewer styles once, then pass a `File`, `Blob`, URL, `ArrayBuffer`, or `Uint8Array` directly to `FileView`:

```tsx compile
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import { FileView } from "@miaixz/view";

export function Preview({ file }: { file: File }) {
  return <FileView source={file} />;
}
```

For signed remote URLs, metadata and authorized request options can be supplied without selecting a viewer manually:

```tsx compile
<FileView
  source={{
    url: "/files/opaque-id",
    name: "quarterly-flow.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    headers: { Authorization: "Bearer …" },
  }}
/>
```

Applications with private storage or companion files can provide one policy boundary for both the primary source and related-resource requests:

```tsx compile
import type { FileResourceProvider } from "@miaixz/view";

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
- XLSX parsing includes sparse cells, cached formula values, `oneCellAnchor`, `twoCellAnchor`, `absoluteAnchor`, DrawingML shapes, connector endpoints, and a semantic edge list.
- Unsupported subformats return a stable rejected or partial result; metadata output is never presented as full preview support.

The implementation is still governed by the support levels in `docs/file-viewer-reimplementation-plan.md`. An extension being recognized does not imply that every vendor-specific feature is rendered.

## Custom formats

Applications can extend the default registry without modifying `@miaixz/view`. A custom format declares its identity, extensions, MIME types, and lazy driver, then passes that registry to `FileView`:

```tsx compile
import { createDefaultRegistry, FileView, type ViewerDriver } from "@miaixz/view";

const registry = createDefaultRegistry();

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
  async () => {
    const module = await import("./acme-map-driver.js");
    return module.formatDriver as ViewerDriver;
  },
);

<FileView registry={registry} source={file} />;
```

Custom identifiers are ordinary stable strings. Extension and MIME matching join the same detector used by built-in modules; custom drivers receive the same bounded resources, cancellation signal, progress channel, and document-model contract.

## Specialized entries

`PdfView`, `OfficeView`, and `ImageView` remain available for applications that prefer explicit component names. `PdfView` and `OfficeView` are thin adapters over the same local `FileView` pipeline and never activate a remote viewer.

```tsx compile
import { OfficeView, PdfView } from "@miaixz/view";

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

The design-system `View` for page layout comes from `@miaixz/ui/view`; this package deliberately has no bare `View` export.

## Security boundary

All parsing is treated as untrusted input. Sources are size-bounded, XML entities are rejected, archive paths and expansion are checked, remote requests use only caller-supplied authorization, embedded scripts and macros are not executed, and public errors do not retain source bytes, credentials, local paths, or internal stack traces.

Toolbar visibility is not an authorization boundary. Applications must still enforce permissions when issuing URLs or enabling download and print actions.
