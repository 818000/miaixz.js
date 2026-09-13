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

import type { ThemeComponents } from "../../src/theme/components.js";

/* eslint-disable miaixz/require-multiline --
 * TypeScript error directives must remain line comments immediately before their target.
 */

type ExpectedComponentName =
  | "Pressable"
  | "Button"
  | "ButtonLink"
  | "ActionText"
  | "IconButton"
  | "ActionBar"
  | "MoreActions"
  | "RowActions"
  | "FormActions"
  | "Field"
  | "Input"
  | "Textarea"
  | "Search"
  | "Checkbox"
  | "Radio"
  | "RadioGroup"
  | "Switch"
  | "Range"
  | "Select"
  | "Combobox"
  | "Picker"
  | "Alert"
  | "Notice"
  | "Overlay"
  | "Toast"
  | "Toaster"
  | "Tooltip"
  | "Popover"
  | "Dropdown"
  | "Dialog"
  | "Confirm"
  | "Drawer"
  | "Toolbar"
  | "Tabs"
  | "View"
  | "Panel"
  | "PanelHeader"
  | "PanelFooter"
  | "PanelRow"
  | "List"
  | "ListItem"
  | "ListCounter"
  | "ListMarker"
  | "Metric"
  | "Metrics"
  | "Graph"
  | "Avatar"
  | "Divider"
  | "Spinner"
  | "Icon"
  | "Hidden"
  | "Cluster"
  | "Grid"
  | "Split"
  | "Stack"
  | "Dropzone"
  | "Upload"
  | "Locale"
  | "Appearance"
  | "Badge"
  | "Status"
  | "Progress"
  | "Skeleton"
  | "Empty"
  | "Bar"
  | "Brand"
  | "Scroll"
  | "Entry"
  | "Page"
  | "Header"
  | "Shell"
  | "Sidebar"
  | "Breadcrumb"
  | "Navigation"
  | "NavigationRail"
  | "NavigationRailGroup"
  | "Pagination"
  | "Sections"
  | "Table"
  | "TableHeader"
  | "TableBody"
  | "TableRow"
  | "TableHead"
  | "TableCell"
  | "TableContainer"
  | "TableFooter"
  | "TableCaption"
  | "Datagrid"
  | "Descriptions"
  | "Tree"
  | "Steps"
  | "Timeline"
  | "EditorLayout"
  | "EditorSummary"
  | "EditorSection"
  | "EditorFieldset"
  | "EditorFields"
  | "EditorActions"
  | "EditorBox"
  | "EditorGroup"
  | "EditorOverview"
  | "EditorPicker"
  | "EditorStatus"
  | "Sparkline"
  | "Donut"
  | "Columns"
  | "Heatmap"
  | "HeatmapLegend";

type Assert<T extends true> = T;
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;

type RegistryIsExact = Assert<Equal<keyof ThemeComponents, ExpectedComponentName>>;

const buttonTheme: NonNullable<ThemeComponents["Button"]> = {
  defaultProps: { size: "large" },
  variants: [{ props: { tone: "brand", loading: false }, slotClassNames: { root: "brand" } }],
  slotClassNames: { label: "label" },
};

const invalidComponent: ThemeComponents = {
  // @ts-expect-error Unknown component names are not accepted.
  Unknown: {},
};

const invalidSlot: NonNullable<ThemeComponents["Button"]> = {
  // @ts-expect-error Unknown component slots are not accepted.
  slotClassNames: { content: "content" },
};

const invalidOwnerState: NonNullable<ThemeComponents["Button"]> = {
  variants: [
    {
      // @ts-expect-error React nodes are not owner-state variant selectors.
      props: { children: "invalid" },
      slotClassNames: { root: "invalid" },
    },
  ],
};

void buttonTheme;
void invalidComponent;
void invalidSlot;
void invalidOwnerState;
type _RegistryIsExact = RegistryIsExact;
