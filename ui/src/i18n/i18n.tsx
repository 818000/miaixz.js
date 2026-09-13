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

import type {
  MiaixzI18n,
  MiaixzI18nSnapshot,
  MiaixzLocaleDescriptor,
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

import { MiaixzUiError } from "../errors/ui-error.js";

export type {
  MiaixzI18n,
  MiaixzI18nSnapshot,
  MiaixzLocale,
  MiaixzLocaleDefinition,
  MiaixzLocaleDescriptor,
  MiaixzLocaleDirection,
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
export { defineLocale, MiaixzLocaleCatalog, miaixzBuiltInLocales } from "@miaixz/sdk/i18n";

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

  /**
   * Ordered immutable locale descriptors available to global selectors.
   */
  readonly locales: readonly MiaixzLocaleDescriptor[];

  /**
   * Loads and activates a registered locale or alias.
   */
  readonly setLocale: (locale: string) => Promise<void>;
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
    "ui.navigation.more": "More",
    "ui.action.dismiss": "Dismiss",
    "ui.action.cancel": "Cancel",
    "ui.action.retry": "Retry",
    "ui.action.remove": "Remove",
    "ui.action.create": "Create",
    "ui.action.edit": "Edit",
    "ui.action.view": "View",
    "ui.action.import": "Import",
    "ui.action.export": "Export",
    "ui.action.copy": "Copy",
    "ui.action.refresh": "Refresh",
    "ui.action.validate": "Validate",
    "ui.action.configure": "Configure",
    "ui.action.invite": "Invite",
    "ui.action.add-member": "Add member",
    "ui.action.reset-password": "Reset password",
    "ui.action.enter-tenant": "Enter tenant",
    "ui.action.enable": "Enable",
    "ui.action.disable": "Disable",
    "ui.action.freeze": "Freeze",
    "ui.action.archive": "Archive",
    "ui.action.revoke": "Revoke",
    "ui.action.delete": "Delete",
    "ui.action.save": "Save",
    "ui.action.submit": "Submit",
    "ui.action.publish": "Publish",
    "ui.action.close": "Close",
    "ui.action.back": "Back",
    "ui.action.favorite": "Favorite",
    "ui.action.more": "More actions",
    "ui.appearance.title": "Appearance",
    "ui.appearance.description": "Adjust language and interface appearance",
    "ui.appearance.open": "Open appearance settings",
    "ui.appearance.close": "Close appearance settings",
    "ui.appearance.theme": "Theme",
    "ui.appearance.language": "Language",
    "ui.appearance.language.description": "Choose the language used by the interface",
    "ui.appearance.language.current": "Current language",
    "ui.appearance.language.open": "Change interface language",
    "ui.appearance.language.back": "Back to appearance settings",
    "ui.appearance.language.search": "Search languages",
    "ui.appearance.language.empty": "No matching languages",
    "ui.appearance.mode": "Display mode",
    "ui.appearance.density": "Density",
    "ui.appearance.header": "Header behavior",
    "ui.appearance.light": "Light",
    "ui.appearance.dark": "Dark",
    "ui.appearance.system": "Follow system",
    "ui.appearance.compact": "Compact",
    "ui.appearance.standard": "Standard",
    "ui.appearance.comfortable": "Comfortable",
    "ui.appearance.fixed": "Fixed",
    "ui.appearance.scroll": "Scroll with content",
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
    "ui.collection.empty": "No options",
    "ui.collection.refineSearch": "Too many results. Refine your search.",
    "ui.picker.search": "Search options",
    "ui.select.required": "Select an option",
    "ui.sections.empty": "No items",
    "ui.appearance.readOnly": "This setting is read-only",
    "ui.confirm.failed": "The operation could not be completed",
    "ui.sparkline.empty": "No finite values",
    "ui.sparkline.summary": "First {first}; last {last}; minimum {minimum}; maximum {maximum}",
    "ui.donut.segment": "Segment",
    "ui.donut.value": "Value",
    "ui.donut.percentage": "Percentage",
    "ui.columns.category": "Category",
    "ui.heatmap.cellLabel": "{row}, {column}: {level}",
    "ui.heatmap.legendDescription":
      "Level 0: {level0}; level 1: {level1}; level 2: {level2}; level 3: {level3}; level 4: {level4}; level 5: {level5}",
    "ui.diagram.graph.controls": "{label} view controls",
    "ui.diagram.graph.zoomOut": "Zoom out",
    "ui.diagram.graph.zoomIn": "Zoom in",
    "ui.diagram.graph.resetView": "Reset view",
    "ui.diagram.graph.zoomValue": "Zoom {value}%",
    "ui.diagram.graph.source": "Source",
    "ui.diagram.graph.relation": "Relationship",
    "ui.diagram.graph.target": "Target",
    "ui.diagram.graph.nodeDescription": "{label}, {description}",
    "ui.diagram.graph.pointsTo": "Points to",
    "ui.diagram.graph.relatedTo": "Related to",
    "ui.error.accessible.nameInvalid": "An accessible name is required",
    "ui.error.slot.ownedPropConflict": "A slot cannot replace component-owned semantics",
    "ui.error.button.linkRendererInvalid": "The button link renderer must resolve to an anchor",
    "ui.error.action.duplicateId": "Action identifiers must be unique",
    "ui.error.field.multipleControls": "A field can own only one primary control",
    "ui.error.field.controlIdInvalid": "The field control identifier is invalid",
    "ui.error.field.requiredConflict": "Field and control required states conflict",
    "ui.error.field.invalidConflict": "Field and control invalid states conflict",
    "ui.error.field.disabledConflict": "Field and control disabled states conflict",
    "ui.error.collection.duplicateId": "Collection item identifiers must be unique",
    "ui.error.collection.duplicateValue": "Collection item values must be unique",
    "ui.error.collection.textValueInvalid": "Focusable collection items require text values",
    "ui.error.collection.visibleLimit": "The visible collection limit was exceeded",
    "ui.error.select.emptyOptionValue": "Select option values cannot be empty",
    "ui.error.tooltip.triggerInvalid": "The tooltip trigger must resolve to an HTML element",
    "ui.error.tooltip.delayInvalid": "Tooltip delays must be non-negative finite numbers",
    "ui.error.popover.triggerInvalid": "The popover trigger must resolve to a button",
    "ui.error.popover.offsetInvalid": "The popover offset must be a non-negative finite number",
    "ui.error.drawer.widthInvalid": "The drawer width must be a positive finite number",
    "ui.error.drawer.insetInvalid": "The drawer inset must be a non-negative finite number",
    "ui.error.upload.concurrencyInvalid": "Upload concurrency must be a positive integer",
    "ui.error.upload.retryPolicyInvalid": "The upload retry policy is invalid",
    "ui.error.upload.duplicateFileId": "Upload file identifiers must be unique",
    "ui.error.upload.fileStateInvalid": "The upload file state is invalid",
    "ui.error.locale.updateFailed": "The locale could not be updated",
    "ui.error.locale.globalDuplicate": "Only one document locale owner is allowed",
    "ui.error.appearance.positionInvalid": "The appearance position must be finite",
    "ui.error.pagination.pageCountInvalid": "The page count must be a non-negative integer",
    "ui.error.pagination.pageInvalid": "The current page is outside the valid range",
    "ui.error.pagination.siblingCountInvalid": "The sibling count must be a non-negative integer",
    "ui.error.navigation.duplicateId": "Navigation item identifiers must be unique",
    "ui.error.navigation.textValueInvalid": "Navigation items require a text value",
    "ui.error.tabs.duplicateValue": "Tab values must be unique",
    "ui.error.tabs.valueInvalid": "The selected tab value is invalid",
    "ui.error.locale.providerMissing": "A Miaixz locale provider is required",
    "ui.error.toast.providerMissing": "useToast must be used inside Toaster",
    "ui.error.progress.maxInvalid": "The progress maximum must be greater than zero",
    "ui.error.progress.valueInvalid": "The progress value must be finite",
    "ui.error.donut.duplicateSegmentId": "Donut segment identifiers must be unique",
    "ui.error.donut.valueInvalid": "Donut segment values must be non-negative finite numbers",
    "ui.error.columns.seriesCountInvalid": "Columns require one or two series",
    "ui.error.columns.duplicateSeriesId": "Column series identifiers must be unique",
    "ui.error.columns.valueLengthInvalid": "Column series values must match the categories",
    "ui.error.columns.valueInvalid": "Column values must be non-negative finite numbers",
    "ui.error.columns.maximumInvalid": "The columns maximum is invalid",
    "ui.error.heatmap.dimensionsInvalid": "Heatmap dimensions do not match the labels",
    "ui.error.heatmap.levelInvalid": "Heatmap levels must be integers from zero through five",
    "ui.error.page.labelledByInvalid": "The page label reference is invalid",
    "ui.error.panel.labelInvalid": "The panel requires one accessible name",
    "ui.error.toast.durationInvalid": "The toast duration must be finite",
    "ui.error.toaster.maxVisibleInvalid": "The visible toast limit must be a positive integer",
    "ui.error.tree.visibleLimit": "The visible tree node limit was exceeded",
    "ui.error.tree.textValueInvalid": "Tree nodes require a text value",
    "ui.error.steps.duplicateId": "Step identifiers must be unique",
    "ui.error.timeline.duplicateId": "Timeline item identifiers must be unique",
    "ui.error.graph.duplicateNodeId": "Graph node identifiers must be unique",
    "ui.error.graph.nodePositionInvalid":
      "Graph node positions must be from zero through one hundred",
    "ui.error.graph.duplicateEdgeId": "Graph edge identifiers must be unique",
    "ui.error.graph.edgeEndpointMissing": "A graph edge references a missing node",
    "ui.error.options.sourceInvalid": "Exactly one option source is required",
    "ui.error.controlled.valueInvalid": "The controlled value configuration is invalid",
    "ui.warning.controlled.modeChanged": "The component control mode changed after mounting",
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
    "ui.theme.notFound": "The requested theme was not found",
    "ui.theme.loadFailed": "The theme could not be loaded",
    "ui.theme.loadAborted": "The theme load was cancelled",
    "ui.theme.invalid": "The theme definition is invalid",
    "ui.theme.tokenUnknown": "The theme contains an unknown token",
    "ui.theme.tokenMissing": "The theme is missing a required token",
    "ui.theme.geometryInvalid": "The theme geometry is invalid",
    "ui.theme.surfaceInvalid": "The theme surface mapping is invalid",
    "ui.theme.contrastInvalid": "The theme color contrast is insufficient",
    "ui.theme.inheritanceInvalid": "The theme inheritance chain is invalid",
    "ui.theme.schemaUnsupported": "The theme schema version is unsupported",
    "ui.theme.duplicate": "The theme identifier is already registered",
    "ui.theme.fallbackInvalid": "The fallback theme is invalid",
    "ui.theme.globalDuplicate": "Only one global Theme instance is allowed",
    "ui.theme.applyFailed": "The theme could not be applied",
    "ui.theme.persistFailed": "The theme preference could not be persisted",
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
    "ui.navigation.more": "更多",
    "ui.action.dismiss": "关闭",
    "ui.action.cancel": "取消",
    "ui.action.retry": "重试",
    "ui.action.remove": "移除",
    "ui.action.create": "新建",
    "ui.action.edit": "编辑",
    "ui.action.view": "查看",
    "ui.action.import": "导入",
    "ui.action.export": "导出",
    "ui.action.copy": "复制",
    "ui.action.refresh": "刷新",
    "ui.action.validate": "校验",
    "ui.action.configure": "配置",
    "ui.action.invite": "邀请",
    "ui.action.add-member": "添加成员",
    "ui.action.reset-password": "重置密码",
    "ui.action.enter-tenant": "进入企业",
    "ui.action.enable": "启用",
    "ui.action.disable": "禁用",
    "ui.action.freeze": "冻结",
    "ui.action.archive": "归档",
    "ui.action.revoke": "撤销",
    "ui.action.delete": "删除",
    "ui.action.save": "保存",
    "ui.action.submit": "提交",
    "ui.action.publish": "发布",
    "ui.action.close": "关闭",
    "ui.action.back": "返回",
    "ui.action.favorite": "收藏",
    "ui.action.more": "更多操作",
    "ui.appearance.title": "主题与风格",
    "ui.appearance.description": "调整界面语言与显示方式",
    "ui.appearance.open": "打开外观设置",
    "ui.appearance.close": "关闭外观设置",
    "ui.appearance.theme": "界面主题",
    "ui.appearance.language": "界面语言",
    "ui.appearance.language.description": "选择界面和内容使用的语言",
    "ui.appearance.language.current": "当前语言",
    "ui.appearance.language.open": "切换界面语言",
    "ui.appearance.language.back": "返回外观设置",
    "ui.appearance.language.search": "搜索语言",
    "ui.appearance.language.empty": "没有匹配的语言",
    "ui.appearance.mode": "显示模式",
    "ui.appearance.density": "界面密度",
    "ui.appearance.header": "顶部功能区域",
    "ui.appearance.light": "浅色",
    "ui.appearance.dark": "深色",
    "ui.appearance.system": "跟随系统",
    "ui.appearance.compact": "紧凑",
    "ui.appearance.standard": "标准",
    "ui.appearance.comfortable": "宽松",
    "ui.appearance.fixed": "锁定",
    "ui.appearance.scroll": "随内容滚动",
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
    "ui.collection.empty": "没有可用选项",
    "ui.collection.refineSearch": "结果过多，请缩小搜索范围",
    "ui.picker.search": "搜索选项",
    "ui.select.required": "请选择一个选项",
    "ui.sections.empty": "暂无项目",
    "ui.appearance.readOnly": "此设置为只读",
    "ui.confirm.failed": "操作未能完成",
    "ui.sparkline.empty": "没有有限数值",
    "ui.sparkline.summary": "首值 {first}；末值 {last}；最小值 {minimum}；最大值 {maximum}",
    "ui.donut.segment": "分段",
    "ui.donut.value": "数值",
    "ui.donut.percentage": "占比",
    "ui.columns.category": "分类",
    "ui.heatmap.cellLabel": "{row}，{column}：{level}",
    "ui.heatmap.legendDescription":
      "等级 0：{level0}；等级 1：{level1}；等级 2：{level2}；等级 3：{level3}；等级 4：{level4}；等级 5：{level5}",
    "ui.diagram.graph.controls": "{label}视图控制",
    "ui.diagram.graph.zoomOut": "缩小关系图",
    "ui.diagram.graph.zoomIn": "放大关系图",
    "ui.diagram.graph.resetView": "重置视图",
    "ui.diagram.graph.zoomValue": "缩放 {value}%",
    "ui.diagram.graph.source": "来源",
    "ui.diagram.graph.relation": "关系",
    "ui.diagram.graph.target": "目标",
    "ui.diagram.graph.nodeDescription": "{label}，{description}",
    "ui.diagram.graph.pointsTo": "指向",
    "ui.diagram.graph.relatedTo": "关联",
    "ui.error.accessible.nameInvalid": "必须提供可访问名称",
    "ui.error.slot.ownedPropConflict": "slot 不能覆盖组件拥有的语义属性",
    "ui.error.button.linkRendererInvalid": "按钮链接 renderer 必须解析为锚点",
    "ui.error.action.duplicateId": "操作标识必须唯一",
    "ui.error.field.multipleControls": "一个字段只能拥有一个主控件",
    "ui.error.field.controlIdInvalid": "字段控件标识无效",
    "ui.error.field.requiredConflict": "字段与控件的必填状态冲突",
    "ui.error.field.invalidConflict": "字段与控件的无效状态冲突",
    "ui.error.field.disabledConflict": "字段与控件的禁用状态冲突",
    "ui.error.collection.duplicateId": "集合项目标识必须唯一",
    "ui.error.collection.duplicateValue": "集合项目值必须唯一",
    "ui.error.collection.textValueInvalid": "可聚焦集合项目必须提供文本值",
    "ui.error.collection.visibleLimit": "已超过集合可见项目上限",
    "ui.error.select.emptyOptionValue": "选择项的值不能为空",
    "ui.error.tooltip.triggerInvalid": "提示触发器必须解析为 HTML 元素",
    "ui.error.tooltip.delayInvalid": "提示延迟必须是非负有限数",
    "ui.error.popover.triggerInvalid": "弹出层触发器必须解析为按钮",
    "ui.error.popover.offsetInvalid": "弹出层偏移必须是非负有限数",
    "ui.error.drawer.widthInvalid": "抽屉宽度必须是正有限数",
    "ui.error.drawer.insetInvalid": "抽屉内缩必须是非负有限数",
    "ui.error.upload.concurrencyInvalid": "上传并发数必须是正整数",
    "ui.error.upload.retryPolicyInvalid": "上传重试策略无效",
    "ui.error.upload.duplicateFileId": "上传文件标识必须唯一",
    "ui.error.upload.fileStateInvalid": "上传文件状态无效",
    "ui.error.locale.updateFailed": "无法更新语言设置",
    "ui.error.locale.globalDuplicate": "一个文档只允许一个语言所有者",
    "ui.error.appearance.positionInvalid": "外观设置位置必须是有限数",
    "ui.error.pagination.pageCountInvalid": "页数必须是非负整数",
    "ui.error.pagination.pageInvalid": "当前页超出有效范围",
    "ui.error.pagination.siblingCountInvalid": "相邻页数必须是非负整数",
    "ui.error.navigation.duplicateId": "导航项目标识必须唯一",
    "ui.error.navigation.textValueInvalid": "导航项目必须提供文本值",
    "ui.error.tabs.duplicateValue": "标签页值必须唯一",
    "ui.error.tabs.valueInvalid": "选中的标签页值无效",
    "ui.error.locale.providerMissing": "需要 Miaixz 多语言提供器",
    "ui.error.toast.providerMissing": "useToast 必须在 Toaster 内使用",
    "ui.error.progress.maxInvalid": "进度最大值必须大于零",
    "ui.error.progress.valueInvalid": "进度值必须是有限数值",
    "ui.error.donut.duplicateSegmentId": "环形图分段标识必须唯一",
    "ui.error.donut.valueInvalid": "环形图分段值必须是非负有限数",
    "ui.error.columns.seriesCountInvalid": "柱状图必须包含一个或两个序列",
    "ui.error.columns.duplicateSeriesId": "柱状图序列标识必须唯一",
    "ui.error.columns.valueLengthInvalid": "柱状图序列值必须与分类数量一致",
    "ui.error.columns.valueInvalid": "柱状图数值必须是非负有限数",
    "ui.error.columns.maximumInvalid": "柱状图最大值无效",
    "ui.error.heatmap.dimensionsInvalid": "热力图尺寸与标签不一致",
    "ui.error.heatmap.levelInvalid": "热力图等级必须是零到五之间的整数",
    "ui.error.page.labelledByInvalid": "页面标签引用无效",
    "ui.error.panel.labelInvalid": "面板必须提供一个可访问名称",
    "ui.error.toast.durationInvalid": "通知时长必须是有限数",
    "ui.error.toaster.maxVisibleInvalid": "可见通知上限必须是正整数",
    "ui.error.tree.visibleLimit": "已超过树的可见节点上限",
    "ui.error.tree.textValueInvalid": "树节点必须提供文本值",
    "ui.error.steps.duplicateId": "步骤标识必须唯一",
    "ui.error.timeline.duplicateId": "时间线项目标识必须唯一",
    "ui.error.graph.duplicateNodeId": "关系图节点标识必须唯一",
    "ui.error.graph.nodePositionInvalid": "关系图节点位置必须在零到一百之间",
    "ui.error.graph.duplicateEdgeId": "关系图连线标识必须唯一",
    "ui.error.graph.edgeEndpointMissing": "关系图连线引用了不存在的节点",
    "ui.error.options.sourceInvalid": "必须且只能提供一个选项来源",
    "ui.error.controlled.valueInvalid": "受控值配置无效",
    "ui.warning.controlled.modeChanged": "组件挂载后切换了控制模式",
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
    "ui.theme.notFound": "未找到请求的主题",
    "ui.theme.loadFailed": "无法加载主题",
    "ui.theme.loadAborted": "主题加载已取消",
    "ui.theme.invalid": "主题定义无效",
    "ui.theme.tokenUnknown": "主题包含未知令牌",
    "ui.theme.tokenMissing": "主题缺少必要令牌",
    "ui.theme.geometryInvalid": "主题几何令牌无效",
    "ui.theme.surfaceInvalid": "主题表面映射无效",
    "ui.theme.contrastInvalid": "主题颜色对比度不足",
    "ui.theme.inheritanceInvalid": "主题继承链无效",
    "ui.theme.schemaUnsupported": "不支持该主题 schema 版本",
    "ui.theme.duplicate": "主题标识已注册",
    "ui.theme.fallbackInvalid": "后备主题无效",
    "ui.theme.globalDuplicate": "只允许一个全局 Theme 实例",
    "ui.theme.applyFailed": "无法应用主题",
    "ui.theme.persistFailed": "无法持久化主题偏好",
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
    () => ({
      ...snapshot,
      t: i18n.t,
      locales: i18n.locales,
      setLocale: (locale) => i18n.changeLocale(locale),
    }),
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
  throw new MiaixzUiError({ code: "UI_LOCALE_PROVIDER_MISSING" });
}
