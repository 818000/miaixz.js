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

/**
 * Shared native panel-surface recipes. @public
 */
export interface PanelStyleOptions {
  /**
   * Selects frame-only or directly composed content/navigation surfaces.
   */
  variant?: "plain" | "content" | "navigation" | "section";
  /**
   * Selects the inherited transparent surface or an explicit panel fill.
   */
  surface?: "default" | "filled";
  /**
   * Retains consumer layout classes.
   */
  className?: string;
}

/**
 * Standalone framed action footer. @public
 */
export interface PanelFooterProps extends HTMLAttributes<HTMLElement> {
  /**
   * Standalone frame or an inset footer inside an existing panel.
   */
  variant?: "framed" | "inset" | "metadata" | "summary" | "caption" | "divided" | "legend";
}
/**
 * A divided content row, independent of business data. @public
 */
export interface PanelRowProps extends HTMLAttributes<HTMLElement> {
  /**
   * Controls whether contents distribute across the row or retain their natural order.
   */
  distribution?: "between" | "start";
  /**
   * Preserves list semantics when used inside ul/ol.
   */
  as?: "article" | "li";
  /**
   * Selects the content spacing without changing row height.
   */
  spacing?: "default" | "comfortable";
}

/**
 * Configures a framed content surface.
 *
 * @public
 */
export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Selects an optional compact-radius frame and card padding.
   */
  frame?: "default" | "compact" | "card" | "compact-card" | "inset";
  /**
   * Selects an optional raised-on-hover interaction without changing default panels.
   */
  interaction?: "default" | "lift";
  /**
   * Selects native semantics for directly composed surfaces.
   */
  as?: "section" | "aside" | "article" | "header" | "div";
  /**
   * Removes body inline padding while preserving header and footer spacing.
   */
  bodyFlush?: boolean;
  /**
   * Removes all body padding for edge-to-edge composed content.
   */
  bodyPadding?: "default" | "none";
  /**
   * Keeps short titles and actions side by side in a narrow panel.
   */
  headerLayout?: "responsive" | "inline";
  /**
   * Selects whether the body grows to fill the panel.
   */
  bodyLayout?: "content" | "fill";
  /**
   * Selects the body spacing preset.
   */
  bodyGap?: "default" | "none";
  /**
   * Selects the dashboard body height preset.
   */
  bodySize?: "default" | "medium" | "tall";
  /**
   * Selects the panel header height preset.
   */
  headerSize?: "default" | "compact" | "entity" | "note";
  /**
   * Selects an optional minimum-height preset for tall local navigation panels.
   */
  minHeight?: "default" | "tall";
  /**
   * Enables narrow-screen horizontal body scrolling.
   */
  responsiveBodyScroll?: boolean;
  /**
   * Selects a reusable panel composition.
   */
  variant?: "dashboard" | "default" | "plain" | "content" | "navigation" | "section";
  /**
   * Selects the filled panel surface or a transparent background.
   *
   * @defaultValue `"default"`
   */
  surface?: "default" | "transparent" | "filled";
  /**
   * Supplies consistently spaced panel sections.
   */
  sections?: readonly ReactNode[];
  /**
   * Supplies the optional panel heading.
   */
  title?: ReactNode;
  /**
   * Supplies supporting panel description content.
   */
  description?: ReactNode;
  /**
   * Displays panel-level actions.
   */
  actions?: ReactNode;
  /**
   * Displays a compact leading visual beside the title and description.
   */
  leading?: ReactNode;
  /**
   * Supplies the panel footer content.
   */
  footer?: ReactNode;
  /**
   * Applies the elevated surface shadow.
   *
   * @defaultValue `false`
   */
  raised?: boolean;
  /**
   * Applies the selected surface treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
  /**
   * Enables interactive hover treatment.
   *
   * @defaultValue `false`
   */
  interactive?: boolean;
  /**
   * Removes inline padding from panel regions.
   *
   * @defaultValue `false`
   */
  flush?: boolean;
  /**
   * Selects the semantic heading level.
   *
   * @defaultValue `3`
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}
