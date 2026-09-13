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

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/* eslint-disable jsdoc/require-jsdoc --
 * The private structural feedback properties are self-describing.
 */

/**
 * Defines feedback announcement priority independently from visual tone.
 */
export type MiaixzFeedbackLive = "polite" | "assertive" | "off";

/**
 * Configures the shared structural renderer used by Alert and Notice.
 */
export interface MiaixzFeedbackProps {
  readonly tone: MiaixzFeedbackTone;
  readonly rootProps: HTMLAttributes<HTMLDivElement>;
  readonly iconProps: HTMLAttributes<HTMLSpanElement>;
  readonly contentProps: HTMLAttributes<HTMLDivElement>;
  readonly messageProps: HTMLAttributes<HTMLDivElement>;
  readonly titleProps?: HTMLAttributes<HTMLDivElement> | undefined;
  readonly actionsProps?: HTMLAttributes<HTMLDivElement> | undefined;
  readonly dismissProps?: HTMLAttributes<HTMLSpanElement> | undefined;
  readonly title?: ReactNode | undefined;
  readonly message: ReactNode;
  readonly actions?: ReactNode | undefined;
  readonly dismissLabel?: string | undefined;
  readonly onDismiss?: (() => void) | undefined;
}
