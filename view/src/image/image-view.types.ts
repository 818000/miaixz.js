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

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Defines localized labels used by image preview controls.
 *
 * @public
 */
export interface ImageViewLabels {
  /**
   * Labels the image toolbar.
   */
  readonly toolbar: string;
  /**
   * Labels the zoom-in command.
   */
  readonly zoomIn: string;
  /**
   * Labels the zoom-out command.
   */
  readonly zoomOut: string;
  /**
   * Labels the counter-clockwise rotation command.
   */
  readonly rotateLeft: string;
  /**
   * Labels the clockwise rotation command.
   */
  readonly rotateRight: string;
}

/**
 * Defines native properties for stable ImageView slots.
 *
 * @public
 */
export interface ImageViewSlotProps {
  readonly toolbar?: Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "aria-label">;
  readonly stage?: Omit<ComponentPropsWithoutRef<"div">, "children">;
  readonly image?: Omit<ComponentPropsWithoutRef<"img">, "children" | "src" | "alt">;
}

/**
 * Configures an image preview surface.
 *
 * @public
 */
export interface ImageViewProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /**
   * Supplies the authorized image URL.
   */
  readonly src: string;
  /**
   * Describes the image for assistive technology.
   */
  readonly alt: string;
  /**
   * Shows the built-in zoom and rotation toolbar.
   *
   * @defaultValue `true`
   */
  readonly controls?: boolean;
  /**
   * Sets the initial image scale.
   *
   * @defaultValue `1`
   */
  readonly initialScale?: number;
  /**
   * Sets the smallest selectable scale.
   *
   * @defaultValue `0.25`
   */
  readonly minScale?: number;
  /**
   * Sets the largest selectable scale.
   *
   * @defaultValue `4`
   */
  readonly maxScale?: number;
  /**
   * Sets the scale change applied by each toolbar command.
   *
   * @defaultValue `0.25`
   */
  readonly scaleStep?: number;
  /**
   * Overrides built-in English toolbar labels.
   */
  readonly labels?: Partial<ImageViewLabels>;
  /**
   * Adds application-owned actions without assigning security meaning to their visibility.
   */
  readonly actions?: ReactNode;
  /**
   * Passes native properties to stable internal slots.
   */
  readonly slotProps?: ImageViewSlotProps;
}
