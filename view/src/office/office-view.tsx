/**
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

import { forwardRef, useEffect, useId, useState } from "react";

import { classNames } from "../shared/class-names.js";
import { loadOnlyOfficeApi, type OnlyOfficeEditorInstance } from "./office-loader.js";
import type { OfficeViewLabels, OfficeViewProps } from "./office-view.types.js";

const defaultLabels: OfficeViewLabels = {
  loading: "Loading Office document",
  error: "Unable to preview this Office document",
};

/**
 * Normalizes values caught at the browser integration boundary.
 *
 * @param value - Unknown caught value.
 * @returns Error instance suitable for the component callback.
 */
function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Embeds an existing ONLYOFFICE Docs deployment with an externally authorized configuration.
 *
 * @public
 */
export const OfficeView = forwardRef<HTMLDivElement, OfficeViewProps>(function OfficeView(
  {
    documentServerUrl,
    config,
    scriptNonce,
    labels: labelOverrides,
    actions,
    onReady,
    onError,
    className,
    ...rootProps
  },
  ref,
) {
  const generatedId = useId();
  const targetId = `miaixz-view-office-${generatedId.replaceAll(":", "")}`;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const labels = { ...defaultLabels, ...labelOverrides };

  useEffect(() => {
    let active = true;
    let editor: OnlyOfficeEditorInstance | undefined;
    setStatus("loading");

    void loadOnlyOfficeApi(documentServerUrl, scriptNonce)
      .then((api) => {
        if (!active) return;
        editor = new api.DocEditor(targetId, config);
        setStatus("ready");
        onReady?.();
      })
      .catch((value: unknown) => {
        if (!active) return;
        const error = toError(value);
        setStatus("error");
        onError?.(error);
      });

    return () => {
      active = false;
      editor?.destroyEditor();
    };
  }, [config, documentServerUrl, onError, onReady, scriptNonce, targetId]);

  return (
    <div
      {...rootProps}
      className={classNames("miaixz-view", "miaixz-view-office", className)}
      ref={ref}
    >
      {actions !== undefined && <div className="miaixz-view-toolbar">{actions}</div>}
      <div className="miaixz-view-office-editor" id={targetId} />
      {status !== "ready" && (
        <div
          aria-live="polite"
          className="miaixz-view-status"
          role={status === "error" ? "alert" : "status"}
        >
          {status === "error" ? labels.error : labels.loading}
        </div>
      )}
    </div>
  );
});
