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

import { forwardRef, useState } from "react";

import { clamp, classNames } from "../shared/class-names.js";
import type { ImageViewLabels, ImageViewProps } from "./image-view.types.js";

const defaultLabels: ImageViewLabels = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  rotateLeft: "Rotate left",
  rotateRight: "Rotate right",
};

/**
 * Renders an image with optional client-side zoom and rotation controls.
 *
 * @public
 */
export const ImageView = forwardRef<HTMLDivElement, ImageViewProps>(function ImageView(
  {
    src,
    alt,
    controls = true,
    initialScale = 1,
    minScale = 0.25,
    maxScale = 4,
    scaleStep = 0.25,
    labels: labelOverrides,
    actions,
    imageProps,
    className,
    ...rootProps
  },
  ref,
) {
  const [scale, setScale] = useState(() => clamp(initialScale, minScale, maxScale));
  const [rotation, setRotation] = useState(0);
  const labels = { ...defaultLabels, ...labelOverrides };
  const transform = `scale(${scale}) rotate(${rotation}deg)`;

  return (
    <div
      {...rootProps}
      className={classNames("miaixz-view", "miaixz-view-image", className)}
      ref={ref}
    >
      {(controls || actions !== undefined) && (
        <div aria-label="Image preview controls" className="miaixz-view-toolbar" role="toolbar">
          {controls && (
            <>
              <button
                aria-label={labels.zoomOut}
                className="miaixz-view-command"
                disabled={scale <= minScale}
                onClick={() => setScale((value) => clamp(value - scaleStep, minScale, maxScale))}
                title={labels.zoomOut}
                type="button"
              >
                −
              </button>
              <output aria-live="polite" className="miaixz-view-value">
                {Math.round(scale * 100)}%
              </output>
              <button
                aria-label={labels.zoomIn}
                className="miaixz-view-command"
                disabled={scale >= maxScale}
                onClick={() => setScale((value) => clamp(value + scaleStep, minScale, maxScale))}
                title={labels.zoomIn}
                type="button"
              >
                +
              </button>
              <button
                aria-label={labels.rotateLeft}
                className="miaixz-view-command"
                onClick={() => setRotation((value) => value - 90)}
                title={labels.rotateLeft}
                type="button"
              >
                ↺
              </button>
              <button
                aria-label={labels.rotateRight}
                className="miaixz-view-command"
                onClick={() => setRotation((value) => value + 90)}
                title={labels.rotateRight}
                type="button"
              >
                ↻
              </button>
            </>
          )}
          {actions}
        </div>
      )}
      <div className="miaixz-view-stage">
        <img
          {...imageProps}
          alt={alt}
          className={classNames("miaixz-view-image-content", imageProps?.className)}
          src={src}
          style={{ ...imageProps?.style, transform }}
        />
      </div>
    </div>
  );
});
