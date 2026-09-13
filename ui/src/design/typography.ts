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
 * Defines theme-controlled typography families.
 *
 * @public
 */
export interface MiaixzThemeTypography {
  /**
   * Sans-serif font-family list.
   */
  readonly familySans?: string;
  /**
   * Monospace font-family list.
   */
  readonly familyMono?: string;
  /**
   * Caption font size in pixels.
   */
  readonly captionSize?: number;
  /**
   * Caption line height in pixels.
   */
  readonly captionLineHeight?: number;
  /**
   * Body font size in pixels.
   */
  readonly bodySize?: number;
  /**
   * Body line height in pixels.
   */
  readonly bodyLineHeight?: number;
  /**
   * Section-title font size in pixels.
   */
  readonly sectionTitleSize?: number;
  /**
   * Section-title line height in pixels.
   */
  readonly sectionTitleLineHeight?: number;
  /**
   * Page-title font size in pixels.
   */
  readonly pageTitleSize?: number;
  /**
   * Page-title line height in pixels.
   */
  readonly pageTitleLineHeight?: number;
  /**
   * Metric font size in pixels.
   */
  readonly metricSize?: number;
  /**
   * Metric line height in pixels.
   */
  readonly metricLineHeight?: number;
  /**
   * Display font size in pixels.
   */
  readonly displaySize?: number;
  /**
   * Display line height in pixels.
   */
  readonly displayLineHeight?: number;
  /**
   * Compact body font size in pixels.
   */
  readonly compactBodySize?: number;
  /**
   * Compact body line height in pixels.
   */
  readonly compactBodyLineHeight?: number;
  /**
   * Compact caption font size in pixels.
   */
  readonly compactCaptionSize?: number;
  /**
   * Compact caption line height in pixels.
   */
  readonly compactCaptionLineHeight?: number;
  /**
   * Compact section-title font size in pixels.
   */
  readonly compactSectionTitleSize?: number;
  /**
   * Compact section-title line height in pixels.
   */
  readonly compactSectionTitleLineHeight?: number;
  /**
   * Compact metric font size in pixels.
   */
  readonly compactMetricSize?: number;
  /**
   * Compact metric line height in pixels.
   */
  readonly compactMetricLineHeight?: number;
}

/**
 * Freezes the theme typography field order used by validators and serializers.
 *
 * @public
 */
export const miaixzThemeTypographyFields = [
  "familySans",
  "familyMono",
  "captionSize",
  "captionLineHeight",
  "bodySize",
  "bodyLineHeight",
  "sectionTitleSize",
  "sectionTitleLineHeight",
  "pageTitleSize",
  "pageTitleLineHeight",
  "metricSize",
  "metricLineHeight",
  "displaySize",
  "displayLineHeight",
  "compactBodySize",
  "compactBodyLineHeight",
  "compactCaptionSize",
  "compactCaptionLineHeight",
  "compactSectionTitleSize",
  "compactSectionTitleLineHeight",
  "compactMetricSize",
  "compactMetricLineHeight",
] as const;

/**
 * Freezes the fields whose values are font-family lists.
 *
 * @public
 */
export const miaixzThemeFontFamilyFields = ["familySans", "familyMono"] as const;

/**
 * Defines semantic typography defaults added to schema version one.
 *
 * @public
 */
export const miaixzThemeTypographyDefaults = Object.freeze({
  captionSize: 12,
  captionLineHeight: 18,
  bodySize: 14,
  bodyLineHeight: 22,
  sectionTitleSize: 16,
  sectionTitleLineHeight: 24,
  pageTitleSize: 20,
  pageTitleLineHeight: 28,
  metricSize: 24,
  metricLineHeight: 32,
  displaySize: 32,
  displayLineHeight: 40,
  compactBodySize: 12,
  compactBodyLineHeight: 14,
  compactCaptionSize: 10,
  compactCaptionLineHeight: 14,
  compactSectionTitleSize: 11,
  compactSectionTitleLineHeight: 15,
  compactMetricSize: 22,
  compactMetricLineHeight: 26,
});

/**
 * Defines the immutable component base font size in pixels.
 *
 * @public
 */
export const miaixzBaseFontSize = 14;

/**
 * Defines the immutable component base line height in pixels.
 *
 * @public
 */
export const miaixzBaseLineHeight = 22;

/**
 * Defines the accepted font-family string length range.
 *
 * @public
 */
export const miaixzThemeFontFamilyLength = Object.freeze({ min: 1, max: 256 });
