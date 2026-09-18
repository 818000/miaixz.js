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

import { forwardRef, type HTMLAttributes, type ReactElement } from "react";

import { Dropzone } from "../dropzone/dropzone.js";
import type { DropzoneRejection } from "../dropzone/dropzone.types.js";
import type { AvatarProps } from "./avatar.types.js";

/**
 * Configures an Avatar-backed image selection surface.
 *
 * @public
 */
export interface AvatarPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly accept?: string;
  readonly children: ReactElement<AvatarProps>;
  readonly disabled?: boolean;
  readonly label: string;
  readonly maxSizeBytes?: number;
  readonly onFile: (file: File) => void;
  readonly onReject?: (rejections: readonly DropzoneRejection[]) => void;
}

/**
 * Renders a borderless avatar that opens the platform file picker and accepts image drops.
 *
 * @public
 */
export const AvatarPicker = forwardRef<HTMLDivElement, AvatarPickerProps>(function AvatarPicker(
  {
    accept = "image/*",
    children,
    disabled = false,
    label,
    maxSizeBytes,
    onFile,
    onReject,
    ...rootNativeProps
  },
  ref,
): ReactElement {
  return (
    <Dropzone
      {...rootNativeProps}
      accept={accept}
      disabled={disabled}
      label={label}
      {...(maxSizeBytes === undefined ? {} : { maxSizeBytes })}
      onFiles={(files) => {
        const file = files[0];
        if (file !== undefined) onFile(file);
      }}
      {...(onReject === undefined ? {} : { onReject })}
      ref={ref}
      slotProps={{
        root: { className: "miaixz-avatar-picker" },
        trigger: { className: "miaixz-avatar-picker-trigger" },
        content: { className: "miaixz-avatar-picker-content" },
      }}
    >
      {children}
    </Dropzone>
  );
});
