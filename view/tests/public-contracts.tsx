import {
  FileView,
  ImageView,
  MiaixzViewError,
  OfficeView,
  PdfView,
  type ImageViewSlotProps,
  type MiaixzViewErrorCode,
  type OfficeViewSlotProps,
  type PdfViewSlotProps,
} from "../src/index.js";

const imageSlots: ImageViewSlotProps = { image: { decoding: "async" } };
const pdfSlots: PdfViewSlotProps = { canvas: { className: "canvas" } };
const officeSlots: OfficeViewSlotProps = { editor: { className: "editor" } };
const code: MiaixzViewErrorCode = "VIEW_PDF_SCALE_INVALID";
void [
  FileView,
  ImageView,
  OfficeView,
  PdfView,
  MiaixzViewError,
  imageSlots,
  pdfSlots,
  officeSlots,
  code,
];

/**
 * @ts-expect-error ImageView owns image source semantics. */
const invalidImageSlots: ImageViewSlotProps = { image: { src: "other.png" } };
/**
 * @ts-expect-error PdfView owns canvas role semantics. */
const invalidPdfSlots: PdfViewSlotProps = { canvas: { role: "presentation" } };
/**
 * @ts-expect-error OfficeView owns editor id semantics. */
const invalidOfficeSlots: OfficeViewSlotProps = { editor: { id: "other" } };
/**
 * @ts-expect-error FileView requires an explicit supported kind. */
const automaticFileView = <FileView src="file.bin" />;
/**
 * @ts-expect-error The preview package does not export a bare View component. */
type RemovedView = import("../src/index.js").View;

void [invalidImageSlots, invalidPdfSlots, invalidOfficeSlots, automaticFileView];
void (undefined as unknown as RemovedView);
