import type {
  MiaixzI18n,
  MiaixzI18nSnapshot,
  MiaixzMessageCatalog,
  MiaixzTranslator,
} from "@miaixz/sdk/i18n";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { MiaixzUiError } from "../errors/index.js";

export type {
  MiaixzI18n,
  MiaixzI18nSnapshot,
  MiaixzLocale,
  MiaixzMessageCatalog,
  MiaixzMessageLoader,
  MiaixzMessageLoaderMap,
  MiaixzMessageLoaderResult,
  MiaixzMessageModule,
  MiaixzMessageParams,
  MiaixzMessages,
  MiaixzMessageSource,
  MiaixzTranslator,
} from "@miaixz/sdk/i18n";

/**
 * Configures the React adapter for an existing SDK internationalization runtime.
 *
 * @public
 */
export interface MiaixzLocaleProviderProps {
  /**
   * Supplies the sole SDK-owned internationalization runtime.
   */
  readonly i18n: MiaixzI18n;

  /**
   * Renders the subtree that consumes the locale context.
   */
  readonly children: ReactNode;
}

/**
 * Exposes the SDK snapshot and translator through React context.
 *
 * @public
 */
export interface MiaixzLocaleContextValue extends MiaixzI18nSnapshot {
  /**
   * Resolves localized messages through the supplied SDK runtime.
   */
  readonly t: MiaixzTranslator;
}

/**
 * Provides all built-in UI messages in English and Simplified Chinese.
 *
 * @public
 */
export const miaixzUiMessages: MiaixzMessageCatalog = Object.freeze({
  "en-US": Object.freeze({
    "ui.loading": "Loading",
    "ui.search": "Search",
    "ui.search.clear": "Clear search",
    "ui.dialog.close": "Close dialog",
    "ui.drawer.close": "Close drawer",
    "ui.notification.dismiss": "Dismiss notification",
    "ui.pagination.label": "Pagination",
    "ui.pagination.previous": "Previous page",
    "ui.pagination.next": "Next page",
    "ui.pagination.page": "Page {page}",
    "ui.breadcrumb.label": "Breadcrumb",
    "ui.menu.label": "Menu",
    "ui.sectionNavigation.label": "Section navigation",
    "ui.action.dismiss": "Dismiss",
    "ui.action.cancel": "Cancel",
    "ui.action.retry": "Retry",
    "ui.action.remove": "Remove",
    "ui.confirm.confirmationInputLabel": "Confirmation text",
    "ui.combobox.loadError": "Options could not be loaded",
    "ui.tree.loadError": "Child items could not be loaded",
    "ui.table.selectRow": "Select row",
    "ui.table.selectPage": "Select current page",
    "ui.upload.queued": "Queued",
    "ui.upload.uploading": "Uploading",
    "ui.upload.success": "Upload complete",
    "ui.upload.error": "Upload failed",
    "ui.upload.cancelled": "Upload cancelled",
    "ui.error.locale.providerMissing": "A Miaixz locale provider is required",
    "ui.error.toast.providerMissing": "useToast must be used inside Toaster",
    "ui.error.tabs.providerMissing": "Tab components must be used inside Tabs",
    "ui.error.progress.maxInvalid": "The progress maximum must be greater than zero",
    "ui.error.progress.valueInvalid": "The progress value must be finite",
    "ui.error.options.sourceInvalid": "Exactly one option source is required",
    "ui.error.controlled.valueInvalid": "The controlled value configuration is invalid",
    "ui.error.controlled.inputInvalid": "The controlled input configuration is invalid",
    "ui.error.controlled.modeChanged": "The component control mode cannot change after mounting",
    "ui.error.selection.limitInvalid": "The selection limit must be a positive integer",
    "ui.error.tree.duplicateId": "Tree node identifiers must be unique",
    "ui.error.table.duplicateColumnId": "Table column identifiers must be unique",
    "ui.error.table.duplicateRowId": "Table row identifiers must be unique",
    "ui.error.file.typeNotAccepted": "The selected file type is not accepted",
    "ui.error.file.tooLarge": "The selected file is too large",
    "ui.error.file.countExceeded": "Too many files were selected",
    "ui.error.file.maxFilesInvalid": "The maximum file count is invalid",
    "ui.error.file.maxSizeInvalid": "The maximum file size is invalid",
    "ui.error.upload.progressInvalid": "Upload progress must be from zero through one hundred",
  }),
  "zh-CN": Object.freeze({
    "ui.loading": "加载中",
    "ui.search": "搜索",
    "ui.search.clear": "清除搜索内容",
    "ui.dialog.close": "关闭对话框",
    "ui.drawer.close": "关闭抽屉",
    "ui.notification.dismiss": "关闭通知",
    "ui.pagination.label": "分页导航",
    "ui.pagination.previous": "上一页",
    "ui.pagination.next": "下一页",
    "ui.pagination.page": "第 {page} 页",
    "ui.breadcrumb.label": "面包屑导航",
    "ui.menu.label": "菜单",
    "ui.sectionNavigation.label": "分区导航",
    "ui.action.dismiss": "关闭",
    "ui.action.cancel": "取消",
    "ui.action.retry": "重试",
    "ui.action.remove": "移除",
    "ui.confirm.confirmationInputLabel": "确认文本",
    "ui.combobox.loadError": "无法加载选项",
    "ui.tree.loadError": "无法加载子项",
    "ui.table.selectRow": "选择行",
    "ui.table.selectPage": "选择当前页",
    "ui.upload.queued": "等待上传",
    "ui.upload.uploading": "上传中",
    "ui.upload.success": "上传完成",
    "ui.upload.error": "上传失败",
    "ui.upload.cancelled": "已取消上传",
    "ui.error.locale.providerMissing": "需要 Miaixz 多语言提供器",
    "ui.error.toast.providerMissing": "useToast 必须在 Toaster 内使用",
    "ui.error.tabs.providerMissing": "Tab 组件必须在 Tabs 内使用",
    "ui.error.progress.maxInvalid": "进度最大值必须大于零",
    "ui.error.progress.valueInvalid": "进度值必须是有限数值",
    "ui.error.options.sourceInvalid": "必须且只能提供一个选项来源",
    "ui.error.controlled.valueInvalid": "受控值配置无效",
    "ui.error.controlled.inputInvalid": "受控输入配置无效",
    "ui.error.controlled.modeChanged": "组件挂载后不能切换控制模式",
    "ui.error.selection.limitInvalid": "选择上限必须是正整数",
    "ui.error.tree.duplicateId": "树节点标识必须唯一",
    "ui.error.table.duplicateColumnId": "表格列标识必须唯一",
    "ui.error.table.duplicateRowId": "表格行标识必须唯一",
    "ui.error.file.typeNotAccepted": "不支持所选文件类型",
    "ui.error.file.tooLarge": "所选文件过大",
    "ui.error.file.countExceeded": "选择的文件数量过多",
    "ui.error.file.maxFilesInvalid": "最大文件数量无效",
    "ui.error.file.maxSizeInvalid": "最大文件大小无效",
    "ui.error.upload.progressInvalid": "上传进度必须在零到一百之间",
  }),
});

const MiaixzLocaleContext = createContext<MiaixzLocaleContextValue | undefined>(undefined);
const registeredUiRuntimes = new WeakSet<MiaixzI18n>();

/**
 * Registers UI package resources once for each SDK runtime instance.
 *
 * @param i18n - SDK runtime receiving built-in UI resources.
 */
function registerUiMessages(i18n: MiaixzI18n): void {
  if (registeredUiRuntimes.has(i18n)) return;
  for (const [locale, messages] of Object.entries(miaixzUiMessages)) {
    i18n.registerMessages("ui", locale, messages, "builtin");
  }
  registeredUiRuntimes.add(i18n);
}

/**
 * Adapts one SDK internationalization runtime to a React subtree.
 *
 * @param props - SDK runtime and child subtree.
 * @returns React context provider bound to the SDK snapshot.
 * @public
 */
export function MiaixzLocaleProvider(props: MiaixzLocaleProviderProps) {
  const { i18n, children } = props;
  registerUiMessages(i18n);
  const snapshot = useSyncExternalStore(
    (listener) => i18n.subscribe(listener),
    () => i18n.getSnapshot(),
    () => i18n.getSnapshot(),
  );

  useEffect(() => {
    void i18n.loadNamespace("ui", snapshot.locale).catch(() => undefined);
  }, [i18n, snapshot.locale]);

  const value = useMemo<MiaixzLocaleContextValue>(
    () => ({ ...snapshot, t: i18n.t }),
    [i18n, snapshot],
  );
  return <MiaixzLocaleContext.Provider value={value}>{children}</MiaixzLocaleContext.Provider>;
}

/**
 * Returns the nearest SDK-backed locale context.
 *
 * @returns Active locale snapshot and translator.
 * @throws MiaixzUiError When called outside a Miaixz locale provider.
 * @public
 */
export function useMiaixzLocale(): MiaixzLocaleContextValue {
  const value = useContext(MiaixzLocaleContext);
  if (value !== undefined) return value;
  const messageKey = "ui.error.locale.providerMissing";
  throw new MiaixzUiError(messageKey, {
    code: "UI_LOCALE_PROVIDER_MISSING",
    messageKey,
  });
}
