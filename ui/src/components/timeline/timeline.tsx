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

import type { TimelineProps } from "./timeline.types.js";
import { classNames } from "../../shared/class-names.js";

/**
 * Renders ordered events with readable status text and a continuous visual track.
 *
 * @param props - Ordered timeline content.
 * @returns The semantic ordered timeline.
 * @public
 */
export function Timeline(props: TimelineProps) {
  if (!("items" in props)) {
    return (
      <ol
        aria-label={props["aria-label"]}
        className={classNames(`miaixz-timeline-${props.variant}`, props.className)}
      >
        {props.children}
      </ol>
    );
  }
  const { "aria-label": ariaLabel, items } = props;
  return (
    <ol aria-label={ariaLabel} className="miaixz-timeline">
      {items.map((item) => (
        <li key={item.id} className="miaixz-timeline-item" data-tone={item.tone}>
          <span className="miaixz-timeline-node" aria-hidden="true" />
          <div className="miaixz-timeline-body">
            <div className="miaixz-timeline-heading">
              <strong className="miaixz-timeline-title">{item.title}</strong>
              <span className="miaixz-timeline-status">{item.status}</span>
            </div>
            {item.description !== undefined && (
              <div className="miaixz-timeline-description">{item.description}</div>
            )}
            {item.meta !== undefined && <div className="miaixz-timeline-meta">{item.meta}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
