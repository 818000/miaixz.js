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

import type { MiaixzIconName } from "../../icons/icon-name.generated.js";
import type { ActionIntent } from "./types.js";

/**
 * Defines one immutable entry in the shared action catalog.
 */
export interface ActionCatalogEntry {
  /**
   * Localized message key.
   */
  readonly labelKey: `ui.action.${ActionIntent}`;
  /**
   * Framework icon name.
   */
  readonly icon: MiaixzIconName;
  /**
   * Semantic visual tone.
   */
  readonly tone: "neutral" | "brand" | "danger";
}

/**
 * Freezes labels, icons, and tones for shared product actions.
 *
 * @public
 */
export const actionCatalog: Readonly<Record<ActionIntent, ActionCatalogEntry>> = Object.freeze({
  create: {
    labelKey: "ui.action.create",
    icon: "Plus",
    tone: "brand",
  },
  edit: {
    labelKey: "ui.action.edit",
    icon: "Pencil",
    tone: "neutral",
  },
  view: {
    labelKey: "ui.action.view",
    icon: "Eye",
    tone: "neutral",
  },
  import: {
    labelKey: "ui.action.import",
    icon: "Upload",
    tone: "neutral",
  },
  export: {
    labelKey: "ui.action.export",
    icon: "Download",
    tone: "neutral",
  },
  copy: {
    labelKey: "ui.action.copy",
    icon: "Copy",
    tone: "neutral",
  },
  refresh: {
    labelKey: "ui.action.refresh",
    icon: "RefreshCw",
    tone: "neutral",
  },
  validate: {
    labelKey: "ui.action.validate",
    icon: "ShieldCheck",
    tone: "neutral",
  },
  configure: {
    labelKey: "ui.action.configure",
    icon: "Settings",
    tone: "neutral",
  },
  invite: {
    labelKey: "ui.action.invite",
    icon: "UserPlus",
    tone: "neutral",
  },
  "add-member": {
    labelKey: "ui.action.add-member",
    icon: "UserPlus",
    tone: "neutral",
  },
  "reset-password": {
    labelKey: "ui.action.reset-password",
    icon: "KeyRound",
    tone: "neutral",
  },
  "enter-tenant": {
    labelKey: "ui.action.enter-tenant",
    icon: "LogIn",
    tone: "neutral",
  },
  enable: {
    labelKey: "ui.action.enable",
    icon: "CircleCheck",
    tone: "neutral",
  },
  disable: {
    labelKey: "ui.action.disable",
    icon: "Ban",
    tone: "danger",
  },
  freeze: {
    labelKey: "ui.action.freeze",
    icon: "Snowflake",
    tone: "danger",
  },
  archive: {
    labelKey: "ui.action.archive",
    icon: "Archive",
    tone: "danger",
  },
  revoke: {
    labelKey: "ui.action.revoke",
    icon: "ShieldX",
    tone: "danger",
  },
  delete: {
    labelKey: "ui.action.delete",
    icon: "Trash2",
    tone: "danger",
  },
  save: {
    labelKey: "ui.action.save",
    icon: "Save",
    tone: "brand",
  },
  submit: {
    labelKey: "ui.action.submit",
    icon: "Send",
    tone: "brand",
  },
  publish: {
    labelKey: "ui.action.publish",
    icon: "Rocket",
    tone: "brand",
  },
  cancel: {
    labelKey: "ui.action.cancel",
    icon: "CircleX",
    tone: "neutral",
  },
  close: {
    labelKey: "ui.action.close",
    icon: "X",
    tone: "neutral",
  },
  back: {
    labelKey: "ui.action.back",
    icon: "ArrowLeft",
    tone: "neutral",
  },
  favorite: {
    labelKey: "ui.action.favorite",
    icon: "Star",
    tone: "neutral",
  },
  more: {
    labelKey: "ui.action.more",
    icon: "Ellipsis",
    tone: "neutral",
  },
});

/**
 * Reads one immutable action presentation recipe.
 *
 * @param intent - Shared action meaning.
 * @returns The matching catalog entry.
 * @public
 */
export function getActionCatalogEntry(intent: ActionIntent): ActionCatalogEntry {
  return actionCatalog[intent];
}
