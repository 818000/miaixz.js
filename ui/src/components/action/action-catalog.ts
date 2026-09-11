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

import type { MiaixzIconName } from "../../icons/index.js";
import type { ActionConfirm, ActionPlacement, ActionTone } from "./action.types.js";
import type { ActionIntent } from "./action-intent.js";

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
  readonly tone: ActionTone;
  /**
   * Default action placement.
   */
  readonly placement: ActionPlacement;
  /**
   * Required confirmation strength.
   */
  readonly confirm: ActionConfirm;
}

/**
 * Freezes labels, icons, tones, placement and confirmation policy for shared actions.
 *
 * @public
 */
export const actionCatalog: Readonly<Record<ActionIntent, ActionCatalogEntry>> = Object.freeze({
  create: {
    labelKey: "ui.action.create",
    icon: "Plus",
    tone: "brand",
    placement: "visible",
    confirm: "none",
  },
  edit: {
    labelKey: "ui.action.edit",
    icon: "Pencil",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  view: {
    labelKey: "ui.action.view",
    icon: "Eye",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  import: {
    labelKey: "ui.action.import",
    icon: "Upload",
    tone: "neutral",
    placement: "overflow",
    confirm: "none",
  },
  export: {
    labelKey: "ui.action.export",
    icon: "Download",
    tone: "neutral",
    placement: "overflow",
    confirm: "none",
  },
  copy: {
    labelKey: "ui.action.copy",
    icon: "Copy",
    tone: "neutral",
    placement: "overflow",
    confirm: "none",
  },
  refresh: {
    labelKey: "ui.action.refresh",
    icon: "RefreshCw",
    tone: "neutral",
    placement: "overflow",
    confirm: "none",
  },
  validate: {
    labelKey: "ui.action.validate",
    icon: "ShieldCheck",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  configure: {
    labelKey: "ui.action.configure",
    icon: "Settings",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  invite: {
    labelKey: "ui.action.invite",
    icon: "UserPlus",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  "add-member": {
    labelKey: "ui.action.add-member",
    icon: "UserPlus",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  "reset-password": {
    labelKey: "ui.action.reset-password",
    icon: "KeyRound",
    tone: "neutral",
    placement: "overflow",
    confirm: "normal",
  },
  "enter-tenant": {
    labelKey: "ui.action.enter-tenant",
    icon: "LogIn",
    tone: "neutral",
    placement: "visible",
    confirm: "none",
  },
  enable: {
    labelKey: "ui.action.enable",
    icon: "CircleCheck",
    tone: "neutral",
    placement: "overflow",
    confirm: "normal",
  },
  disable: {
    labelKey: "ui.action.disable",
    icon: "Ban",
    tone: "danger",
    placement: "overflow",
    confirm: "danger",
  },
  freeze: {
    labelKey: "ui.action.freeze",
    icon: "Snowflake",
    tone: "danger",
    placement: "overflow",
    confirm: "danger",
  },
  archive: {
    labelKey: "ui.action.archive",
    icon: "Archive",
    tone: "danger",
    placement: "overflow",
    confirm: "danger",
  },
  revoke: {
    labelKey: "ui.action.revoke",
    icon: "ShieldX",
    tone: "danger",
    placement: "overflow",
    confirm: "danger",
  },
  delete: {
    labelKey: "ui.action.delete",
    icon: "Trash2",
    tone: "danger",
    placement: "overflow",
    confirm: "danger",
  },
  save: {
    labelKey: "ui.action.save",
    icon: "Save",
    tone: "brand",
    placement: "form-primary",
    confirm: "none",
  },
  submit: {
    labelKey: "ui.action.submit",
    icon: "Send",
    tone: "brand",
    placement: "form-primary",
    confirm: "none",
  },
  publish: {
    labelKey: "ui.action.publish",
    icon: "Rocket",
    tone: "brand",
    placement: "form-primary",
    confirm: "normal",
  },
  cancel: {
    labelKey: "ui.action.cancel",
    icon: "CircleX",
    tone: "neutral",
    placement: "form-secondary",
    confirm: "none",
  },
  close: {
    labelKey: "ui.action.close",
    icon: "X",
    tone: "neutral",
    placement: "icon",
    confirm: "none",
  },
  back: {
    labelKey: "ui.action.back",
    icon: "ArrowLeft",
    tone: "neutral",
    placement: "icon",
    confirm: "none",
  },
  favorite: {
    labelKey: "ui.action.favorite",
    icon: "Star",
    tone: "neutral",
    placement: "icon",
    confirm: "none",
  },
  more: {
    labelKey: "ui.action.more",
    icon: "Ellipsis",
    tone: "neutral",
    placement: "icon",
    confirm: "none",
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
