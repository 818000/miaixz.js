/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

export * from "./components/index.js";
export * from "./errors/index.js";
export * from "./i18n/index.js";
export * from "./theme/appearance.js";
export * from "./theme/index.js";
export type { MiaixzIconName } from "./icons/index.js";

/*
 * Compatibility names are direct references to the same implementations and
 */
/*
 * types; there is no wrapper, prop conversion, alternate styling or runtime.
 */
export { Confirm as ConfirmDialog } from "./components/confirm/index.js";
export type { ConfirmProps as ConfirmDialogProps } from "./components/confirm/index.js";
export { Notice as InlineMessage } from "./components/notice/index.js";
export type { NoticeProps as InlineMessageProps } from "./components/notice/index.js";
export { Field as FormField } from "./components/field/index.js";
export type { FieldProps as FormFieldProps } from "./components/field/index.js";
export { Search as SearchInput } from "./components/search/index.js";
export type { SearchProps as SearchInputProps } from "./components/search/index.js";
export { Overlay as LoadingOverlay } from "./components/overlay/index.js";
export type { OverlayProps as LoadingOverlayProps } from "./components/overlay/index.js";
export { Picker as MultiSelect } from "./components/picker/index.js";
export type { PickerProps as MultiSelectProps } from "./components/picker/index.js";
export { Datagrid as DataTable } from "./components/datagrid/index.js";
export type { DatagridProps as DataTableProps } from "./components/datagrid/index.js";
export { Page as PageLayout } from "./components/page/index.js";
export type { PageProps as PageLayoutProps } from "./components/page/index.js";
export { Upload as FileUpload } from "./components/upload/index.js";
export type { UploadProps as FileUploadProps } from "./components/upload/index.js";
export { Tree as TreeView } from "./components/tree/index.js";
export type { TreeProps as TreeViewProps } from "./components/tree/index.js";
export { Status as StatusIndicator } from "./components/status/index.js";
export type { StatusProps as StatusIndicatorProps } from "./components/status/index.js";
export { Empty as EmptyState } from "./components/empty/index.js";
export type { EmptyProps as EmptyStateProps } from "./components/empty/index.js";
export { Hidden as VisuallyHidden } from "./components/hidden/index.js";
export type { HiddenProps as VisuallyHiddenProps } from "./components/hidden/index.js";
