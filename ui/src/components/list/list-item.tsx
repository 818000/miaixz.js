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

/* eslint-disable jsdoc/require-jsdoc --
 * Public ListItem contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { HTMLAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import { useListContext } from "./list-context.js";
import { ListItemControl } from "./list-item-control.js";
import type { ListItemOwnerState, ListItemProps, ListItemRootAttributes } from "./list.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

type InternalListItemRootAttributes = ListItemRootAttributes &
  Pick<HTMLAttributes<HTMLLIElement>, "id"> & {
    readonly "data-tone"?: string;
    readonly "data-kind"?: string;
  };

/*
 * Renders the sole public list row structure. @public
 */
export const ListItem = withMiaixzThemeComponent(
  "ListItem",
  forwardRef<HTMLLIElement, ListItemProps>(function ListItem(item, ref) {
    const {
      id,
      icon,
      content,
      title,
      description,
      meta,
      actions,
      tone = "neutral",
      slotProps,
      kind: _kind,
      href: _href,
      onAction: _onAction,
      disabled: _disabled,
      divProps: _divProps,
      anchorProps: _anchorProps,
      buttonProps: _buttonProps,
      ...rootProps
    } = item;
    const context = useListContext();
    const ownerState: ListItemOwnerState = {
      kind: item.kind,
      tone,
      density: context.density,
      surface: context.surface,
    };
    const primaryContent = (
      <>
        {icon !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-list-icon" },
              slotProps: slotProps?.icon,
            })}
          >
            {icon}
          </span>
        )}
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-list-content" },
            slotProps: slotProps?.content,
          })}
        >
          {content !== undefined ? (
            content
          ) : (
            <>
              <div className="miaixz-list-title">{title}</div>
              {description !== undefined && (
                <div className="miaixz-list-description">{description}</div>
              )}
            </>
          )}
        </div>
        {meta !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-list-meta" },
              slotProps: slotProps?.meta,
            })}
          >
            {meta}
          </span>
        )}
      </>
    );
    return (
      <li
        {...mergeMiaixzSlotProps<ListItemOwnerState, InternalListItemRootAttributes, HTMLLIElement>(
          {
            ownerState,
            defaultProps: { className: "miaixz-list-item" },
            componentProps: rootProps,
            slotProps: slotProps?.root as MiaixzSlotProps<
              ListItemOwnerState,
              InternalListItemRootAttributes
            >,
            forwardedRef: ref,
            internalProps: { id, "data-tone": tone, "data-kind": item.kind },
            ownedProps: ["id"],
          },
        )}
      >
        <ListItemControl item={item} ownerState={ownerState} slotProps={slotProps}>
          {primaryContent}
        </ListItemControl>
        {actions !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-list-actions" },
              slotProps: slotProps?.actions,
            })}
          >
            {actions}
          </span>
        )}
      </li>
    );
  }),
);
