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

/**
 * Configures the global Appearance control. @public
 */
export interface AppearanceProps {
  /**
   * Selects the exact group set shown in the drawer.
   */
  readonly scope: "entry" | "authenticated";
  /**
   * Selects fixed or scrolling authenticated header behavior.
   */
  readonly headerBehavior?: "fixed" | "scroll";
  /**
   * Receives header behavior changes.
   */
  readonly onHeaderBehaviorChange?: (value: "fixed" | "scroll") => void;
  /**
   * Supplies the trigger block-start edge in pixels.
   */
  readonly positionBlockPx?: number;
  /**
   * Receives the final trigger block-start edge after movement.
   */
  readonly onPositionBlockPxChange?: (value: number) => void;
  /**
   * Enables pointer and keyboard vertical movement.
   *
   * @defaultValue `true`
   */
  readonly draggable?: boolean;
}
