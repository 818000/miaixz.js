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

/* eslint-disable jsdoc/require-jsdoc -- Closed sparkline slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, SVGAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export interface SparklineOwnerState {
  readonly variant: "line" | "area";
  readonly size: "small" | "medium" | "large";
  readonly tone: MiaixzVisualTone;
  readonly showGrid: boolean;
  readonly state: "empty" | "ready";
}
export interface SparklineRootAttributes extends SVGAttributes<SVGSVGElement> {
  readonly "data-state"?: "empty" | "ready";
  readonly "data-tone"?: MiaixzVisualTone;
  readonly "data-variant"?: "line" | "area";
  readonly "data-size"?: "small" | "medium" | "large";
}
export interface SparklineSlotProps {
  readonly root?: MiaixzSlotProps<SparklineOwnerState, SparklineRootAttributes>;
  readonly grid?: MiaixzSlotProps<SparklineOwnerState, SVGAttributes<SVGPathElement>>;
  readonly area?: MiaixzSlotProps<SparklineOwnerState, SVGAttributes<SVGPolygonElement>>;
  readonly line?: MiaixzSlotProps<SparklineOwnerState, SVGAttributes<SVGPolylineElement>>;
  readonly points?: MiaixzSlotProps<SparklineOwnerState, SVGAttributes<SVGGElement>>;
  readonly title?: MiaixzSlotProps<SparklineOwnerState, HTMLAttributes<HTMLTitleElement>>;
  readonly description?: MiaixzSlotProps<SparklineOwnerState, SVGAttributes<SVGDescElement>>;
}
export interface SparklineProps extends Omit<
  SVGAttributes<SVGSVGElement>,
  "aria-label" | "children" | "color" | "values"
> {
  readonly values: readonly number[];
  readonly "aria-label": string;
  readonly tone?: MiaixzVisualTone;
  readonly variant?: "line" | "area";
  readonly size?: "small" | "medium" | "large";
  readonly showGrid?: boolean;
  readonly valueFormatter?: (value: number) => string;
  readonly description?: ReactNode;
  readonly slotProps?: SparklineSlotProps;
}
